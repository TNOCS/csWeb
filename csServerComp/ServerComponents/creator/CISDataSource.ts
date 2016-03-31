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

export interface ICISMessage {
        msg: ICAPAlert;
        msgType: string;
        deParameters: { [ key: string]: any};
    }
    
    export interface IDEParameters {
        id: string;
        senderId: string;
        dateTimeSent: string;
        status: string;
        kind: string;
        descriptionType?: string;
        contentType?: string;
        contentObjectType?: string;
    }

    export interface ICAPAlert {
        identifier: string;
        sender: string;
        sent: string;
        status: string;
        msgType: string;
        scope: string;
        addresses?: string[];
        references?: string[];
        info: ICAPInfo;
    }
    
    export interface ICAPInfo {
        senderName?: string;
        event: string;
        description?: string;
        category: string;
        severity: string;
        certainty: string;
        urgency: string;
        onset?: string;
        eventCode?: string;
        headline?: string;
        expires?: string;
        responseType?: string;
        instruction?: string;
        area: ICAPArea;
    }

    export interface ICAPArea {
        areaDesc: string;
        polygon?: Object;
        point?: Object;
    }

/** CIS datasource
 *  Provides an endpoint for obtaining and sending CIS messages
 */
export class CISDataSource {
    private cisOptions: ICISOptions = <ICISOptions>{};
    private xmlBuilder = new xml2js.Builder({headless: true});

    constructor(public server: express.Express, private apiManager: Api.ApiManager, public url: string = '/cis') {
    }

    public init(options: ICISOptions, callback: Function) {
        if (!options) {
            callback('CIS datasource not started: No options provided.');
            return;
        }

        this.cisOptions.sendMessageUrl = [this.url, options.sendMessageUrl || 'notify'].join('/').replace('//','/');
        this.cisOptions.cisMsgReceivedUrl = [this.url, options.cisMsgReceivedUrl || 'CISMsgReceived'].join('/').replace('//','/');
        this.cisOptions.cisNotifyUrl = options.cisNotifyUrl || '';
        
        Winston.info('Init CIS datasource listening on port ' + this.server.get('port') + ' with endpoint ' + this.cisOptions.sendMessageUrl);

        this.server.post(this.cisOptions.sendMessageUrl, (req: express.Request, res: express.Response) => {
            Winston.info('Notify the CIS datasource on ' + this.cisOptions.cisNotifyUrl);
            var feature = req.body['feature'];
            var fType = req.body['fType'];
            var props = (feature.properties) ? feature.properties : {};
            var cisMsg = CISDataSource.createDefaultCISMessage();
            Object.keys(props).forEach((key) => {
                if (cisMsg.msg.hasOwnProperty(key)) {
                    cisMsg.msg[key] = props[key];
                }
                if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty(key)) {
                    cisMsg.msg['info'][key] = props[key];
                }
                if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty('area') && cisMsg.msg['info']['area'].hasOwnProperty(key)) {
                    cisMsg.msg['info']['area'][key] = props[key];
                }
            });
            var xmlMsg = this.xmlBuilder.buildObject(cisMsg.msg);
            xmlMsg = xmlMsg.replace('<root>', '<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">').replace('</root>', '</alert>')
            var convertedMsg = cisMsg;
            convertedMsg.msg = <any>xmlMsg;
            Winston.info(xmlMsg);
            request.post({
                url: this.cisOptions.cisNotifyUrl,
                json: convertedMsg
            },
                (err, response, data) => {
                    if (!err && response && response.statusCode && response.statusCode == 200) {
                        Winston.info('Notified the CIS datasource');
                    } else {
                        Winston.info('Error in notifying the CIS datasource: ' + err);
                    }
                });
        });

        this.server.post(this.cisOptions.cisMsgReceivedUrl, (req: express.Request, res: express.Response) => {
            Winston.info('CISMsg received');
            this.parseCisMessage(req.body, (result) => {
                if (result) {
                    this.sendCapFeature(result);
                }
            });
            res.sendStatus(200);
        });

        callback('CIS datasource loaded successfully!');
    }
    
    private parseCisMessage(msg: any, cb: Function) {
        cb(msg);
    }

    private sendCapFeature(msg: any) {
        Winston.info('Send CAP feature');
    }

    private static createDefaultCISMessage(): ICISMessage {
        var deParams: IDEParameters = {
            id: 'csweb-' + Utils.newGuid(),
            senderId: 'someone@csweb',
            dateTimeSent: (new Date().toISOString()),
            kind: 'Report',
            status: 'Excercise'
        }

        var alertMsg: ICAPAlert = {
            identifier: deParams.id,
            sender: 'CSWEB',
            sent: '2016-03-31T11:33:00+02:00',//(new Date().toISOString()).replace('Z','+02:00'),
            status: 'Test',
            msgType: 'Alert',
            scope: 'Public',
            info: {
                category: 'Met',
                event: 'Monitor',
                urgency: 'Immediate',
                severity: 'Severe',
                certainty: 'Observed',
                area: {
                    areaDesc: 'Testarea',
                    polygon: '52.6494107854,3.0604549348 52.9158436911,3.0604549348 52.9158436911,3.5588077605 52.6494107854,3.0604549348'
                }
            }
        }

        var cisMessage: ICISMessage = {
            msgType: "CAP",
            msg: alertMsg,
            deParameters: deParams
        }
        
        return cisMessage;
    }
}
