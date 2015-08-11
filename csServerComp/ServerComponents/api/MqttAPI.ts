import ApiManager = require('./ApiManager');
import express = require('express')
import Layer = ApiManager.Layer;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import mqtt = require("mqtt");
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');

//declare var mqtt;

export class MqttAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager
    public client: any;

    constructor(public server: string, public port: number = 1883) {
        super();
        this.isInterface = true;
    }

    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        Winston.info('mqtt: init mqtt connector');


        this.client = (<any>mqtt).connect("mqtt://" + this.server + ":" + this.port);

        this.client.on('error', (e) => {
            Winston.warn('mqtt: error');
        });

        this.client.on('connect', () => {
            Winston.info("mqtt: connected");
        });

        this.client.on('reconnect', () => {
            Winston.debug("mqtt: reconnecting");
        });


        this.client.on('message', (topic, message) => {
            Winston.debug("mqtt: " + topic + "-" + message.toString());
        });

        // express api aanmaken
        // vb. addFeature,
        // doorzetten naar de layermanager
    }

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        this.client.publish('layers', JSON.stringify(layer));
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        this.client.publish('layers/' + layerId, JSON.stringify(feature));
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public updateLayer(layerId: string, update: any, meta: ApiMeta, callback: Function) {
        //todo
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        this.client.publish('layers/' + layerId, JSON.stringify(feature));
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    private sendFeature(layerId: string, featureId: string) {
        this.manager.findFeature(layerId, featureId, (r: CallbackResult) => {
            if (r.result === ApiResult.OK) {
                this.client.publish('layers/' + layerId, JSON.stringify(r.feature));
            }
        });
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        this.sendFeature(layerId, featureId);
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {
        this.sendFeature(layerId, featureId);
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public initLayer(layer: Layer) {
        this.client.subscribe('layers/' + layer.id + "/addFeature");
        Winston.info('mqtt: init layer ' + layer.id);
    }
}
