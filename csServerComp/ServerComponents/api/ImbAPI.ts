import ApiManager = require('./ApiManager');
import express = require('express')
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;

import BaseConnector = require('./BaseConnector');
import Winston = require('winston');



export class ImbAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager
    public client: any;
    public router: any;

    public imb = require('ServerComponents/api/imb.js');
    public imbConnection: any;
    public mainEvent: any;

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
        //this.messageSub = this.imbConnection.subscribe('CSwebSession', true);

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

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        //        this.messageSub
    }



    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {


    }


    /** Update the value for a given keyId */
    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {

    }
    /** Delete key */
    public deleteKey(keyId: string, meta: ApiMeta, callback: Function) {
    }

}
