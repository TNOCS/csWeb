require('rootpath')();
import express = require('express')
import events = require("events");
import ClientConnection = require('./ClientConnection');
import MessageBus = require('../bus/MessageBus');
import fs = require('fs');
import path = require('path');
import utils = require('../helpers/Utils');
import GeoJSON = require("../helpers/GeoJSON");

export interface IDynamicLayer {
    connection?: ClientConnection.ConnectionManager;
    getLayer(req: express.Request, res: express.Response);
    getDataSource(req: express.Request, res: express.Response);
    addFeature?: (feature: any) => void;
    updateFeature?: (ft: GeoJSON.IFeature, client?: string, notify?: boolean) => void;
    updateLog?: (featureId: string, msgBody: IMessageBody, client?: string, notify?: boolean) => void;
    layerId: string;
    start();
    on?: (event: string, listener: Function) => events.EventEmitter;
}

export interface IPropertyUpdate {
    /** Timestamp */
    ts: number;
    /** Property key */
    prop: string;
    /** Property value */
    value: any;
}

export interface IMessageBody {
    featureId: string;
    logs?: { [prop: string]: IPropertyUpdate[] };
}

export class DynamicLayer extends events.EventEmitter implements IDynamicLayer {
    private file: string;
    /**
     * Working copy of geojson file
     */
    public geojson: any;
    public server: express.Express;
    public messageBus: MessageBus.MessageBusService;
    public connection: ClientConnection.ConnectionManager;
    public startDate: number;

    constructor(public layerId: string, file: string, server: express.Express, messageBus: MessageBus.MessageBusService, connection: ClientConnection.ConnectionManager) {
        super();
        this.geojson = { features: [] };
        this.file = file;
        this.server = server;
        this.messageBus = messageBus;
        this.connection = connection;
    }

    public getLayer(req: express.Request, res: express.Response) {
        res.send(JSON.stringify(this.geojson));
    }

    public OpenFile() {
        fs.readFile(this.file, 'utf8', (err, data) => {
            if (!err) {
                this.geojson = JSON.parse(data);
                this.geojson.features.forEach((f: csComp.Services.IFeature) => {
                    this.initFeature(f);
                });
            }
            else {
                console.log('error:' + this.file);
            }
        });
    }

    public getDataSource(req: express.Request, res: express.Response) {
        console.log('get DataSource');
        res.send(this.geojson);
    }

    public initFeature(f: any) {
        if (!f.id) f.id = utils.newGuid();
    }

    public updateSensorValue(ss: any, date: number, value: number) {
        ss.timestamps.push(date);
        ss.values.push(value);
        this.connection.updateSensorValue(ss.id, date, value);
    }

    addFeature(f, updated = true) {
        if (updated) f.properties['updated'] = new Date().getTime();
        this.initFeature(f);
        this.geojson.features.push(f);
        f.insertDate = new Date().getTime();
        this.connection.updateFeature(this.layerId, f, "feature-update");
    }

    public start() {
        console.log('start case layer');
        this.server.get("/cases/" + this.layerId, (req, res) => { this.getLayer(req, res); });

        this.startDate = new Date().getTime();
        //this.OpenFile();
        this.connection.registerLayer(this.layerId, (action: string, msg: ClientConnection.LayerMessage, client: string) => {
            var feature;
            switch (action) {
                case "logUpdate":
                    // find feature
                    var featureId = msg.object.featureId;
                    this.updateLog(featureId, msg.object, client, true);
                    break;
                case "featureUpdate":
                    var ft: GeoJSON.IFeature = msg.object;
                    this.updateFeature(ft, client, true);
                    break;
            }
        });
    }

    updateLog(featureId: string, msgBody: IMessageBody, client?: string, notify?: boolean) {
        var f: GeoJSON.IFeature;
        this.geojson.features.some(feature => {
            if (feature.id && feature.id === featureId) return false;
            // feature found
            f = feature;
            return true;
        });
        if (!f) return; // feature not found
        if (!f.hasOwnProperty('logs')) f.logs = {};
        if (!f.hasOwnProperty('properties')) f.properties = {};

        // apply changes
        var logs = msgBody.logs;

        for (var key in logs) {
            if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
            logs[key].forEach(l=> {
                f.logs[key].push(l);
                f.properties[key] = l.value;
            });
            console.log(JSON.stringify(f));
            // send them to other clients
            this.connection.updateFeature(this.layerId, msgBody, "logs-update", client);
        }
        console.log("Log update" + featureId);
        if (notify) this.emit("featureUpdated", this.layerId, featureId);
    }

    updateFeature(ft: GeoJSON.IFeature, client?: string, notify?: boolean) {
        this.initFeature(ft);
        var feature = this.geojson.features.filter((k) => { return k.id && k.id === ft.id });
        if (feature && feature.length > 0) {
            var index = this.geojson.features.indexOf(feature[0]);
            this.geojson.features[index] = ft;
        }
        else {
            this.geojson.features.push(ft);
        }
        if (client)
            this.connection.updateFeature(this.layerId, ft, "feature-update", client);
        else
            this.connection.updateFeature(this.layerId, ft, "feature-update");
        if (notify) this.emit("featureUpdated", this.layerId, ft.id);
    }
}
