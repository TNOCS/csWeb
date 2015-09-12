import ApiManager = require('./ApiManager');
import express = require('express')
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import ClientConnection = require('./../dynamic/ClientConnection');
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');

export class ImbAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager
    public client: any;
    public router: any;

    public imb = require('./imb.js');
    public imbConnection: any;
    public layersEvent: any;
    public keysEvent: any;

    constructor(public server: string, public port: number = 1883, private layerPrefix = "layers", private keyPrefix = "keys") {
        super();
        this.isInterface = true;
        this.receiveCopy = false;
        this.imbConnection = new this.imb.TIMBConnection();
    }

    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        this.layerPrefix = (this.manager.name + "/" + this.layerPrefix + "/").replace("//", "/");
        this.keyPrefix = (this.manager.name + "/" + this.keyPrefix + "/").replace("//", "/");
        Winston.info('imb: init imb connector');

        this.imbConnection.connect(this.server, this.port, 1234, 'CSweb', 'USIdle');
        this.layersEvent = this.imbConnection.subscribe('CSweb.layers', true);
        this.layersEvent.onNormalEvent = (eventDefinition, aEventPayload) => {
            var cmd = aEventPayload.readInt32LE(0);
            var layerIDLen = aEventPayload.readInt32LE(4);
            var layerID = aEventPayload.toString("utf8", 8, 8 + layerIDLen);
            switch (cmd) {
                case ClientConnection.LayerUpdateAction.updateLayer:
                    var layer = <Layer> { storage: "file", type: "geojson", id: layerID, title: layerID };
                    this.manager.addLayer(layer, <ApiMeta>{ source: this.id, user: "US" }, () => { });
                    var layerEvent = this.imbConnection.subscribe(eventDefinition.name + "." + layerID);
                    layerEvent.onNormalEvent = (eventDefinition, aEventPayload) => {
                        var cmd = aEventPayload.readInt32LE(0);
                        var valueLen = aEventPayload.readInt32LE(4);
                        var value = aEventPayload.toString("utf8", 8, 8 + valueLen);
                        switch (cmd) {
                            case ClientConnection.LayerUpdateAction.updateFeature:
                                this.manager.updateFeature(layerID, JSON.parse(value), <ApiMeta>{ source: this.id, user: "US" }, () => { });
                                break;
                            case ClientConnection.LayerUpdateAction.deleteFeature:
                                this.manager.deleteFeature(layerID, value, <ApiMeta>{ source: this.id, user: "US" }, () => { });
                                break;
                            case ClientConnection.LayerUpdateAction.updateLayer:
                                this.manager.updateLayer(layerID, JSON.parse(value), <ApiMeta>{ source: this.id, user: "US" }, () => { });
                                break;
                        }
                    }
                    break;
                case ClientConnection.LayerUpdateAction.deleteLayer:
                    this.manager.deleteLayer(layerID, <ApiMeta>{ source: this.id, user: "US" }, () => { });
                    eventDefinition.unsubscribe();
                    eventDefinition.unPublish();
                    break;
            }
        }
        this.keysEvent = this.imbConnection.subscribe('CSweb.keys', true);
        this.keysEvent.onNormalEvent = (eventDefinition, aEventPayload) => {
            var cmd = aEventPayload.readInt32LE(0);
            var keyIDLen = aEventPayload.readInt32LE(4);
            var keyID = aEventPayload.toString("utf8", 8, 8 + keyIDLen);
            switch (cmd) {
                case ClientConnection.KeyUpdateAction.updateKey:
                    var keyEvent = this.imbConnection.subscribe(eventDefinition.name + "." + keyID);
                    keyEvent.onNormalEvent = (eventDefinition, aEventPayload) => {
                        var cmd = aEventPayload.readInt32LE(0);
                        var valueLen = aEventPayload.readInt32LE(4);
                        var value = aEventPayload.toString("utf8", 8, 8 + valueLen);
                        switch (cmd) {
                            case ClientConnection.KeyUpdateAction.updateKey:
                                Winston.error("value " + value);
                                this.manager.updateKey(keyID, JSON.parse(value.toString()), <ApiMeta>{ source: this.id, user: "US" }, () => { });
                                break;
                        }
                    }
                    break;
                case ClientConnection.LayerUpdateAction.deleteLayer:
                    //this.manager.keydeelete(keyID, JSON.parse(value), <ApiMeta>{ source:this.id, user: "US"}, ()  => {});
                    eventDefinition.unsubscribe();
                    eventDefinition.unPublish();
                    break;
            }
        }

        //this.messageSub.onNormalEvent = (eventDefinition, aEventPayload) => {

        /*var l = new Layer();
        l.storage = "file";
        l.id = "";
        l.features = [];
        var f = new Feature();
        f.geometry.type = "Point";
        f.geometry.coordinates = [5.4,54];
        f.properties = {};
        f.properties["afgesloten"] = 0;
        l.features.push(f);
        this.manager.addLayer(l,<ApiMeta>{ source : "imb"},()=>{});

        console.log('onChangeObject');
        console.log(shortEventName + ' ' + attributeName + ' ' +
            action.toString() + ' ' + objectID.toString());
        //io.emit('testchannel', shortEventName + ' ' + attributeName);
        */
    }



    //this.client = (<any>mqtt).connect("mqtt://" + this.server + ":" + this.port);

    //
    // this.client.on('error', (e) => {
    //     Winston.warn('mqtt: error');
    // });
    //
    // this.client.on('connect', () => {
    //     Winston.info("mqtt: connected");
    //     // server listens to all key updates
    //     if (!this.manager.isClient) {
    //         Winston.info("mqtt: listen to everything");
    //         this.client.subscribe("#");
    //     }
    // });
    //
    // this.client.on('reconnect', () => {
    //     Winston.debug("mqtt: reconnecting");
    //
    // });
    //
    // this.client.on('message', (topic, message) => {
    //     Winston.info("mqtt: " + topic + "-" + message.toString());
    //     //this.manager.updateKey(topic, message, <ApiMeta>{}, () => { });
    //
    //     //_.startsWith(topic,this.keyPrefix)
    // });






    // feature methods, in crud order

    protected buildCmdValue(cmd, value) {
        var valueByteLength = Buffer.byteLength(value); // default is utf8
        var payload = new Buffer(8 + valueByteLength);
        payload.writeInt32LE(cmd, 0);
        payload.writeInt32LE(valueByteLength, 4)
        payload.write(value, 8); // default is utf8
        return payload;
    }

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        if (meta.source != this.id) {
            this.imbConnection.publish("layers." + layerId).normalEvent(ekNormalEvent, this.buildCmdValue(
                ClientConnection.LayerUpdateAction.updateFeature,
                JSON.stringify(feature)));
        }
        callback({ result: ApiResult.OK });
    }

    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        if (meta.source != this.id) {
            this.imbConnection.publish("layers." + layerId).normalEvent(ekNormalEvent, this.buildCmdValue(
                ClientConnection.LayerUpdateAction.updateFeature,
                JSON.stringify(feature)));
        }
        callback({ result: ApiResult.OK });
    }

    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        if (meta.source != this.id) {
            this.imbConnection.publish("layers." + layerId).normalEvent(ekNormalEvent, this.buildCmdValue(
                ClientConnection.LayerUpdateAction.deleteFeature,
                featureId));
        }
        callback({ result: ApiResult.OK });
    }

    /** Update the value for a given keyId */
    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {
        if (meta.source != this.id) {
            this.imbConnection.publish("keys." + keyId).normalEvent(ekNormalEvent, this.buildCmdValue(
                ClientConnection.KeyUpdateAction.updateKey,
                keyId));
        }
        callback({ result: ApiResult.OK });
    }

    /** Delete key */
    public deleteKey(keyId: string, meta: ApiMeta, callback: Function) {
        if (meta.source != this.id) {
            this.imbConnection.publish("keys").normalEvent(ekNormalEvent, this.buildCmdValue(
                ClientConnection.KeyUpdateAction.deleteKey,
                keyId));
        }
        callback({ result: ApiResult.OK });
    }
}
