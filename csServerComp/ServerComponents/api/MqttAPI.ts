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



export class MqttAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager
    public client: any;
    public router: any;

    constructor(public server: string, public port: number = 1883, private layerPrefix = "layers", private keyPrefix = "keys") {
        super();
        this.isInterface = true;
        this.receiveCopy = false;
    }

    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        this.layerPrefix = (this.manager.name + "/" + this.layerPrefix + "/").replace("//", "/");
        this.keyPrefix = (this.manager.name + "/" + this.keyPrefix + "/").replace("//", "/");
        Winston.info('mqtt: init mqtt connector');

        this.client = (<any>mqtt).connect("mqtt://" + this.server + ":" + this.port);



        // enable the subscription router
        //this.router = mqttrouter.MqttAPI.Router(this.client);

        this.client.on('error', (e) => {
            Winston.warn('mqtt: error');
        });

        this.client.on('connect', () => {
            Winston.info("mqtt: connected");
            // server listens to all key updates
            if (!this.manager.isClient) {
                Winston.info("mqtt: listen to everything");
                this.client.subscribe("#");
            }
        });

        this.client.on('reconnect', () => {
            Winston.debug("mqtt: reconnecting");

        });

        this.client.on('message', (topic, message) => {
            Winston.info("mqtt: " + topic + "-" + message.toString());
            //this.manager.updateKey(topic, message, <ApiMeta>{}, () => { });

            //_.startsWith(topic,this.keyPrefix)
        });



        // express api aanmaken
        // vb. addFeature,
        // doorzetten naar de layermanager
    }

    public subscribeKey(keyPattern: string, meta: ApiMeta, callback: Function) {
        // subscribe to messages for 'hello/me'
        this.router.subscribe(this.keyPrefix + "#", (topic, message) => {
            Winston.log('received', topic, message);
        });
    }

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        this.client.publish(this.layerPrefix, JSON.stringify(layer));
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        if (meta.source !== this.id) {
            this.client.publish(this.layerPrefix + layerId, JSON.stringify(feature));
        }
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public updateLayer(layerId: string, update: any, meta: ApiMeta, callback: Function) {
        //todo
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        this.client.publish(this.layerPrefix + layerId, JSON.stringify(feature));
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    private sendFeature(layerId: string, featureId: string) {
        this.manager.findFeature(layerId, featureId, (r: CallbackResult) => {
            if (r.result === ApiResult.OK) {
                this.client.publish(this.layerPrefix + layerId, JSON.stringify(r.feature));
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
        this.client.subscribe(this.layerPrefix + layer.id + "/addFeature");
        Winston.info('mqtt: init layer ' + layer.id);
    }

    private getKeyChannel(keyId: string) {
        return this.keyPrefix + keyId.replace(/[\.]/g, "/");
    }

    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {
        this.client.publish(this.getKeyChannel(keyId), JSON.stringify(value));
    }
}
