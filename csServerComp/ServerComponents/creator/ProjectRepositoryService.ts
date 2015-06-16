import express                    = require('express');
import IApiServiceManager         = require('../api/IApiServiceManager');
import IStore                     = require("../import/IStore");
import IProjectRepositoryService  = require("./IProjectRepositoryService");
import ConfigurationService       = require('../configuration/ConfigurationService');

/* Multiple storage engine supported, e.g. file system, mongo  */
class ProjectRepositoryService implements IProjectRepositoryService {
    private server: express.Express;
    private config: ConfigurationService;
    private resourceTypeUrl: string;
    id: string;

    constructor(private store: IStore) { }

    init(apiServiceManager: IApiServiceManager, server: express.Express, config: ConfigurationService) {
        this.server = server;
        this.config = config;
        this.resourceTypeUrl = apiServiceManager.BaseUrl + (config['resourceTypeAddress'] || '/resourceTypes');

        server.get(this.resourceTypeUrl, (req, res) => {
            var resourceTypes = this.getAll();
            res.send(resourceTypes);
        });

        /**
         * Create
         */
        server.post(this.resourceTypeUrl + '/:id', (req, res) => {
            var id = req.params.id;
            if (!this.endsWith(id, ".json")) id += ".json";
            var resourceType = req.body;
            console.log(resourceType);
            res.send(this.create(id, resourceType));
        });

        /**
         * Read
         */
        server.get(this.resourceTypeUrl + '/:id', (req, res) => {
            var id = req.params.id;
            this.get(id, res);
        });

        /**
         * Update
         */
        server.put(this.resourceTypeUrl + '/:id', (req, res) => {
            var id = req.params.id;
            var resourceType = req.body;
            res.send(this.update(id, resourceType));
        });

        /**
         * Delete
         */
        server.delete(this.resourceTypeUrl + '/:id', (req, res) => {
            var id = req.params.id;
            res.send(this.delete(id));
        });
    }

    private endsWith(str: string, suffix: string) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    };

    shutdown() {

    }

    getAll() {
        return this.store.getAll();
    }

    get(id: string, res: express.Response) {
        this.store.getAsync(id, res);
    }

    create(id: string, resourceType: Object) {
        return this.store.create(id, resourceType);
    }

    delete(id: string) {
        this.store.delete(id);
    }

    update(id: string, newObject: any) {
        this.store.update(id, newObject);
    }

}
export=ProjectRepositoryService;
