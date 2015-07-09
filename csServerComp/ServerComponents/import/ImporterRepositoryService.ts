import express                    = require('express');
import IApiServiceManager         = require('../api/IApiServiceManager');
import IImport                    = require("./IImport");
import transform                  = require("./ITransform");
import IStore                     = require("./IStore");
import IImporterRepositoryService = require("./IImporterRepositoryService");
import ConfigurationService       = require('../configuration/ConfigurationService');
import request                    = require("request");
import JSONStream                 = require('JSONStream');
import CsvToJsonTransformer = require("./CsvToJsonTransformer");
import fs = require("fs");
import util = require("util");

var split = require("split");
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

            var strippedTransformers = [];
            transformers.forEach((t)=>{
              var stripped = {
                id: t.id,
                title: t.title,
                description: t.description,
                type: t.type
              }

              strippedTransformers.push(stripped);
            });

            res.send(strippedTransformers);
        });

        /**
         * Create
         */
        server.post(this.baseUrl, (req, res) => {
            var importer = req.body;
            console.log(importer);
            res.send(this.create(null, importer));
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

            var sourceRequest = request({ url: importer.sourceUrl });
            var stream: NodeJS.ReadWriteStream = sourceRequest.pipe(split());
            // var stream: NodeJS.ReadWriteStream = null;

            importer.transformers.forEach(transformerDefinition=>{
              var transformerInstance = this.getTransformerInstance(transformerDefinition);

              transformerInstance.initialize(transformerDefinition)

              if (!transformerInstance) {
                console.error("Unknown transformer type: " + transformerDefinition.type);
              }

              if (stream) {
                // Pipe to existing stream chain
                stream = stream.pipe(transformerInstance.create(config));
              }
              else{
                // Initialize stream chain from source request
                stream = sourceRequest.pipe(transformerInstance.create(config));
              }
            });

            var startTs = new Date();

            stream.on("end", ()=> {
              var currTs = new Date();
              var diff = ( currTs.getTime() - startTs.getTime() ) / 1000;
              console.log(new Date() + ": Finished in " + diff + " seconds");
            });

            console.log(new Date() + ": Started");
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

    getTransformerInstance(transformerDefinition: transform.ITransform) : transform.ITransform {
      var transformer = this.transformers.filter(t=>t.type == transformerDefinition.type)[0];

      var instance = Object.create(transformer);

      return instance;
/*
      var newInstance: any;

      switch(transformer.type) {
        case "CsvToJsonTransformer":
          newInstance = new CsvToJsonTransformer(transformerDefinition.title);
      }

      for (var prop in transformer) {
        newInstance[prop] = transformer[prop];
      }

      return newInstance;
*/
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

    create(id: string, importer: Object): Object {
        return this.store.create(id, importer);
    }

    delete(id: string) {
        this.store.delete(id);
    }

    update(importer: IImport) {
        this.store.update(null, importer);
    }

}
export=ImporterRepositoryService;
