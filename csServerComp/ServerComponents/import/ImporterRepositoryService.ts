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
import async = require("async");

var split = require("split");
var es = require('event-stream');

/* Multiple storage engine supported, e.g. file system, mongo  */
class ImporterRepositoryService implements IImporterRepositoryService {
    private server: express.Express;
    private config: ConfigurationService.ConfigurationService;
    private baseUrl: string;
    private transformers: transform.ITransform[] = [];
    id: string;

    constructor(private store: IStore) { }

    init(apiServiceManager: IApiServiceManager, server: express.Express, config: ConfigurationService.ConfigurationService) {
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

            var importer: IImport = this.get(id);
            importer.lastRun = new Date();

            this.runImporter(importer, (error: Error) => {
              res.send("");
            });
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

    runImporter(importer: IImport, callback: (error: Error)=>void) {
      var instances = [];
      async.each(importer.transformers, (transformerDefinition, next)=>{
        var transformerInstance = this.getTransformerInstance(transformerDefinition);

        if (!transformerInstance) {
          /*console.error("Unknown transformer type: " + transformerDefinition.type);*/
          next(new Error("Unknown transformer type: " + transformerDefinition.type));
          return;
        }
        instances.push(transformerInstance);

        transformerInstance.initialize(transformerDefinition, (error)=>{
          if (error) {
            next(error);
            return;
          }

          next();
        });
      },(error)=>{
        if (error) {
          console.log("Error initalizing transformers: " + error);
          return;
        }

        console.log("Transformers initialized");
        var sourceRequest = request({ url: importer.sourceUrl });
        // var stream: NodeJS.ReadWriteStream = null;
        var stream: NodeJS.ReadWriteStream = sourceRequest.pipe(split());

        instances.forEach(transformerInstance=>{

          if (stream) {
            // Pipe to existing stream chain
            stream = stream.pipe(transformerInstance.create(this.config));
          }
          else{
            // Initialize stream chain from source request
            stream = sourceRequest.pipe(transformerInstance.create(this.config));
          }
        });

        var index = 0;
        var startTs = new Date();
        var prevTs = new Date();

        stream.on("end", ()=> {
          var currTs = new Date();
          var diff = ( currTs.getTime() - startTs.getTime() ) / 1000;
          console.log(new Date() + ": Finished in " + diff + " seconds");

          if (callback) {
            callback(null);
          }
        });

        stream.pipe(es.mapSync(function(data) {

          var currTs = new Date();
          var diff = (currTs.getTime() - prevTs.getTime());
          if ( (index % 100) == 0) {

            console.log(new Date() + ": " + index + "(" + diff / 100 + "ms per feature)");

            prevTs = currTs;

          }
          // console.log(data);
          index++;
        }));

        console.log(new Date() + ": Started");
      });
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
