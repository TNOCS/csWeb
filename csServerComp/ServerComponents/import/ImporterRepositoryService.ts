import express                    = require('express');
import IApiServiceManager         = require('../api/IApiServiceManager');
import IImport                    = require("./IImport");
import transform                  = require("./ITransform");
import IStore                     = require("./IStore");
import IImporterRepositoryService = require("./IImporterRepositoryService");
import ConfigurationService       = require('../configuration/ConfigurationService');
import request                    = require("request");
import JSONStream                 = require('JSONStream');

var es = require('event-stream');

/* Multiple storage engine supported, e.g. file system, mongo  */
class ImporterRepositoryService implements IImporterRepositoryService {
    private server: express.Express;
    private config: ConfigurationService;
    private baseUrl: string;
    private transformers: transform.ITransform[] = [];
    id: string;

    constructor(private store: IStore) { }

    init(apiServiceManager: IApiServiceManager, server: express.Express, config: ConfigurationService) {
        this.server = server;
        this.config = config;
        this.baseUrl = apiServiceManager.BaseUrl + config['importAddress'] || '/importers';

        server.get(this.baseUrl, (req, res) => {
            var importers = this.getAll();
            res.send(importers);
        });

        server.get(this.baseUrl + "/transformers", (req, res) => {
            var transformers = this.getAllTransformers();
            res.send(transformers);
        });

        /**
         * Create
         */
        server.post(this.baseUrl, (req, res) => {
            var importer = req.body;
            console.log(importer);
            res.send(this.create(importer));
        });

        /**
         * Read
         */
        server.get(this.baseUrl + '/:id', (req, res) => {
            var id = req.params.id;
            res.send(this.get(id));
        });

        /**
         * Run
         */
        server.get(this.baseUrl + '/:id/run', (req, res) => {
            var id = req.params.id;

            var importer = this.get(id);
            importer.lastRun = new Date();

            request({ url: importer.sourceUrl })
                .pipe(JSONStream.parse('rows.*'))
                .pipe(es.mapSync(function(data) {
                    console.log(data);
                }));

            res.send("");
        });

        /**
         * Update
         */
        server.put(this.baseUrl + '/:id', (req, res) => {
            var id = req.params.id;
            var importer = req.body;
            res.send(this.update(importer));
        });

        /**
         * Delete
         */
        server.delete(this.baseUrl + '/:id', (req, res) => {
            var id = req.params.id;
            res.send(this.delete(id));
        });
    }

    shutdown() {

    }

    addTransformer(transformer: transform.ITransform) {
        this.transformers.push(transformer);
    }

    getAllTransformers() {
        return this.transformers;
    }

    getAll() {
        return this.store.getAll();
    }

    get(id: string): any {
        return this.store.get(id);
    }

    create(importer: Object): Object {
        return this.store.create(importer);
    }

    delete(id: string) {
        this.store.delete(id);
    }

    update(importer: IImport) {
        this.store.update(importer);
    }

}
export=ImporterRepositoryService;
