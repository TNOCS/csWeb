import ApiManager = require('ApiManager');
import express = require('express')
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import ClientConnection = require('./../dynamic/ClientConnection');
import LayerUpdate = ClientConnection.LayerUpdate;
import LayerUpdateAction = ClientConnection.LayerUpdateAction;
import MessageBus = require('../bus/MessageBus');
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');

export class SocketIOAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager

    constructor(public connection: ClientConnection.ConnectionManager) {
        super();
        this.isInterface = true;
    }

    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        Winston.info('socketio: init SocketIO API');
        this.connection.subscribe('layer', (result: ClientConnection.ClientMessage) => {
            var lu = <ClientConnection.LayerUpdate>result.data;
            if (lu) {
                ///TODO: check if lu.layerId really exists
                switch (lu.action) {
                    case ClientConnection.LayerUpdateAction.updateLog:
                        // find feature
                        var featureId = lu.object.featureId;
                        var logs: { [key: string]: Log[] } = lu.object["logs"];
                        this.manager.updateLogs(lu.layerId, featureId, logs, () => { });
                        break;
                    case ClientConnection.LayerUpdateAction.updateFeature:
                        var ft: Feature = lu.object;
                        this.manager.updateFeature(lu.layerId, ft, (r) => { });
                        break;
                    case ClientConnection.LayerUpdateAction.deleteFeature:
                        this.manager.deleteFeature(lu.layerId, lu.object, (r) => { });
                        break;
                }
            }
            //result.data
        })
    }

    public initLayer(layer: Layer) {
        Winston.info('socketio: init layer ' + layer.id);
        this.connection.registerLayer(layer.id, (action: string, msg: ClientConnection.LayerUpdate, client: string) => {
            Winston.debug('socketio: action:' + action);

        });
    }

    public addFeature(layerId: string, feature: Feature, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.updateFeature, object: feature };
        this.connection.updateFeature(layerId, lu);
    }

    public updateFeature(layerId: string, feature: Feature, useLog: boolean, callback: Function) {
        Winston.info('socketio: update feature');
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.updateFeature, object: feature };
        this.connection.updateFeature(layerId, lu);
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.updateLog, object: logs, featureId: featureId };
        this.connection.updateFeature(layerId, lu);
    }





}
