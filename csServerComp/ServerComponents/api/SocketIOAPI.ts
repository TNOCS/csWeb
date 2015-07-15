import LayerManager = require('LayerManager');
import express = require('express')
import Layer = LayerManager.Layer;
import Feature = LayerManager.Feature;
import ClientConnection = require('./../dynamic/ClientConnection');
import MessageBus = require('../bus/MessageBus');
import BaseConnector = require('./BaseConnector');

export class SocketIOAPI extends BaseConnector.BaseConnector {

    public manager: LayerManager.LayerManager

    constructor(public connection: ClientConnection.ConnectionManager) {
        super();
    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init SocketIO API');
    }

    public initLayer(layer: Layer) {
        console.log('init layer ' + layer.id);
        this.connection.registerLayer(layer.id, (action: string, msg: ClientConnection.LayerMessage, client: string) => {
            var feature;
            switch (action) {
                case "logUpdate":
                    // find feature
                    var featureId = msg.object.featureId;
                    this.updateLog(layer, featureId, msg.object, client, true);
                    break;
                case "featureUpdate":
                    var ft: Feature = msg.object;
                    this.manager.updateFeature(layer.id, ft, (r) => { });
                    break;
            }
        });
    }

    updateLog(layer: Layer, featureId: string, msgBody: any, client?: string, notify?: boolean) {
        console.log("Log update" + featureId);
        var f: Feature;
        layer.features.some(feature => {
            if (!feature.id || feature.id !== featureId) return false;
            // feature found
            f = feature;
            return true;
        });
        if (!f) return; // feature not found
        if (!f.hasOwnProperty('logs')) f.logs = {};
        if (!f.hasOwnProperty('properties')) f.properties = {};

        // apply changes
        var logs = msgBody.logs;

        for (var key in logs) {
            if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
            logs[key].forEach(l=> {
                f.logs[key].push(l);
                f.properties[key] = l.value;
            });

            // send them to other clients
            //this.connection.updateFeature(this.layerId, msgBody, "logs-update", client);
        }

        //if (notify) this.emit("featureUpdated", this.layerId, featureId);
    }



}
