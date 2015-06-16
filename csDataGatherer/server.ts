import express                   = require('express');
import http                      = require('http');
import path                      = require('path');
import ITransform                = require('./ServerComponents/import/ITransform');
import BaseTransformer           = require('./ServerComponents/import/BaseTransformer');
import Store                     = require('./ServerComponents/import/Store');
import ImporterRepositoryService = require('./ServerComponents/import/ImporterRepositoryService');
import ConfigurationService      = require('./ServerComponents/configuration/ConfigurationService');
import ApiServiceManager         = require('./ServerComponents/api/ApiServiceManager');

var favicon = require('serve-favicon');
var bodyParser = require('body-parser')

var config = new ConfigurationService('./configuration.json');

var server     = express();
//var httpServer = require('http').Server(server);

// all environments
var port = "3456";
server.set('port', port);
// server.set('views', path.join(__dirname, 'views'));
// server.set('view engine', 'jade');
server.use(favicon(__dirname + '/public/favicon.ico'));
server.use(bodyParser.json()); // support json encoded bodies
server.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
//server.use(express.methodOverride());
//server.use(server.router);

server.use(express.static(path.join(__dirname, 'public')));

// Create the API service manager and add the services that you need
var apiServiceMgr = new ApiServiceManager(server, config);
var repoService = new ImporterRepositoryService(new Store.FileStore(config));
apiServiceMgr.addService(repoService);

var test1 = new BaseTransformer("Test 1");
//test1.
repoService.addTransformer(test1);
repoService.addTransformer(new BaseTransformer("Test 2"));
repoService.addTransformer(new BaseTransformer("Test 3"));

// development only
// if ('development' == server.get('env')) {
//     server.use(express.errorHandler());
// }

server.listen(server.get('port'),() => {
    console.log('Express server listening on port ' + server.get('port'));
});
