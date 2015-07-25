import LayerManager = require('./LayerManager');
import express = require('express')
import Layer = LayerManager.Layer;
import Log = LayerManager.Log;
import CallbackResult = LayerManager.CallbackResult;
import mqtt = require("mqtt");
import BaseConnector = require('./BaseConnector');

//declare var mqtt;

export class MqttAPI extends BaseConnector.BaseConnector {

    public manager: LayerManager.LayerManager
    public client: any;

    constructor(public server: string, public port: number = 1883) {
        super();
        this.isInterface = true;
    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init mqtt API');


        this.client = (<any>mqtt).connect("mqtt://" + this.server + ":" + this.port);

        this.client.on('error', (e) => {
            console.log('error');
        });

        this.client.on('connect', () => {
            console.log("mqtt connected");
        });

        this.client.on('reconnect', () => {
            console.log("mqtt reconnecting");
        });


        this.client.on('message', (topic, message) => {
            console.log(topic + "-" + message.toString());
        });

        // express api aanmaken
        // vb. addFeature,
        // doorzetten naar de layermanager
    }

    public addLayer(layer: Layer, callback: Function) {
        this.client.publish('layers', JSON.stringify(layer));
        callback(<CallbackResult> { result: "OK" });
    }

    public addFeature(layerId: string, feature: any, callback: Function) {
        this.client.publish('layers/' + layerId, JSON.stringify(feature));
        callback(<CallbackResult> { result: "OK" });
    }

    public updateLayer(layerId: string, update: any, callback: Function) {
      //todo
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function) {
        this.client.publish('layers/' + layerId, JSON.stringify(feature));
        callback(<CallbackResult> { result: "OK" });
    }

    private sendFeature(layerId: string, featureId: string) {
        this.manager.findFeature(layerId, featureId, (r: CallbackResult) => {
            if (r.result === "OK") {
                this.client.publish('layers/' + layerId, JSON.stringify(r.feature));
            }
        });
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {
        this.sendFeature(layerId, featureId);
        callback(<CallbackResult> { result: "OK" });
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, callback: Function) {
        this.sendFeature(layerId, featureId);
        callback(<CallbackResult> { result: "OK" });
    }

    public initLayer(layer: Layer) {
        this.client.subscribe('layers/' + layer.id + "/addFeature");
        console.log('mqtt:initlayer');
    }
}
