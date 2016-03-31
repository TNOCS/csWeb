import express = require('express')
import cors = require('cors')
import Winston = require('winston');
import request = require('request');
import path = require('path');
import xml2js = require('xml2js');
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
    private xmlBuilder = new xml2js.Builder({});

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
            var cisMsg = req.body;
            if (cisMsg.hasOwnProperty('msg')) {
                var jsonMsg = JSON.parse(cisMsg['msg']);
                var xmlMsg = this.xmlBuilder.buildObject(jsonMsg);
                xmlMsg = xmlMsg.replace('<root>', '<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">').replace('</root>', '</alert>')
                cisMsg['msg'] = xmlMsg;
            }
            request.post({
                url: this.cisOptions.cisNotifyUrl,
                json: cisMsg
            },
                (err, response, data) => {
                    if (!err && response && response.statusCode && response.statusCode == 200) {
                        Winston.info('Notified the CIS datasource');
                    } else {
                        Winston.info('Error in notifying the CIS datasource: ' + err);
                    }
                });
        });

        this.server.post('CISMsgReceived', (req: express.Request, res: express.Response) => {
            Winston.info('CISMsg received');
            this.parseCisMessage(req.body, (result) => {
                if (result) {
                    this.sendCapFeature(result);
                }
            });
        });

        callback('CIS datasource loaded successfully!');
    }
    
    private parseCisMessage(msg: any, cb: Function) {
        cb(msg);
    }
        
    private sendCapFeature(msg: any) {
        Winston.info('Send CAP feature');
    }
}
