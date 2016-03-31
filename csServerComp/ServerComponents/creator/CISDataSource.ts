import express = require('express')
import cors = require('cors')
import Winston = require('winston');
import request = require('request');
import path = require('path');
import fs = require('fs-extra');
import _ = require('underscore');
import GeoJSONHelper = require('../helpers/GeoJSON');
import Api = require('../api/ApiManager');
import Utils = require('../helpers/Utils');

export interface ICISOptions {
    /* Url called by the client if it wants to send a CIS message */
    sendMessageUrl?: string;
    /* Url called by the CIS-Connector-REST-tool on msgReceived */
    cisMsgReceivedUrl?: string;
    /* Url for sending a message using the CIS-Connector-REST-tool */
    cisNotifyUrl?: string;
}



/** CIS datasource
 *  Provides an endpoint for obtaining and sending CIS messages
 */
export class CISDataSource {
    private cisOptions: ICISOptions = <ICISOptions>{};

    constructor(public server: express.Express, private apiManager: Api.ApiManager, public url: string = '/cis') {
    }

    public init(options: ICISOptions, callback: Function) {
        if (!options) {
            callback('CIS datasource not started: No options provided.');
            return;
        }

        this.cisOptions.sendMessageUrl = [this.url, options.sendMessageUrl || 'notify'].join('/').replace('//','/');
        this.cisOptions.cisMsgReceivedUrl = [this.url, options.cisMsgReceivedUrl || 'msgReceived'].join('/').replace('//','/');
        this.cisOptions.cisNotifyUrl = options.cisNotifyUrl || '';
        
        Winston.info('Init CIS datasource listening on port ' + this.server.get('port') + ' with endpoint ' + this.cisOptions.sendMessageUrl);
        
        this.server.put(this.cisOptions.cisMsgReceivedUrl, (req: express.Request, res: express.Response) => {
            console.log('Got message from CIS: ' + req.body);
        });

        this.server.post(this.cisOptions.sendMessageUrl, (req: express.Request, res: express.Response) => {
            Winston.info('Notify the CIS datasource on ' + this.cisOptions.cisNotifyUrl);
            request.post({
                url: this.cisOptions.cisNotifyUrl,
                json: req.body
            },
            (err, response, data) => {
                if (!err) {
                    Winston.info('Notified the CIS datasource');
                } else {
                    Winston.info('Error in notifying the CIS datasource: ' + err);
                }
            });
        });

        callback('CIS datasource loaded successfully!');
    }
}
