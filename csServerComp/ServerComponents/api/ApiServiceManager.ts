import express              = require('express');
import ConfigurationService = require('../configuration/ConfigurationService');
import IApiService          = require('./IApiService');
import Utils                = require('../helpers/Utils');
import IApiServiceManager   = require('./IApiServiceManager');

class ApiServiceManager implements IApiServiceManager {
    private baseUrl: string;
    private dataUrl: string;

    private apiServices: IApiService[] = [];

    constructor(private server: express.Express, private config: ConfigurationService) {
        this.baseUrl = config['apiAddress'] || '/api';
        this.dataUrl = config['dataApiAddress'] || '/data';
    }

    get BaseUrl() { return this.baseUrl; }
    get DataUrl() { return this.dataUrl; }

    /**
     * Add a service, initialize it, and return the service GUID.
     */
    addService(service: IApiService) {
        service.id = Utils.newGuid();
        service.init(this, this.server, this.config);
        this.apiServices.push(service);
        return service.id;
    }

    /**
     * Find a service by ID (GUID). Returns null when no matching service is found.
     */
    findServiceById(serviceId: string): IApiService {
        for (let i = 0; i < this.apiServices.length; i++) {
            var service = this.apiServices[i];
            if (service.id !== serviceId) continue;
            return service;
        }
        return null;
    }

    /**
     * Remove service by ID (GUID).
     */
    removeService(serviceId: string) {
        for (let i = 0; i < this.apiServices.length; i++) {
            var service = this.apiServices[i];
            if (service.id !== serviceId) continue;
            service.shutdown();
            this.apiServices.slice(i, 1);
            return;
        }
    }
}
export = ApiServiceManager;
