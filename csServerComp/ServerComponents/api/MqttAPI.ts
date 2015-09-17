import ApiManager = require('./ApiManager');
import express = require('express')
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
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

    constructor(public server: string, public port: number = 1883, public layerPrefix = "layers", public keyPrefix = "keys") {
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

        this.client.on('message', (topic: string, message: string) => {
            if (topic[topic.length - 1] === "/") topic = topic.substring(0, topic.length - 2);
            // listen to layer updates
            if (topic === this.layerPrefix) {
                var layer = <Layer>JSON.parse(message);
                if (layer && layer.id) {
                    Winston.info('mqtt: update layer ' + layer.id);
                    this.manager.updateLayer(layer, <ApiMeta>{ source: this.id }, () => { });
                }
            }
            else if (topic.indexOf(this.layerPrefix) === 0) {
                var lid = topic.substring(this.layerPrefix.length, topic.length);
                try {
                    var layer = <Layer>JSON.parse(message);
                    if (layer) {
                        Winston.info('mqtt: update feature for layer ' + lid);
                        this.manager.updateLayer(layer, <ApiMeta>{ source: this.id }, () => { });
                    }
                }
                catch (e) {
                    Winston.error("mqtt: error updating feature");
                }
            }

            if (topic.indexOf(this.keyPrefix) === 0) {
                var kid = topic.substring(this.keyPrefix.length, topic.length);
                if (kid) {
                    try {
                        var obj = JSON.parse(message);
                        Winston.info('mqtt: update key for id ' + kid + " : " + message);
                        this.manager.updateKey(kid, obj, <ApiMeta>{ source: this.id }, () => { });
                    }
                    catch (e) {
                        Winston.error('mqtt: error updating key for id ' + kid + " : " + message);

                    }
                }
            }

            // layers/....
            // layer zonder features
            // url
            // title
            //
            // keys/..
            //this.manager.addLayer(layer: ApiManager.Layer, meta: ApiManager.ApiMeta, callback: Function)
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
        this.updateLayer(layer, meta, callback);
    }

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        if (meta.source !== this.id) {
            this.client.publish(this.layerPrefix + layerId, JSON.stringify(feature));
        }
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        Winston.error('mqtt: update layer ' + layer.id);
        if (meta.source !== this.id) {
            var def = this.manager.getLayerDefinition(layer);
            this.client.publish(this.layerPrefix, JSON.stringify(def));
            this.client.publish(this.layerPrefix + layer.id, JSON.stringify(layer));
        }
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.error('mqtt update feature');
        if (meta.source !== this.id)
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
        //this.client.subscribe(this.layerPrefix + layer.id + "/addFeature");
        Winston.info('mqtt: init layer ' + layer.id);
    }

    private getKeyChannel(keyId: string) {
        return this.keyPrefix + keyId.replace(/[\.]/g, "/");
    }

    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {
        this.client.publish(this.getKeyChannel(keyId), JSON.stringify(value));
    }
}
