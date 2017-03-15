import ConfigurationService = require('../configuration/ConfigurationService');
import Location = require('./Location');
import IBagOptions = require('../database/IBagOptions');
import IAddressSource = require('../database/IAddressSource');
import request = require('request');
import http = require('http');
import _ = require('underscore');

export class NominatimSource implements IAddressSource.IAddressSource {
    private connectionString: string = 'http://nominatim.openstreetmap.org/search?';
    public name = 'nominatim (openstreetmap)';

    constructor(config: ConfigurationService.ConfigurationService) {
        if (config['osmUrl']) this.connectionString = config['osmUrl'];
    }

    public init() {};

    public searchAddress(query: string, limit: number = 15, callback: (searchResults) => void) {
        let url = this.connectionString;
        let params = {
            q: query,
            format: 'json',
            addressdetails: 1,
            polygon: 0
        };
        url += _.reduce(params, (memo, val, key) => {
            return memo + key + '=' + val + '&';
        }, '');
        console.log(`Find nominatim: ${url}`);
        request.get(url, (error: any, response: http.IncomingMessage, body: any) => {
            if (error) {
                console.log(`Error in nominatim search: ${error}`);
                callback(null);
                return;
            }
            if (body) {
                callback(JSON.parse(body));
            }
        });
    }

    public searchGemeente(query: string, limit: number = 15, callback: (searchResults) => void) {
        console.log('Not implemented');
        callback(null);
        return;
    }
}
