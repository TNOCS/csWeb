import ApiManager = require('./ApiManager');
import express = require('express')
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import mqtt = require("mqtt");
import mqttrouter = require("mqtt-router");
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');


export class MqttAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager
    public client: any;
    public router: mqttrouter.MqttRouter;

    constructor(public server: string, public port: number = 1883, public layerPrefix = "layers", public keyPrefix = "keys") {
        super();
        this.isInterface = true;
        this.receiveCopy = false;
    }

    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        this.layerPrefix = (this.manager.namespace + "/" + this.layerPrefix + "/").replace("//", "/");
        this.keyPrefix = (this.manager.namespace + "/" + this.keyPrefix + "/").replace("//", "/");
        Winston.info('mqtt: init mqtt connector');

        this.client = (<any>mqtt).connect("mqtt://" + this.server + ":" + this.port);
        this.router = mqttrouter.wrap(this.client);

        this.client.on('error', (e) => {
            Winston.error(`mqtt: error ${e}`);
        });

        this.client.on('connect', () => {
            Winston.info("mqtt: connected");
            // server listens to all key updates
            if (!this.manager.isClient) {
                var subscriptions = '#'; //layerManager.options.mqttSubscriptions || '#';
                Winston.info(`mqtt: listen to ${subscriptions === '#' ? 'everything' : subscriptions}`);
                if (typeof subscriptions === 'string') {
                    this.client.subscribe(subscriptions);
                } else {
                    //subscriptions.forEach(s => this.client.subscribe(s));
                }
            }
        });

        this.client.on('reconnect', () => {
            Winston.debug("mqtt: reconnecting");

        });

        // TODO Use the router to handle messages
        // this.router.subscribe('hello/me/#:person', function(topic, message, params){
        //   console.log('received', topic, message, params);
        // });
        this.client.on('message', (topic: string, message: string) => {
            Winston.info(`mqtt on message: ${topic}.`);
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
                // We are either dealing with a layer update, or a feature update.
                // In the first case, the channel will be this.layerPrefix/layerId,
                // otherwise, it will be this.layerPrefix/layerId/feature/featureId.
                // So try to extract both. If there is only one, we are dealing a layer update.
                var ids = topic.substring(this.layerPrefix.length, topic.length).split('/feature/');
                var layerId = ids[0];
                if (ids.length === 1) {
                    try {
                        var layer = <Layer>JSON.parse(message);
                        if (layer) {
                            Winston.info(`mqtt: update layer ${layerId}`);
                            this.manager.updateLayer(layer, <ApiMeta>{ source: this.id }, () => { });
                        }
                    } catch (e) {
                        Winston.error(`mqtt: error updating layer, exception ${e}`);
                    }
                } else {
                    try {
                        var featureId = ids[1];
                        var feature = <Feature>JSON.parse(message);
                        if (feature) {
                            Winston.info(`mqtt: update feature ${featureId} for layer {layerId}.`);
                            this.manager.updateFeature(layerId, feature, <ApiMeta>{ source: this.id }, () => { });
                        }
                    } catch (e) {
                        Winston.error(`mqtt: error updating feature, exception ${e}`);
                    }
                }
            }
            else if (topic.indexOf(this.keyPrefix) === 0) {
                var kid = topic.substring(this.keyPrefix.length, topic.length).replace(/\//g,'.');
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

    /**
     * Subscribe to certain keys using the internal MQTT router.
     * See also https://github.com/wolfeidau/mqtt-router.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    public subscribeKey(keyPattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void) {
        Winston.error( 'subscribing key : ' + keyPattern);
        this.router.subscribe(keyPattern, (topic: string, message: string, params: Object) => {
            callback(topic, message.toString(), params);
        });
    }

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        this.updateLayer(layer, meta, callback);
    }

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        if (meta.source !== this.id) {
            this.client.publish(`${this.layerPrefix}${layerId}/feature/${feature.id}`, JSON.stringify(feature));
        }
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        Winston.info('mqtt: update layer ' + layer.id);
        if (meta.source !== this.id) {
            var def = this.manager.getLayerDefinition(layer);
            // Send the layer definition to everyone
            this.client.publish(this.layerPrefix, JSON.stringify(def));
            // And place all the data only on the specific layer channel
            this.client.publish(this.layerPrefix + layer.id, JSON.stringify(layer));
        }
        callback(<CallbackResult> { result: ApiResult.OK });
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('mqtt update feature');
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
