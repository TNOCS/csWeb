import express              = require('express');
import ConfigurationService = require('../configuration/ConfigurationService');
import IApiServiceManager   = require('./IApiServiceManager');

interface IApiService {
    id: string;
    init(apiServiceManager: IApiServiceManager, server: express.Express, configurationService: ConfigurationService);
    shutdown();
}
export = IApiService;
