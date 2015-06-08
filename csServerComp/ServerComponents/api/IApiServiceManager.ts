import express              = require('express');
import IApiService          = require('./IApiService');

interface IApiServiceManager {
    BaseUrl: string;
    addService(service: IApiService): string;
    findServiceById(serviceId: string): IApiService;
    removeService(serviceId: string);
}
export = IApiServiceManager;
