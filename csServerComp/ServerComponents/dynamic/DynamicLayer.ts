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
                    var ff = this.result.features.filter((k) => { return k.id && k.id === featureId });
                    if (ff.length > 0) {
                        var f = ff[0];
                        if (!f.hasOwnProperty('logs')) f.logs = {};
                        if (!f.hasOwnProperty('properties')) f.properties = {};

                        // apply changes

                        var logs = msg.object.logs;
                        console.log(logs);

                        for (var key in logs) {
                            console.log('updating key:' + key);
                            if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
                            logs[key].forEach(l=> {
                                console.log('pushing...');
                                f.logs[key].push(l);
                                f.properties[key] = l.value;
                            })

                            console.log(JSON.stringify(f));
                            // send them to other clients
                            this.connection.updateFeature(this.layerId, msg.object, "logs-update", client);
                        }
                    }
                    console.log("Log update" + featureId);
                    break;
                case "featureUpdate":
                    var ft = <csComp.Services.IFeature>msg.object;
                    this.initFeature(ft);
                    feature = this.result.features.filter((k) => { return k.id && k.id === ft.id });
                    if (feature && feature.length > 0) {
                        var index = this.result.features.indexOf(feature[0]);
                        this.result.features[index] = ft;
                    }
                    else {
                        this.result.features.push(ft);
                    }
                    this.connection.updateFeature(this.layerId, ft, "feature-update", client);
                    break;
            }
        });
    }
}
