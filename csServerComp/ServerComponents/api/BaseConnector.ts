import ApiManager = require('./ApiManager');
import Project = ApiManager.Project;
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import CallbackResult = ApiManager.CallbackResult;
import Log = ApiManager.Log;

import ApiMeta = ApiManager.ApiMeta;

export class BaseConnector implements ApiManager.IConnector {
    public manager: ApiManager.ApiManager

    public id: string;
    public isInterface: boolean;
    public receiveCopy = true;

    public initLayer(layer: Layer) {

    }

    // layer methods first, in crud order.
    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {

    }

    public getLayer(layerId: string, meta: ApiMeta, callback: Function) {

    }

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {
    }

    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {

    }

    public addLayerToProject(layerId: string, meta: ApiMeta, callback: Function) {

    }
    
    public removeLayerFromProject(layerId: string, meta: ApiMeta, callback: Function) {

    }

    // feature methods, in crud order

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {

    }

    //TODO: implement
    public getFeature(layerId: string, i: string, meta: ApiMeta, callback: Function) {

    }

    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {

    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {

    }

    // public addLog(layerId: string, featureId: string, property: any, callback: Function) {
    //
    // }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {

    }


    public addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function) {

    }

    public getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {

    }

    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function) {

    }

    public getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function) {

    }

    public getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, meta: ApiMeta, callback: Function) {

    }

    public getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {

    }

    public initProject(project: Project) {

    }

    public addProject(project: Project, meta: ApiMeta, callback: Function) {

    }

    public getProject(projectId, meta: ApiMeta, callback: Function) {

    }

    public updateProject(project: Project, meta: ApiMeta, callback: Function) {

    }

    public deleteProject(projectId, meta: ApiMeta, callback: Function) {

    }

    /** Get a specific key */
    public getKey(keyId: string, meta: ApiMeta, callback: Function) { }
    /** Get a list of available keys */
    public getKeys(meta: ApiMeta, callback: Function) { }
    /** Update the value for a given keyId */
    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) { }
    /** Delete key */
    public deleteKey(keyId: string, meta: ApiMeta, callback: Function) { }


    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: ApiManager.ApiManager, options: any) {

    }
    /** listen to key updates */
    subscribeKey(keyPattern: string, meta: ApiMeta, callback: Function) { }
}
