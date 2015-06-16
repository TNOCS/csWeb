import express                    = require('express');
import IApiServiceManager         = require('../api/IApiServiceManager');
import IStore                     = require("../import/IStore");
import IProjectRepositoryService  = require("./IProjectRepositoryService");
import ConfigurationService       = require('../configuration/ConfigurationService');

var es = require('event-stream');

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
        server.post(this.resourceTypeUrl, (req, res) => {
            var resourceType = req.body;
            console.log(resourceType);
            res.send(this.create(resourceType));
        });

        /**
         * Read
         */
        server.get(this.resourceTypeUrl + '/:id', (req, res) => {
            var id = req.params.id;
            res.send(this.get(id));
        });

        /**
         * Update
         */
        server.put(this.resourceTypeUrl + '/:id', (req, res) => {
            var id = req.params.id;
            var resourceType = req.body;
            res.send(this.update(resourceType));
        });

        /**
         * Delete
         */
        server.delete(this.resourceTypeUrl + '/:id', (req, res) => {
            var id = req.params.id;
            res.send(this.delete(id));
        });
    }

    shutdown() {

    }

    getAll() {
        return this.store.getAll();
    }

    get(id: string) {
        return this.store.get(id);
    }

    create(resourceType: Object) {
        return this.store.create(resourceType);
    }

    delete(id: string) {
        this.store.delete(id);
    }

    update(newObject: { [id: string]: Object }) {
        this.store.update(newObject);
    }

}
export=ProjectRepositoryService;
