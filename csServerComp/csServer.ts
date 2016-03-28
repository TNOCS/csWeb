import express = require('express');
import http = require('http');
import path = require('path');
import Winston = require('winston');

import csweb = require('./index');

export class csServerOptions {
    port = 3002;
    swagger: boolean;
    connectors: Object;
}

export class csServer {
    public server = express();
    public cm: csweb.ConnectionManager;
    public messageBus: csweb.MessageBusService;
    public httpServer;
    public config: csweb.ConfigurationService;
    public api: csweb.ApiManager;

    constructor(public dir: string, public options = new csServerOptions()) {

    }

    public start(started: Function) {
        var favicon = require('serve-favicon');
        var bodyParser = require('body-parser');
        this.httpServer = require('http').Server(this.server);
        this.cm = new csweb.ConnectionManager(this.httpServer);
        this.messageBus = new csweb.MessageBusService();
        this.config = new csweb.ConfigurationService('./configuration.json');

        // all environments 
        this.server.set('port', this.options.port);
        this.server.use(favicon(this.dir + '/public/favicon.ico'));
        //increased limit size, see: http://stackoverflow.com/questions/19917401/node-js-express-request-entity-too-large
        this.server.use(bodyParser.json({ limit: '25mb' })); // support json encoded bodies
        this.server.use(bodyParser.urlencoded({ limit: '25mb', extended: true })); // support encoded bodies

        this.config.add('server', 'http://localhost:' + this.options.port);

        if (this.options.swagger === true) this.server.use('/swagger', express.static(path.join(this.dir, 'swagger')));
        this.server.use(express.static(path.join(this.dir, 'public')));
        if (!this.options.hasOwnProperty('connectors')) this.options.connectors = {};
        var c = this.options.connectors;
        if (!c.hasOwnProperty('file')) c['file'] = { path: path.join(path.resolve(this.dir), 'public/data/api/') };
        var fs = new csweb.FileStorage(c['file'].path);

        this.httpServer.listen(this.server.get('port'), () => {
            Winston.info('Express server listening on port ' + this.server.get('port'));
            /* 
             * API platform
             */
            this.api = new csweb.ApiManager('cs', 'cs');
            this.api.init(path.join(path.resolve(this.dir), 'public/data/api'), () => {
                //api.authService = new csweb.AuthAPI(api, server, '/api');

                var connectors: { key: string, s: csweb.IConnector, options: any }[] = [{ key: 'rest', s: new csweb.RestAPI(this.server), options: {} },
                    { key: 'file', s: fs, options: {} },
                    { key: 'socketio', s: new csweb.SocketIOAPI(this.cm), options: {} }
                ];

                if (c.hasOwnProperty('mqtt')) connectors.push({ key: 'mqtt', s: new csweb.MqttAPI(c['mqtt'].server, c['mqtt'].port), options: {} });
                //if (c.hasOwnProperty('mongo')) connectors.push({ key: 'mongo', s: new csweb.MongoDBStorage(c['mongo'].server, c['mongo'].port), options: {} });                

                this.api.addConnectors(connectors, () => {
                    started();
                });
            });
        });
    }
}
