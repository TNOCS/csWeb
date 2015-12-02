import fs = require('fs');
import path = require('path');
import express = require('express');
import request = require('request');
import IApiService = require('../api/IApiService');
import IApiServiceManager = require('../api/IApiServiceManager');
import ConfigurationService = require('../configuration/ConfigurationService');


/* Multiple storage engine supported, e.g. file system, mongo  */
class ProxyService implements IApiService {
    private server: express.Express;
    private config: ConfigurationService.ConfigurationService;
    private baseUrl: string;
    id: string;

    init(apiServiceManager: IApiServiceManager, server: express.Express, config: ConfigurationService.ConfigurationService) {
        this.server = server;
        console.log('init proxy');

        this.baseUrl = apiServiceManager.BaseUrl + '/proxy';

        //console.log(this.baseUrl);
        server.get(this.baseUrl, (req, res) => {

            var id = req.query.url;
            console.log(id);
            this.getUrl(id, res);
        });
    }

    shutdown() { }

    private getUrl(feedUrl: string, res: express.Response) {
        console.log('proxy request: ' + feedUrl);
        //feedUrl = 'http://rss.politie.nl/rss/algemeen/ab/algemeen.xml';

        var parseNumbers = function(str) {
            if (!isNaN(str)) {
                str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str);
            }
            return str;
        };

        request(feedUrl, function(error, response, xml) {
            if (!error && response.statusCode == 200) {
                res.json(xml);

            } else {
                res.statusCode = 404;
                res.end();
            }
        })
    }
}
export =ProxyService;
