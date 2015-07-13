import fs                   = require('fs');
import path                 = require('path');
import express              = require('express');
import request              = require('request');
import IApiService          = require('../api/IApiService');
import IApiServiceManager   = require('../api/IApiServiceManager');
import ConfigurationService = require('../configuration/ConfigurationService');

class AccessibilityService implements IApiService {
    private server:  express.Express;
    private config:  ConfigurationService;
    private baseUrl: string;
    id:              string;

    init(apiServiceManager: IApiServiceManager, server: express.Express, config: ConfigurationService) {
        this.server = server;

        this.baseUrl = apiServiceManager.BaseUrl + (config['accessibilityAddress'] || '/accessibility');
        //console.log(this.baseUrl);
        server.get(this.baseUrl, (req, res) => {
            var id = req.query.url;
            this.getAccessibility(id, res);
        });
    }

    shutdown() {}

    private getAccessibility(url: string, res: express.Response) {
        console.log('Accessibility request: ' + url);

        var options: request.Options = {
            url: url,
            headers: {'Accept': 'application/json'} //Required to receive a reply in json format instead of xml
        };

        request(options, function (error, response) {
          if (!error && response.statusCode == 200) {
              res.json(response);
          } else {
              res.statusCode = 404;
              res.end();
          }
        })
    }
}
export=AccessibilityService;
