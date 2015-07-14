import LayerManager = require('./LayerManager');
import express = require('express')
import Layer = LayerManager.Layer;
import CallbackResult = LayerManager.CallbackResult;
import mqtt = require("mqtt");

//declare var mqtt;

export class MqttAPI implements LayerManager.IApiInterface {

    public manager: LayerManager.LayerManager



    constructor(public server: string, public port: number = 1883) {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init mqtt API');

        /*var client = mqtt.connect("mqtt://" + this.server + ":" + this.port);

        client.on('error', (e) => {
            console.log('error');
        });

        client.on('connect', () => {
            console.log("mqtt connected");
        });

        client.on('reconnect', () => {
            console.log("mqtt reconnecting");
        });

        client.subscribe('test');
        client.on('message', (topic, message) => {
            console.log(message.toString());
            client.publish('testje', message.toString());
        });*/

        // express api aanmaken
        // vb. addFeature,



        // doorzetten naar de layermanager


    }

}
