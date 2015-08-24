import ApiManager = require('ApiManager');
import express = require('express')
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import ClientConnection = require('./../dynamic/ClientConnection');
import LayerUpdate = ClientConnection.LayerUpdate;
import LayerUpdateAction = ClientConnection.LayerUpdateAction;
import ApiMeta = ApiManager.ApiMeta;
import MessageBus = require('../bus/MessageBus');
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');

export class SocketIOAPI extends BaseConnector.BaseConnector {

    public manager: ApiManager.ApiManager

    constructor(public connection: ClientConnection.ConnectionManager) {
        super();
        this.id = "socketio";
        this.isInterface = true;
    }

    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        Winston.info('socketio: init SocketIO API');
        this.connection.subscribe('layer', (result: ClientConnection.ClientMessage, clientId: string) => {
            var lu = <ClientConnection.LayerUpdate>result.data;
            if (lu) {
                ///TODO: check if lu.layerId really exists
                switch (lu.action) {
                    case ClientConnection.LayerUpdateAction.updateLog:
                        // find feature
                        var featureId = lu.item.featureId;
                        var logs: { [key: string]: Log[] } = lu.item["logs"];
                        this.manager.updateLogs(lu.layerId, featureId, logs, <ApiMeta>{ source: this.id, user: clientId }, () => { });
                        break;
                    case ClientConnection.LayerUpdateAction.updateFeature:
                        var ft: Feature = lu.item;
                        this.manager.updateFeature(lu.layerId, ft, <ApiMeta>{ source: this.id, user: clientId }, (r) => { });
                        break;
                    case ClientConnection.LayerUpdateAction.deleteFeature:
                        this.manager.deleteFeature(lu.layerId, lu.item, <ApiMeta>{ source: this.id, user: clientId }, (r) => { });
                        break;
                }
            }
            //result.data
        })
    }

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        //this.connection.publish();
        Winston.error('add layer ' + layer.title);
    }

    public initLayer(layer: Layer) {
        Winston.info('socketio: init layer ' + layer.id);
        this.connection.registerLayer(layer.id, (action: string, msg: ClientConnection.LayerUpdate, client: string) => {
            Winston.debug('socketio: action:' + action);
        });
    }

    public addFeature(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.updateFeature, item: feature };
        this.connection.updateFeature(layerId, lu, meta);
    }

    public updateFeature(layerId: string, feature: Feature, useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('socketio: update feature');
        var lu = <LayerUpdate>{ layerId: layerId, featureId: feature.id, action: LayerUpdateAction.updateFeature, item: feature };
        this.connection.updateFeature(layerId, lu, meta);
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {
        Winston.error('lu:' + JSON.stringify(logs));
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.updateLog, item: logs, featureId: featureId };
        this.connection.updateFeature(layerId, lu, meta);
    }

    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.deleteFeature, featureId: featureId };
        this.connection.updateFeature(layerId, lu, meta);
    }





}
