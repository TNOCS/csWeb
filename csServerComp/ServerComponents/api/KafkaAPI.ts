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
import xml2js = require('xml2js');
import _ = require('underscore');

var MAX_TRIES_SEND = 5;

export enum KafkaCompression {
    NoCompression = 0,
        GZip = 1,
        snappy = 2
}

export class KafkaOptions {
    consumers: string[] | Dictionary<number>; // Either a list of topics or key-value pairs of {topic: offset} 
    consumer: string;
    producers: string[];
}

export class KafkaAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager;
    public consumer: string;
    private router;

    public kafkaClient: kafka.Client;
    public kafkaConsumer: kafka.Consumer;
    public kafkaProducer: kafka.Producer;
    public kafkaOffset: kafka.Offset;
    private xmlBuilder;
    private xmlParser;

    private producerReady: boolean = false;
    private offsetReady: boolean = false;    
    private layersWaitingToBeSent: Layer[] = [];

    constructor(public server: string, public port: number = 8082, public kafkaOptions: KafkaOptions, public layerPrefix = 'layers', public keyPrefix = 'keys') {
        super();
        this.isInterface = true;
        this.receiveCopy = false;
        this.consumer = kafkaOptions.consumer || "csweb-consumer";
        this.xmlBuilder = new xml2js.Builder({
            headless: false
        });
        this.xmlParser = new xml2js.Parser({
            ignoreAttrs: true,
            explicitArray: false
        });
    }

    public addProducer(topic: string) {
        if (!this.kafkaOptions.producers) {
            this.kafkaOptions.producers = [topic];
        } else if (!_.find(this.kafkaOptions.producers, topic)) {
            this.kafkaOptions.producers.push(topic);
        }
    }

    /**
     * 
     * Subscribe to the topic from the give offset. If no offset is defined, start listening from the latest offset. 
     * @param {string} layer
     * @param {number} [fromOffset=-1]
     * 
     * @memberOf KafkaAPI
    
     */
    public subscribeLayer(layer: string, fromOffset: number = -1) {
        fromOffset = +fromOffset;
        Winston.info(`Subscribe kafka layer : ${layer} from ${(fromOffset >= 0 ? fromOffset : 'latest')}`);
        var topic = layer;

        this.waitForOffsetToBeReady((ready) => {
            this.fetchLatestOffsets(topic, (latestOffset) => {
                let offset = +latestOffset;
                if (fromOffset >= 0 && fromOffset <= latestOffset) {
                    offset = fromOffset;
                }
                this.kafkaConsumer.addTopics([{
                    topic: topic,
                    encoding: 'utf8',
                    autoCommit: false,
                    offset: offset || 0
                }], (err, added) => {
                    if (err) {
                        Winston.error(`${err}`);
                    } else {
                        Winston.info(`Kafka subscribed to topic ${topic} from offset ${offset}`);
                    }
                }, true);
            });
        });
    }

    private waitForOffsetToBeReady(cb: Function) {
        if (!this.offsetReady) {
            setTimeout(() => { this.waitForOffsetToBeReady(cb); }, 250);
        } else {
            cb(true);
        }
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
        this.kafkaConsumer = new kafka.Consumer(this.kafkaClient, [], {
            fetchMaxBytes: 5 * 1024 * 1024
        });
        this.kafkaProducer = new kafka.Producer(this.kafkaClient);
        this.kafkaOffset = new kafka.Offset(this.kafkaClient);

        this.kafkaOffset.on('ready', (err) => {
            this.offsetReady = true;
            Winston.info(`Kafka producer ready to send`);
        });

        this.kafkaOffset.on('error', (err) => {
            Winston.error(`Kafka error: ${JSON.stringify(err)}`);
        });

        this.kafkaConsumer.on('message', (message: {
            topic: string,
            value: string,
            offset: number,
            partition: number,
            key: number
        }) => {

            // scenarioUpdate or scenarioActivation message
            if (message.value && message.value.indexOf('<?xml') === 0) {
                var parsedMessage = this.parseXmlMessage(message.value, (scenarioMessage) => {
                    if (scenarioMessage) {
                        this.manager.updateKey(Object.keys(scenarioMessage).shift(), scenarioMessage, < ApiMeta > {
                            source: 'kafka'
                        }, () => {});
                    }
                });
                return;
            }

            var l;
            if (message.value && message.value.length > 0 && message.value[0] !== '{') {
                l = {
                    data: message.value,
                    type: "grid"
                };
                // esri grid
            } else {
                try {
                    // geojson
                    l = JSON.parse(message.value);
                } catch (e) {
                    Winston.error("Error parsing kafka message: " + e.msg); // + message.value);
                }
            }
            if (l) {
                l.id = message.topic;
                l.offset = message.offset;
                this.manager.addUpdateLayer(l, < ApiMeta > {
                    source: this.id
                }, () => {});
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
                    this.updateLayer(l, {}, () => {});
                });
            }
            Winston.info(`Kafka producer ready to send`);
        });

        this.kafkaProducer.on('error', (err) => {
            Winston.error(`Kafka error: ${JSON.stringify(err)}`)
        });

        var subscriptions: any = this.kafkaOptions.consumers || 'arnoud-test6';
        if (typeof subscriptions === 'string') {
            this.subscribeLayer(subscriptions);
            //this.client.subscribe(subscriptions);
        } else {
            _.each(subscriptions, (val: any, key: string) => {
                // subscription is either a string array or a Dictionary<number>:
                // case string array: val = topic, key = array index number
                // case Dictionary<number>: val = number, key = topic
                if (key && typeof key === 'string') {
                    this.subscribeLayer(key, val);
                } else {
                    this.subscribeLayer(val);
                }
            });
        }

        callback();
    }

    private parseXmlMessage(msg: string, cb: Function) {
        this.xmlParser.parseString(msg, (err, parsedData: any) => {
            if (err) {
                Winston.error(err);
                cb();
            } else {
                // Winston.info(JSON.stringify(parsedData, null, 2));
                var update: any = this.findObjectByLabel(parsedData, 'scenarioUpdate');
                if (update) {
                    // Single element arrays in xml will be parsed to an object, so convert them back to an array manually.
                    if (update.scenarioUpdate.records && update.scenarioUpdate.records.record && !(update.scenarioUpdate.records.record.length)) {
                        update.scenarioUpdate.records.record = [update.scenarioUpdate.records.record];
                    }
                    cb(update);
                }
            }
        });
    }

    /**
     * 
     * Recursively search an object for the desired label and return that part of the object
     * @export
     * @param {Object} object to search
     * @param {string} label to find
     * @returns Object with the label, or null
     */
    private findObjectByLabel(object: Object, label: string): Object {
        if (object.hasOwnProperty(label)) {
            return object;
        }
        for (let key in object) {
            if (object.hasOwnProperty(key) && (typeof object[key] === 'object')) {
                let foundLabel = this.findObjectByLabel(object[key], label);
                if (foundLabel) {
                    return foundLabel;
                }
            }
        }
        return null;
    };

    private extractLayer(message: string) {
        var layer = < Layer > JSON.parse(message);
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
    public subscribeKey(keyPattern: string, meta: ApiMeta, callback: (topic: string, message: string, params ? : Object) => void) {
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
        callback( < CallbackResult > {
            result: ApiResult.OK
        });
    }

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        Winston.info('kafka: update layer ' + layer.id + ' (' + (this.producerReady) ? 'delayed)' : 'directly)');
        if (meta.source !== this.id && this.kafkaOptions.producers && this.kafkaOptions.producers.indexOf(layer.id) >= 0) {
            var def = this.manager.getLayerDefinition(layer);
            delete def.storage;
            var buff = new Buffer(JSON.stringify(layer), "utf-8");
            if (this.producerReady) {
                this.sendPayload(layer.id, buff, KafkaCompression.GZip);
            } else {
                this.layersWaitingToBeSent.push(layer);
            }
            // Send the layer definition to everyone
            //      this.client.publish(this.layerPrefix, JSON.stringify(def));
            // And place all the data only on the specific layer channel
            //     this.client.publish(this.layerPrefix + layer.id, JSON.stringify(layer));
        }
        callback( < CallbackResult > {
            result: ApiResult.OK
        });
    }

    public sendPayload(topic: string, buffer: Buffer, compression: KafkaCompression = KafkaCompression.GZip, tries: number = 1) {
        var payloads = [{
            topic: topic,
            messages: buffer,
            attributes: compression
        }];

        if (this.producerReady) {
            this.kafkaProducer.send(payloads, (err, data) => {
                if (err) {
                    if (tries < MAX_TRIES_SEND) {
                        Winston.warn(`Kafka failed to send: ${JSON.stringify(err)} (tries: ${tries}/${MAX_TRIES_SEND}). Trying again...`);
                        setTimeout(() => { this.sendPayload(topic, buffer, compression, tries + 1) }, 500);
                    } else {
                        Winston.error(`Kafka error trying to send: ${JSON.stringify(err)} (tries: ${tries}/${MAX_TRIES_SEND})`);
                    }
                } else {
                    Winston.debug("Kafka sent message");
                }
            });
        } else {
            Winston.warn('Kafka producer not ready');
        }
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('kafka update feature');
        this.manager.getLayer(layerId, meta, (r: CallbackResult) => {
            if (!r.error && r.layer) {
                this.updateLayer(r.layer, meta, c => {
                    callback(c);
                })
            } else {
                callback( < CallbackResult > {
                    result: ApiResult.LayerNotFound
                });
            }
        });
    }

    public addUpdateFeatureBatch(layerId: string, features: ApiManager.IChangeEvent[], useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.debug('kafka update feature batch');
        if (meta.source !== this.id) {
            this.manager.getLayer(layerId, meta, (r: CallbackResult) => {
                if (!r.error && r.layer) {
                    this.updateLayer(r.layer, meta, c => {
                        callback(c);
                    })
                } else {
                    callback( < CallbackResult > {
                        result: ApiResult.LayerNotFound
                    });
                }
            });
        }
        callback( < CallbackResult > {
            result: ApiResult.OK
        });
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
        callback( < CallbackResult > {
            result: ApiResult.OK
        });
    }

    public updateLogs(layerId: string, featureId: string, logs: {
        [key: string]: Log[]
    }, meta: ApiMeta, callback: Function) {
        this.sendFeature(layerId, featureId);
        callback( < CallbackResult > {
            result: ApiResult.OK
        });
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

    public setOffset(topic: string, offset: number) {
        this.kafkaConsumer.setOffset(topic, 0, offset);
    }

    public fetch(topic: string, time: number, cb: Function) {
        let payload: kafka.OffsetRequest = {
            topic: topic,
            time: time,
            maxNum: 1
        };
        if (!this.offsetReady) {
            Winston.error(`kafka: offset not ready`);
            cb();
            return;
        }
        this.kafkaOffset.fetch([payload], (err, offsets) => {
            if (err) {
                Winston.error(`kafka: error fetching: ${JSON.stringify(err)}`);
                cb();
            } else {
                cb(offsets[topic][0]);
            }
        });
    }

    /**
     * @param {string} topic
     * @param {Function} cb Calls back 'true' when topic exists. 
     */
    public topicExists(topic: string, cb: Function) {
        this.kafkaClient.topicExists([topic], (notExisting: any) => {
            if (notExisting && notExisting.topics && notExisting.topics.indexOf(topic) >= 0) {
                cb(false);
            } else {
                cb(true);
            }
        });
    }

    public fetchLatestOffsets(topic: string, cb: Function) {
        if (!this.offsetReady) {
            Winston.error(`kafka: offset not ready`);
            cb();
            return;
        }
        this.kafkaOffset.fetchLatestOffsets([topic], (err, offsets) => {
            if (err) {
                Winston.error(`kafka: error fetching latest offsets: ${JSON.stringify(err)}`);
                cb();
            } else {
                cb(offsets[topic][0]);
            }
        });
    }
}