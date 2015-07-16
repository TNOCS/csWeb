import LayerManager = require('LayerManager');
import express = require('express')
import Layer = LayerManager.Layer;
import Feature = LayerManager.Feature;
import Log = LayerManager.Log;
import ClientConnection = require('./../dynamic/ClientConnection');
import MessageBus = require('../bus/MessageBus');
import BaseConnector = require('./BaseConnector');

export class SocketIOAPI extends BaseConnector.BaseConnector {

    public manager: LayerManager.LayerManager

    constructor(public connection: ClientConnection.ConnectionManager) {
        super();
        this.isInterface = true;
    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init SocketIO API');
    }

    public initLayer(layer: Layer) {
        console.log('init layer ' + layer.id);
        this.connection.registerLayer(layer.id, (action: string, msg: ClientConnection.LayerMessage, client: string) => {
            console.log('socketio action:' + action);
            switch (action) {
                case "logUpdate":
                    // find feature
                    var featureId = msg.object.featureId;
                    var logs: { [key: string]: Log[] } = msg.object["logs"];
                    this.manager.updateLogs(layer.id, featureId, logs, () => { });
                    console.log(JSON.stringify(msg));

                    //this.manager.updateLogs(layer.id,featureId,)
                    //this.updateLog(layer, featureId, msg.object, client, true);
                    break;
                case "featureUpdate":
                    var ft: Feature = msg.object;
                    this.manager.updateFeature(layer.id, ft, (r) => { });
                    break;
            }
        });
    }

    public addFeature(layerId: string, feature: Feature, callback: Function) {
        this.connection.updateFeature(layerId, feature, "feature-update");
    }

    public updateFeature(layerId: string, feature: Feature, useLog: boolean, callback: Function) {
        console.log('socketio: update feature');
        this.connection.updateFeature(layerId, feature, "feature-update");
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, callback: Function) {
        var body = { action: "logUpdate", layerId: layerId, featureId: featureId, logs: logs };
        this.connection.updateFeature(layerId, body, "logs-update");
    }





}
