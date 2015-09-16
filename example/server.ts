require('rootpath')();
﻿import express = require('express');
import http = require('http');
import path = require('path');
//import offlineSearch          = require('cs-offline-search');
import cc = require("ServerComponents/dynamic/ClientConnection");
import creator = require('ServerComponents/creator/MapLayerFactory');
import ProjectRepositoryService = require('ServerComponents/creator/ProjectRepositoryService');
import DataSource = require("ServerComponents/dynamic/DataSource");
import MessageBus = require('ServerComponents/bus/MessageBus');
import BagDatabase = require('ServerComponents/database/BagDatabase');
import ConfigurationService = require('ServerComponents/configuration/ConfigurationService');
import DynamicProject = require("ServerComponents/dynamic/DynamicProject");
import LayerDirectory = require("ServerComponents/dynamic/LayerDirectory");
import store = require('ServerComponents/import/Store');
import ApiServiceManager = require('ServerComponents/api/ApiServiceManager');
import ApiManager = require('ServerComponents/api/ApiManager');
import RestAPI = require('ServerComponents/api/RestAPI');
import MqttAPI = require('ServerComponents/api/MqttAPI');
import SocketIOAPI = require('ServerComponents/api/SocketIOAPI');
import MongoDB = require('ServerComponents/api/MongoDB');
import FileStorage = require('ServerComponents/api/FileStorage');
import Winston = require('winston');
import AuthAPI = require('ServerComponents/api/AuthAPI');

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, {
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

var bagDatabase = new BagDatabase(config);
var mapLayerFactory = new creator.MapLayerFactory(bagDatabase, messageBus);
server.post('/projecttemplate', (req, res) => mapLayerFactory.process(req, res));
server.post('/bagcontours', (req, res) => mapLayerFactory.processBagContours(req, res));

server.use(express.static(path.join(__dirname, 'swagger')));

// Create the API service manager and add the services that you need
var apiServiceMgr = new ApiServiceManager(server, config);
// Resource types
var resourceTypeStore = new ProjectRepositoryService(new store.FolderStore({ storageFolder: "public/data/resourceTypes" }))
apiServiceMgr.addService(resourceTypeStore);

server.use(express.static(path.join(__dirname, 'public')));


var api = new ApiManager.ApiManager();
api.init();
api.authService = new AuthAPI.AuthAPI(api, server, '/api');
api.addConnector("rest", new RestAPI.RestAPI(server), {});
api.addConnector("socketio", new SocketIOAPI.SocketIOAPI(cm), {});
api.addConnector("mqtt", new MqttAPI.MqttAPI("localhost", 1883), {});
api.addConnector("mongo", new MongoDB.MongoDBStorage("127.0.0.1", 27017), {});
api.addConnector("file", new FileStorage.FileStorage(path.join(path.resolve(__dirname), "public/data/layers/")), {});


httpServer.listen(server.get('port'), () => {
    Winston.info('Express server listening on port ' + server.get('port'));
});
