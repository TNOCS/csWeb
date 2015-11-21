import express = require('express');
import http = require('http');
import path = require('path');
import Winston = require('winston');

import csweb = require('./index');

export class csServerOptions {
    port = 3002    
}

export class csServer {
    public server = express();
    public cm: csweb.ConnectionManager;
    public messageBus: csweb.MessageBusService;
    public httpServer;
    public config: csweb.ConfigurationService;
    public api : csweb.ApiManager;

    constructor(public dir: string, public options = new csServerOptions()) {

    }

    public start(started: Function) { 
        var favicon = require('serve-favicon');
        var bodyParser = require('body-parser')
        this.httpServer = require('http').Server(this.server);
        this.cm = new csweb.ConnectionManager(this.httpServer);
        this.messageBus = new csweb.MessageBusService();
        this.config = new csweb.ConfigurationService('./configuration.json');

        //This line is required when using JX to run the server, or else the input-messages coming from the Excel file will cause an error: https://github.com/jxcore/jxcore/issues/119
        //require('http').setMaxHeaderLength(26214400);

        // all environments 
        this.options.port = this.options.port;

        this.server.set('port', this.options.port);
        this.server.use(favicon(this.dir + '/public/favicon.ico'));
        //increased limit size, see: http://stackoverflow.com/questions/19917401/node-js-express-request-entity-too-large
        this.server.use(bodyParser.json({ limit: '25mb' })); // support json encoded bodies
        this.server.use(bodyParser.urlencoded({ limit: '25mb', extended: true })); // support encoded bodies

        this.config.add("server", "http://localhost:" + this.options.port);

        // Select BAG-database source: either a (remote) Postgresql server (1st line) or a (local) sqlite3-db.
        var bagDatabase = new csweb.BagDatabase(this.config);
        //var bagDatabase = new LocalBag(path.resolve(dir, 'public/data/bagadres.db'));

        this.server.use(express.static(path.join(this.dir, 'swagger')));
        this.server.use(express.static(path.join(this.dir, 'public')));

        this.httpServer.listen(this.server.get('port'), () => {
            Winston.info('Express server listening on port ' + this.server.get('port'));            
            
             * API platform
             */
            this.api = new csweb.ApiManager('cs', 'cs');
            this.api.init(path.join(path.resolve(this.dir), "public/data/api"), () => {
                //api.authService = new csweb.AuthAPI(api, server, '/api');
                this.api.addConnectors(
                    [
                        { key: "rest", s: new csweb.RestAPI(this.server), options: {} },
                        { key: "mqtt", s: new csweb.MqttAPI("localhost", 1883), options: {} },
                        { key: "file", s: new csweb.FileStorage(path.join(path.resolve(this.dir), "public/data/api/")), options: {} },
                        { key: "socketio", s: new csweb.SocketIOAPI(this.cm), options: {} },
                        { key: "mongo", s: new csweb.MongoDBStorage("127.0.0.1", 27017), options: {} }
                    ],
                    () => {
                        started();
                    });
            
            /**
             * Excel 2 map functionality
             */
            var mapLayerFactory = new csweb.MapLayerFactory(bagDatabase, this.messageBus, this.api);
            this.server.post('/projecttemplate', (req, res) => mapLayerFactory.process(req, res));
            this.server.post('/bagcontours', (req, res) => mapLayerFactory.processBagContours(req, res));
            });

            /**
             * Excel 2 map functionality
             */
            var mapLayerFactory = new csweb.MapLayerFactory(bagDatabase, this.messageBus, api);
            this.server.post('/projecttemplate', (req, res) => mapLayerFactory.process(req, res));
            this.server.post('/bagcontours', (req, res) => mapLayerFactory.processBagContours(req, res));
        });
}
