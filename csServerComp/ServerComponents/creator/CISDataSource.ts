import express = require('express')
import cors = require('cors')
import Winston = require('winston');
import BodyParser = require('body-parser');
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
        addresses?: string;
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
    private xmlParser = new xml2js.Parser({ignoreAttrs: true, explicitArray: false});
    constructor(public server: express.Express, private apiManager: Api.ApiManager, public capLayerId: string, public url: string = '/cis') {
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
            res.sendStatus(200);
            var feature = req.body;
            var props = (feature.properties) ? feature.properties : {};
            var cisMsg = CISDataSource.createDefaultCISMessage();
            // Transform flat properties to CAP alert structure
            Object.keys(props).forEach((key) => {
                if (cisMsg.msg.hasOwnProperty(key)) {
                    if (key === 'sender') {
                        cisMsg.msg[key] = "csweb";
                    } else if (key === "sent") {
                        cisMsg.msg[key] = CISDataSource.convertDateToCAPDate(new Date());
                    } else {
                        cisMsg.msg[key] = props[key];
                    }
                }
                if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty(key)) {
                    cisMsg.msg['info'][key] = props[key];
                }
                if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty('area') && cisMsg.msg['info']['area'].hasOwnProperty(key)) {
                    cisMsg.msg['info']['area'][key] = props[key];
                }
            });
            // Add geometry
            if (cisMsg.msg.hasOwnProperty('info') && cisMsg.msg['info'].hasOwnProperty('area')) {
                // Fake a Point-feature to be a Polygon for now, as it is better supported by the other teams.
                if (feature.geometry.type.toLowerCase() === 'point') {
                    var coords = feature.geometry.coordinates;
                    var polCoords = [[
                        [coords[0] - 0.05, coords[1] + 0.05],
                        [coords[0] - 0.05, coords[1] - 0.05],
                        [coords[0] + 0.05, coords[1] - 0.05],
                        [coords[0] + 0.05, coords[1] + 0.05],
                        [coords[0] - 0.05, coords[1] + 0.05]
                    ]];
                    feature.geometry.type = 'Polygon';
                    feature.geometry.coordinates = polCoords;
                }
                var keyVal = CISDataSource.convertGeoJSONToCAPGeometry(feature.geometry, 20);
                cisMsg.msg['info']['area'][keyVal.key] = keyVal.val;
            }
            // Parse JSON to xml
            var xmlMsg = this.xmlBuilder.buildObject(cisMsg.msg);
            xmlMsg = xmlMsg.replace('<root>', '<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">').replace('</root>', '</alert>');
            cisMsg.msg = <any>xmlMsg;
            Winston.info(xmlMsg);
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

        this.server.post(this.cisOptions.cisMsgReceivedUrl, BodyParser.text(), (req: express.Request, res: express.Response) => {
            Winston.info('CISMsg received');
            Winston.debug(req.body);
            this.parseCisMessage(req.body, (result) => {
                if (result) {
                    this.convertCapFeature(result);
                }
            });
            res.sendStatus(200);
        });

        callback('CIS datasource loaded successfully!');
    }

    private parseCisMessage(msg: any, cb: Function) {
        if (!msg) {
            Winston.info('No xml-string found');
            cb();
            return;
        }
        this.xmlParser.parseString(msg, (err, cap: ICAPAlert) => {
            if (err) {
                Winston.error(err);
                cb();
            } else {
                Winston.info(JSON.stringify(cap, null, 2));
                cb(cap);
            }
        });
    }

    private convertCapFeature(cap: any) {
        Winston.info('Convert CAP to a feature');
        var f = <Api.Feature>{
            type: "Feature",
            id: Utils.newGuid(),
            properties: {},
            geometry: null
        };
        f.properties = CISDataSource.flattenObject(cap, {});
        Winston.info(JSON.stringify(f.properties, null, 2));
        if (f.properties.hasOwnProperty('polygon')) {
            f.geometry = CISDataSource.convertCAPGeometryToGeoJSON(f.properties['polygon'], 'polygon');
        } else if (f.properties.hasOwnProperty('circle')) {
            f.geometry = CISDataSource.convertCAPGeometryToGeoJSON(f.properties['circle'], 'circle');
        } else {
            Winston.error('No valid CAP geometry found.');
            return;
        }
        f.properties['featureTypeId'] = "Alert";
        this.apiManager.addFeature(this.capLayerId, f, {}, () => { });
    }
    
    /**
     * Flattens a nested object to a flat dictionary.
     * Example:  
     * { X: 1, Y: {Ya: 2, Yb: 3}}
     *       }
     * }
     * to {X: 1, Ya: 2, Yb: 3}
     */
    private static flattenObject(nest: any, flat: Dictionary<{}>, key: string = 'unknown') {
        if (_.isObject(nest)) {
            _.each(<Dictionary<{}>>nest, (v, k) => {
                CISDataSource.flattenObject(v, flat, k);
            });
        } else {
            flat[key] = nest;
        }
        return flat;
    }

    private static createDefaultCISMessage(): ICISMessage {
        var deParams: IDEParameters = {
            id: 'csweb-' + Utils.newGuid(),
            senderId: 'someone@csweb',
            dateTimeSent: CISDataSource.convertDateToCAPDate(new Date()),
            kind: 'Report',
            status: 'Excercise'
        }

        var alertMsg: ICAPAlert = {
            identifier: deParams.id,
            sender: 'CSWEB',
            sent: CISDataSource.convertDateToCAPDate(new Date()),//'2016-03-31T11:33:00+02:00',//(new Date().toISOString()).replace('Z','+02:00'),
            status: 'Test',
            msgType: 'Alert',
            scope: 'Public',
            addresses: '',
            info: {
                category: 'Met',
                event: 'Monitor',
                urgency: 'Immediate',
                severity: 'Severe',
                certainty: 'Observed',
                area: {
                    areaDesc: 'Testarea'
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
    
    /**
     * Takes a date object, outputs a CAP date string
     */
    private static convertDateToCAPDate(date: Date): string {
        if (!date) return;
        var tdiff = date.getTimezoneOffset();
        var tdiffh = Math.floor(Math.abs(tdiff / 60));
        var tdiffm = tdiff % 60;
        var tdiffpm = (tdiff <= 0) ? '-' : '+';
        var iso = date.toISOString().split('.').shift();
        iso = ''.concat(iso, tdiffpm, (tdiffh < 10) ? '0' : '', tdiffh.toFixed(0), ':', (tdiffm < 10) ? '0' : '', tdiffm.toFixed(0));
        Winston.info(`Converted date to ${iso}`);
        return iso;
    }
    
    /**
     * Takes a a GeoJSON Polygon or Point {type, coordinates: [[y,x],[y,x]]} (WGS84)
     * Outputs a CAP Polygon in the format: "x,y x,y x,y" or Circle in the format "x,y r" (r in km)
     * Optionally provide a circle radius in km, in case a point is provided (default: 10km)
     */
    private static convertGeoJSONToCAPGeometry(geo: Api.Geometry, radiusKM: number = 10): { key: string, val: string } {
        if (!geo || !geo.type || !geo.coordinates) return;
        var capCoords = '';
        var coords = geo.coordinates;
        if (geo.type.toLowerCase() === 'polygon') {
            for (let i = 0; i < coords[0].length; i++) {
                let cc = coords[0][i];
                capCoords += cc[1] + ',' + cc[0] + ' ';
            }
            capCoords = capCoords.substr(0, capCoords.length - 1); //Remove last space
        } else if (geo.type.toLowerCase() === 'point') {
            capCoords = coords[1] + ',' + coords[0] + ' ' + radiusKM;
        } else {
            Winston.warn('Could not convert GeoJSON geometry to CAP');
        }
        Winston.info(`Converted ${JSON.stringify(geo)} to ${capCoords}`);
        var type = (geo.type.toLowerCase() === 'polygon') ? 'polygon' : 'circle';
        return { key: type, val: capCoords };
    }
    
    /**
     * Takes a CAP Polygon in the format: "x,y x,y x,y". (WGS84)
     * Outputs a GeoJSON geometry {type, coordinates: [[y,x],[y,x]]}.
     */
    private static convertCAPGeometryToGeoJSON(cisPoly: string, cisType: string) {
        if (!cisPoly) return;
        var result;
        var cisCoords = cisPoly.split(' ');
        if (cisType === 'polygon') {
            result = {type: "Polygon", coordinates: [[]]};
            for (let i = 0; i < cisCoords.length; i++) {
                let cc = cisCoords[i];
                let xy = cc.split(',');
                result.coordinates[0].push([+xy[1], +xy[0]]);
            }
        } else if (cisType === 'circle') {
            let xy = cisCoords[0].split(' ').shift().split(',');
            result = {type: "Point", coordinates: [+xy[1], +xy[0]]};
        } else {
            Winston.warn('Could not convert CAP geometry');
        }
        Winston.info(`Converted ${cisPoly} to ${JSON.stringify(result)}`);
        return result;
    }
}
