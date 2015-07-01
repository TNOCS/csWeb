require('rootpath')();
import express = require('express')
import ClientConnection = require('ClientConnection');
import MessageBus = require('../bus/MessageBus');
import fs = require('fs');
import path = require('path');


export interface IDynamicLayer {
    getLayer(req: express.Request, res: express.Response);
    getDataSource(req: express.Request, res: express.Response);
    layerId: string;
    start();
}

export class DynamicLayer implements IDynamicLayer {
    public result: any;
    private file: string;
    public server: express.Express;
    public messageBus: MessageBus.MessageBusService;
    public connection: ClientConnection.ConnectionManager;

    public startDate: number;

    constructor(public layerId: string, file: string, server: express.Express, messageBus: MessageBus.MessageBusService, connection: ClientConnection.ConnectionManager) {
        this.result = { features: [] };
        this.file = file;
        this.server = server;
        this.messageBus = messageBus;
        this.connection = connection;
    }

    public S4(): string {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    public getGuid(): string {
        var guid = (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
        return guid;
    }

    public getLayer(req: express.Request, res: express.Response) {
        res.send(JSON.stringify(this.result));
    }

    public OpenFile() {
        fs.readFile(this.file, 'utf8', (err, data) => {
            if (!err) {
                this.result = JSON.parse(data);
                this.result.features.forEach((f: csComp.Services.IFeature) => {
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
        res.send(this.result);
    }

    public initFeature(f: any) {
        if (!f.id) f.id = this.getGuid();
    }

    public updateSensorValue(ss: any, date: number, value: number) {
        ss.timestamps.push(date);
        ss.values.push(value);
        this.connection.updateSensorValue(ss.id, date, value);
    }

    addFeature(f) {
        this.initFeature(f);
        this.result.features.push(f);
        f.insertDate = new Date().getTime();
        this.connection.updateFeature(this.layerId, f);
    }

    public start() {
        console.log('start case layer');
        this.server.get("/cases/" + this.layerId, (req, res) => { this.getLayer(req, res); });

        this.startDate = new Date().getTime();
        //this.OpenFile();
        this.connection.registerLayer(this.layerId, (action: string, object: any) => {
            switch (action) {
                case "featureUpdate":
                    var f = <csComp.Services.IFeature>object;
                    this.initFeature(f);
                    var feature = this.result.features.filter((k) => { return k.id && k.id === f.id });
                    if (feature && feature.length > 0) {
                        var index = this.result.features.indexOf(feature[0]);
                        this.result.features[index] = f;
                    }
                    else {
                        this.result.features.push(f);
                    }
                    this.connection.updateFeature(this.layerId, f);
                    break;
            }
        });
    }
}
