import ApiManager = require('./ApiManager');
import express = require('express');
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import mqtt = require('mqtt');
import mqttrouter = require('mqtt-router');
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');
var KafkaRest = require('kafka-rest');


export class KafkaAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager;
    public kafka: any;
    public connected: boolean;
    public consumer_instance: any;
    public router: mqttrouter.MqttRouter;  

    constructor(public server: string, public consumer: string, public port: number = 8082, public layerPrefix = 'layers', public keyPrefix = 'keys') {
        super();
        this.isInterface = true;
        this.receiveCopy = false;
    } 

    public subscribeLayer(layer: string) {
        Winston.info("Subscribe kafka layer : " + layer);
        if (this.connected && this.consumer_instance) {
            var topic = layer;
            console.log(topic);
            var stream = this.consumer_instance.subscribe(topic);
            stream.on('data',  (msgs) => {
                for (var i = 0; i < msgs.length; i++)
                {
                    var l = JSON.parse(msgs[i].value);
                    l.id = layer;                    
                    console.log(JSON.stringify(l));
                    this.manager.addUpdateLayer(l, <ApiMeta>{ source: this.id }, () => { });

                }
                    //console.log("Got a message: key=" + msgs[i].key + " value=" + msgs[i].value + " partition=" + msgs[i].partition);
            });
            stream.on('error', function (err) {
                console.log("Something broke: " + err);
            }); 
        }
    }

    public exit(callback : Function)
    {
        Winston.info('Closing kafka connection');
        this.consumer_instance.shutdown(()=>callback());
    }

    public init(layerManager: ApiManager.ApiManager, options: any, callback: Function) {
        console.log('init kafka');
        this.manager = layerManager;
        this.layerPrefix = (this.manager.namespace + '-' + this.layerPrefix + '-').replace('//', '/');
        this.keyPrefix = (this.manager.namespace + '/' + this.keyPrefix + '/').replace('//', '/');
        console.log(this.layerPrefix);
        Winston.info('kafka: init kafak connector on address ' + this.server + ':' + this.port);
        this.kafka = new KafkaRest({ 'url': this.server + ':' + this.port });

        this.kafka.consumer(this.consumer).join({
            'format': 'binary',
            'auto.offset.reset': 'smallest'
        }, (err, ci) => {
            if (!err) {
                this.consumer_instance = ci;
                this.connected = true;

                if (!this.manager.isClient) {
                var subscriptions = layerManager.options.mqttSubscriptions || 'arnoud-test6';
                Winston.info(`kafka: listen to ${subscriptions === '#' ? 'everything' : subscriptions}`);
                if (typeof subscriptions === 'string') {
                    this.subscribeLayer(subscriptions);
                    //this.client.subscribe(subscriptions);
                } else {
                    subscriptions.forEach(s => this.subscribeLayer(s) );
                }
            }


            }
        });

        // this.client = (<any>mqtt).connect('mqtt://' + this.server + ':' + this.port);
        // this.router = mqttrouter.wrap(this.client);

        // this.client.on('error', (e) => {
        //     Winston.error(`mqtt: error ${e}`);
        // });

        // this.client.on('connect', () => {
        //     Winston.debug('mqtt: connected');
        //     // server listens to all key updates
            
        // });

        // this.client.on('reconnect', () => {
        //     Winston.debug('mqtt: reconnecting');

        // });

        // TODO Use the router to handle messages
        // this.router.subscribe('hello/me/#:person', function(topic, message, params){
        //   console.log('received', topic, message, params);
        // });
        // this.client.on('message', (topic: string, message: string) => {
        //     //Winston.info(`mqtt on message: ${topic}.`);
        //     //if (topic[topic.length - 1] === "/") topic = topic.substring(0, topic.length - 2);
        //     // listen to layer updates
        //     if (topic === this.layerPrefix) {
        //         var layer = this.extractLayer(message);
        //         if (layer && layer.id) {
        //             Winston.info(`mqtt: received definition for layer ${layer.id} on topic ${topic}`);
        //             Winston.debug(`Definition: ${JSON.stringify(layer, null, 2)}`);
        //             this.manager.addUpdateLayer(layer, <ApiMeta>{ source: this.id }, () => { });
        //         }
        //     }
        //     else if (topic.indexOf(this.layerPrefix) === 0) {
        //         // We are either dealing with a layer update, or a feature update.
        //         // In the first case, the channel will be this.layerPrefix/layerId,
        //         // otherwise, it will be this.layerPrefix/layerId/feature/featureId.
        //         // So try to extract both. If there is only one, we are dealing a layer update.
        //         var ids = topic.substring(this.layerPrefix.length, topic.length).split('/feature/');
        //         var layerId = ids[0];
        //         if (ids.length === 1) {
        //             try {
        //                 var layer = this.extractLayer(message);
        //                 if (layer) {
        //                     Winston.debug(`mqtt: update layer ${layerId} on topic ${topic}`);
        //                     this.manager.addUpdateLayer(layer, <ApiMeta>{ source: this.id }, () => { });
        //                 }
        //             } catch (e) {
        //                 Winston.error(`mqtt: error updating layer, exception ${e}`);
        //             }
        //         } else {
        //             try {
        //                 var featureId = ids[1];
        //                 var feature = <Feature>JSON.parse(message);
        //                 if (feature) {
        //                     Winston.debug(`mqtt: update feature ${featureId} for layer ${layerId} on topic ${topic}.`);
        //                     this.manager.updateFeature(layerId, feature, <ApiMeta>{ source: this.id }, () => { });
        //                 }
        //             } catch (e) {
        //                 Winston.error(`mqtt: error updating feature, exception ${e}`);
        //             }
        //         }
        //     }
        //     else if (topic.indexOf(this.keyPrefix) === 0) {
        //         var kid = topic.substring(this.keyPrefix.length, topic.length).replace(/\//g, '.');
        //         if (kid) {
        //             try {
        //                 var obj = JSON.parse(message);
        //                 //Winston.debug('mqtt: update key for id ' + kid + " : " + message);

        //                 this.manager.updateKey(kid, obj, <ApiMeta>{ source: this.id }, () => { });
        //             }
        //             catch (e) {
        //                 Winston.error(`mqtt: error updating key for id ${kid}: ${message}. Error ${e}`);
        //             }
        //         }
        //     }
        // });
        callback();
    }

    private extractLayer(message: string) {
        var layer = <Layer>JSON.parse(message);
        // if you have a server, you don't need local storage
        if (layer.server) delete layer.storage;
        //if (!layer.server && layer.server === this.manager.options.server) return;
        return layer;
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
        Winston.info('subscribing key : ' + keyPattern);
        this.router.subscribe(keyPattern, (topic: string, message: string, params: Object) => {
            callback(topic, message.toString(), params);
        });
    }

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        this.updateLayer(layer, meta, callback);
    }

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        if (meta.source !== this.id) {
           // this.client.publish(`${this.layerPrefix}${layerId}/feature/${feature.id}`, JSON.stringify(feature));
        }
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        Winston.info('mqtt: update layer ' + layer.id);
        if (meta.source !== this.id) {
            var def = this.manager.getLayerDefinition(layer);
            delete def.storage;
            // Send the layer definition to everyone
      //      this.client.publish(this.layerPrefix, JSON.stringify(def));
            // And place all the data only on the specific layer channel
       //     this.client.publish(this.layerPrefix + layer.id, JSON.stringify(layer));
        }
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('mqtt update feature');
        if (meta.source !== this.id)
        //    this.client.publish(`${this.layerPrefix}${layerId}/feature/${feature.id}`, JSON.stringify(feature));
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public addUpdateFeatureBatch(layerId: string, features: ApiManager.IChangeEvent[], useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('mqtt update feature batch');
        if (meta.source !== this.id) {
    //        this.client.publish(`${this.layerPrefix}${layerId}/featurebatch`, JSON.stringify(features));
        }
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    private sendFeature(layerId: string, featureId: string) {
        this.manager.findFeature(layerId, featureId, (r: CallbackResult) => {
            if (r.result === ApiResult.OK) {
      //          this.client.publish(this.layerPrefix + layerId, JSON.stringify(r.feature));
            }
        });
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        this.sendFeature(layerId, featureId);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {
        this.sendFeature(layerId, featureId);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public initLayer(layer: Layer) {
        //this.client.subscribe(this.layerPrefix + layer.id + "/addFeature");
        Winston.info('mqtt: init layer ' + layer.id);
    }

    private getKeyChannel(keyId: string) {
        return this.keyPrefix + keyId.replace(/[\.]/g, '/');
    }

    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {
 //       this.client.publish(this.getKeyChannel(keyId), JSON.stringify(value));
    }
}
