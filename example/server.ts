import express = require('express');
import http = require('http');
import path = require('path');
//import offlineSearch          = require('cs-offline-search');
import cc = require("./ServerComponents/dynamic/ClientConnection");
import creator = require('./ServerComponents/creator/MapLayerFactory');
import ProjectRepositoryService = require('./ServerComponents/creator/ProjectRepositoryService');
import DataSource = require("./ServerComponents/dynamic/DataSource");
import MessageBus = require('./ServerComponents/bus/MessageBus');
import BagDatabase = require('./ServerComponents/database/BagDatabase');
import LocalBag = require('./ServerComponents/database/LocalBag');
import ConfigurationService = require('./ServerComponents/configuration/ConfigurationService');
import DynamicProject = require("./ServerComponents/dynamic/DynamicProject");
import LayerDirectory = require("./ServerComponents/dynamic/LayerDirectory");
import store = require('./ServerComponents/import/Store');
import ApiServiceManager = require('./ServerComponents/api/ApiServiceManager');
import ApiManager = require('./ServerComponents/api/ApiManager');
import RestAPI = require('./ServerComponents/api/RestAPI');
import MqttAPI = require('./ServerComponents/api/MqttAPI');
import SocketIOAPI = require('./ServerComponents/api/SocketIOAPI');
import MongoDB = require('./ServerComponents/api/MongoDB');
import FileStorage = require('./ServerComponents/api/FileStorage');
import ImbAPI = require('./ServerComponents/api/ImbAPI');
import Winston = require('winston');
import AuthAPI = require('./ServerComponents/api/AuthAPI');

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    prettyPrint: true
});


var favicon = require('serve-favicon');
var bodyParser = require('body-parser')
var server = express();

var httpServer = require('http').Server(server);
var cm = new cc.ConnectionManager(httpServer);
var messageBus = new MessageBus.MessageBusService();
var config = new ConfigurationService('./configuration.json');

//This line is required when using JX to run the server, or else the input-messages coming from the Excel file will cause an error: https://github.com/jxcore/jxcore/issues/119
//require('http').setMaxHeaderLength(26214400);

// all environments
var port = "3002";
server.set('port', port);
server.use(favicon(__dirname + '/public/favicon.ico'));
//increased limit size, see: http://stackoverflow.com/questions/19917401/node-js-express-request-entity-too-large
server.use(bodyParser.json({ limit: '25mb' })); // support json encoded bodies
server.use(bodyParser.urlencoded({ limit: '25mb', extended: true })); // support encoded bodies

config.add("server", "http://localhost:" + port);

var ld = new LayerDirectory.LayerDirectory(server, cm);
ld.Start();

//var pr = new DynamicProject.DynamicProjectService(server, cm, messageBus);
//pr.Start(server);

var ds = new DataSource.DataSourceService(cm, "DataSource");
ds.start();
server.get("/datasource", ds.getDataSource);

// Select BAG-database source: either a (remote) Postgresql server (1st line) or a (local) sqlite3-db.
var bagDatabase = new BagDatabase(config);
//var bagDatabase = new LocalBag(path.resolve(__dirname, 'public/data/bagadres.db'));

server.use(express.static(path.join(__dirname, 'swagger')));

// Create the API service manager and add the services that you need
var apiServiceMgr = new ApiServiceManager(server, config);
// Resource types
var resourceTypeStore = new ProjectRepositoryService(new store.FolderStore({ storageFolder: "public/data/resourceTypes" }))
apiServiceMgr.addService(resourceTypeStore);

server.use(express.static(path.join(__dirname, 'public')));

var api = new ApiManager.ApiManager('cs', 'cs');

api.init(path.join(path.resolve(__dirname), "public/data/api"), () => {
    //api.authService = new AuthAPI.AuthAPI(api, server, '/api');
    api.addConnectors(
        [
            { key: "rest", s: new RestAPI.RestAPI(server), options: {} },
            { key: "mqtt", s: new MqttAPI.MqttAPI("localhost", 1883), options: {} },
            { key: "file", s: new FileStorage.FileStorage(path.join(path.resolve(__dirname), "public/data/api/")), options: {} },
            { key: "socketio", s: new SocketIOAPI.SocketIOAPI(cm), options: {} },
            { key: "mongo", s: new MongoDB.MongoDBStorage("127.0.0.1", 27017), options: {} }
            //{ key: "imb", s: new ImbAPI.ImbAPI("app-usdebug01.tsn.tno.nl", 4000),options: {} }

        ],
        () => {
            // create mobile layer
            api.addLayer();
        });
});

var mapLayerFactory = new creator.MapLayerFactory(bagDatabase, messageBus, api);
server.post('/projecttemplate', (req, res) => mapLayerFactory.process(req, res));
server.post('/bagcontours', (req, res) => mapLayerFactory.processBagContours(req, res));

httpServer.listen(server.get('port'), () => {
    Winston.info('Express server listening on port ' + server.get('port'));
});
