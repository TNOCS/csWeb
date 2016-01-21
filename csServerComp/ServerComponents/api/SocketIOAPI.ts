import ApiManager = require('./ApiManager');
import express = require('express')
import Project = ApiManager.Project;
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import ClientConnection = require('./../dynamic/ClientConnection');
import ProjectUpdate = ClientConnection.ProjectUpdate;
import ProjectUpdateAction = ClientConnection.ProjectUpdateAction;
import LayerUpdate = ClientConnection.LayerUpdate;
import LayerUpdateAction = ClientConnection.LayerUpdateAction;
import KeyUpdate = ClientConnection.KeyUpdate;
import KeyUpdateAction = ClientConnection.KeyUpdateAction;
import ApiMeta = ApiManager.ApiMeta;
import ApiResult = ApiManager.ApiResult;
import CallbackResult = ApiManager.CallbackResult;
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

    public init(layerManager: ApiManager.ApiManager, options: any, callback : Function) {
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
        });
        
        
        
        this.connection.subscribe('project', (result: ClientConnection.ClientMessage, clientId: string) => {                        
            var lu = <ClientConnection.ProjectUpdate>result.data;
            if (lu) {                
                ///TODO: check if lu.layerId really exists
                switch (lu.action) {
                    case ClientConnection.ProjectUpdateAction.updateProject:                        
                        var p: Project = JSON.parse(lu.item);                                                                        
                        this.manager.updateProject(p, <ApiMeta>{ source: this.id, user: clientId }, (r) => { });
                        break;
                    case ClientConnection.ProjectUpdateAction.deleteProject:
                        this.manager.deleteProject(lu.projectId, <ApiMeta>{ source: this.id, user: clientId }, (r) => { });
                        break;
                }
            }
            //result.data
        });
        this.connection.subscribe('key', (result: ClientConnection.ClientMessage, clientId: string) => {
            var lu = <ClientConnection.KeyUpdate>result.data;
            if (lu) {
                ///TODO: check if lu.layerId really exists
                switch (lu.action) {
                    case ClientConnection.KeyUpdateAction.updateKey:
                        // find feature
                        var keyId = lu.item.keyId;
                        this.manager.updateKey(lu.keyId, lu.item, <ApiMeta>{ source: this.id, user: clientId }, () => { });
                        break;
                }
            }
            //result.data
        })
        callback();
    }
    
     /** Sends a message (json) to a specific project, only works with socket io for now */
    public sendClientMessage(project : string, message : Object)
    {        
        this.connection.publish(project, "layer", "msg", message);
    }

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        //this.connection.publish();
        var lu = <LayerUpdate>{ layerId: layer.id, action: LayerUpdateAction.updateLayer, item: layer };
        this.connection.updateLayer(layer.id, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layer.id, action: LayerUpdateAction.updateLayer, item: layer };
        this.connection.updateLayer(layer.id, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.deleteLayer };
        this.connection.updateLayer(layerId, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK })
    }

    public initLayer(layer: Layer) {
        Winston.info('socketio: init layer ' + layer.id);
        this.connection.registerLayer(layer.id, (action: string, msg: ClientConnection.LayerUpdate, client: string) => {
            Winston.debug('socketio: action:' + action);
        });
    }


    public addProject(project: Project, meta: ApiMeta, callback: Function) {
        //this.connection.publish();
        var lu = <ProjectUpdate>{ projectId: project.id, action: ProjectUpdateAction.updateProject, item: project };
        this.connection.updateProject(project.id, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateProject(project: Project, meta: ApiMeta, callback: Function) {
        var lu = <ProjectUpdate>{ projectId: project.id, action: ProjectUpdateAction.updateProject, item: project };
        this.connection.updateProject(project.id, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public deleteProject(projectId: string, meta: ApiMeta, callback: Function) {
        var lu = <ProjectUpdate>{ projectId: projectId, action: ProjectUpdateAction.deleteProject };
        this.connection.updateProject(projectId, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK })
    }

    public initProject(project: Project) {
        Winston.info('socketio: init project ' + project.id);
        this.connection.registerProject(project.id, (action: string, msg: ClientConnection.ProjectUpdate, client: string) => {
            Winston.debug('socketio: action:' + action);
        });
    }

    public addFeature(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.updateFeature, item: feature };
        this.connection.updateFeature(layerId, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateFeature(layerId: string, feature: Feature, useLog: boolean, meta: ApiMeta, callback: Function) {
        Winston.info('socketio: update feature');
        var lu = <LayerUpdate>{ layerId: layerId, featureId: feature.id, action: LayerUpdateAction.updateFeature, item: feature };
        this.connection.updateFeature(layerId, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {
        Winston.info('socketio: update logs ' + JSON.stringify(logs));
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.updateLog, item: logs, featureId: featureId };
        this.connection.updateFeature(layerId, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var lu = <LayerUpdate>{ layerId: layerId, action: LayerUpdateAction.deleteFeature, featureId: featureId };
        this.connection.updateFeature(layerId, lu, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {
        var ku = <KeyUpdate>{ keyId: keyId, action: KeyUpdateAction.updateKey, item: value };
        this.connection.updateKey(keyId, ku, meta);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }





}
