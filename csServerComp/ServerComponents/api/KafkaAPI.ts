import ApiManager = require('./ApiManager');
import express = require('express');
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');
import kafka = require('kafka-node');

export class KafkaOptions {
    consumers: string[];
    consumer: string;
    producers: string[];
}

export class KafkaAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager;
    public consumer: string;

    public kafkaClient;
    public kafkaConsumer;
    public kafkaProducer;
    public kafkaOffset;

    private producerReady: boolean = false;
    private layersWaitingToBeSent: Layer[] = [];

    constructor(public server: string, public port: number = 8082, public kafkaOptions: KafkaOptions, public layerPrefix = 'layers', public keyPrefix = 'keys') {
        super();
        this.isInterface = true;
        this.receiveCopy = false;
        this.consumer = kafkaOptions.consumer || "csweb-consumer";
    }

    public subscribeLayer(layer: string) {
        Winston.info("Subscribe kafka layer : " + layer);

        var topic = layer;
        this.kafkaConsumer.addTopics([{ topic: topic, encoding: 'utf8', autoCommit: false }], (err, added) => {
            if (err) {
                Winston.error(`${err}`);
            } else {
                Winston.info(`Kafka subscribed to topic ${topic}`);
            }
        }, true);
    }

    public exit(callback: Function) {
        Winston.info('Closing kafka connection');
        callback();
    }

    public init(layerManager: ApiManager.ApiManager, options: any, callback: Function) {

        this.manager = layerManager;
        this.layerPrefix = (this.manager.namespace + '-' + this.layerPrefix + '-').replace('//', '/');
        this.keyPrefix = (this.manager.namespace + '/' + this.keyPrefix + '/').replace('//', '/');
        Winston.info('kafka: init kafka connector on address ' + this.server + ':' + this.port);
        //this.kafka = new KafkaRest({ 'url': this.server + ':' + this.port });

        this.kafkaClient = new kafka.Client(this.server + ':' + this.port, this.consumer);
        this.kafkaConsumer = new kafka.Consumer(this.kafkaClient, [], { fetchMaxBytes: 5 * 1024 * 1024 });
        this.kafkaProducer = new kafka.Producer(this.kafkaClient);
        this.kafkaOffset = new kafka.Offset(this.kafkaClient);

        this.kafkaConsumer.on('message', (message: { topic: string, value: string, offset: number, partition: number, key: number }) => {

            var l;
            if (message.value && message.value.length > 0 && message.value[0] !== '{') {
                l = { data: message.value, type: "grid" };
                // esri grid
            } else {
                try {
                    // geojson
                    l = JSON.parse(message.value);
                }
                catch (e) {
                    Winston.error("Error parsing kafka message: " + e.msg);// + message.value);
                }
            }
            if (l) {
                l.id = message.topic;
                this.manager.addUpdateLayer(l, <ApiMeta>{ source: this.id }, () => { });
            }
        });

        this.kafkaConsumer.on('error', (err) => {
            Winston.error(`Kafka error: ${JSON.stringify(err)}`);
        });

        this.kafkaConsumer.on('offsetOutOfRange', (err) => {
            Winston.warn(`Kafka offsetOutOfRange: ${JSON.stringify(err)}`);
        });

        this.kafkaProducer.on('ready', (err) => {
            this.producerReady = true;
            if (this.layersWaitingToBeSent.length > 0) {
                this.layersWaitingToBeSent.forEach((l) => {
                    this.updateLayer(l, {}, () => { });
                });
            }
            Winston.info(`Kafka producer ready to send`);
        });

        this.kafkaProducer.on('error', (err) => {
            Winston.error(`Kafka error: ${JSON.stringify(err)}`)
        });

        var subscriptions = this.kafkaOptions.consumers || 'arnoud-test6';
        if (typeof subscriptions === 'string') {
            this.subscribeLayer(subscriptions);
            //this.client.subscribe(subscriptions);
        } else {
            subscriptions.forEach(s => this.subscribeLayer(s));
        }

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
        Winston.info('kafka: update layer ' + layer.id);
        if (meta.source !== this.id && this.kafkaOptions.producers && this.kafkaOptions.producers.indexOf(layer.id) >= 0) {
            var def = this.manager.getLayerDefinition(layer);
            delete def.storage;
            var buff = new Buffer(JSON.stringify(layer), "utf-8");
            var payloads = [
                { topic: layer.id, messages: buff }
            ];

            if (this.producerReady) {
                this.kafkaProducer.send(payloads, (err, data) => {
                    if (err) {
                        Winston.error(`${JSON.stringify(err)}`);
                    } else {
                        Winston.info("Kafka sent message");
                    }
                });
            } else {
                this.layersWaitingToBeSent.push(layer);
                Winston.warn('Kafka producer not ready');
            }
            // Send the layer definition to everyone
            //      this.client.publish(this.layerPrefix, JSON.stringify(def));
            // And place all the data only on the specific layer channel
            //     this.client.publish(this.layerPrefix + layer.id, JSON.stringify(layer));
        }
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('kafka update feature');
        this.manager.getLayer(layerId, meta, (r: CallbackResult) => {
            if (!r.error && r.layer) {
                this.updateLayer(r.layer, meta, c => {
                    callback(c);
                })
            }
            else {
                callback(<CallbackResult>{ result: ApiResult.LayerNotFound });
            }
        });
    }

    public addUpdateFeatureBatch(layerId: string, features: ApiManager.IChangeEvent[], useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('kafka update feature batch');
        if (meta.source !== this.id) {
            this.manager.getLayer(layerId, meta, (r: CallbackResult) => {
                if (!r.error && r.layer) {
                    this.updateLayer(r.layer, meta, c => {
                        callback(c);
                    })
                }
                else {
                    callback(<CallbackResult>{ result: ApiResult.LayerNotFound });
                }
            });
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
        Winston.info('kafka: init layer ' + layer.id);
    }

    private getKeyChannel(keyId: string) {
        return this.keyPrefix + keyId.replace(/[\.]/g, '/');
    }

    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {
        //       this.client.publish(this.getKeyChannel(keyId), JSON.stringify(value));
    }
}
