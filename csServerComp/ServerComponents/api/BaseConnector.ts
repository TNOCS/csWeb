import ApiManager = require('./ApiManager');
import Project = ApiManager.Project;
import Group = ApiManager.Group;
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import CallbackResult = ApiManager.CallbackResult;
import Log = ApiManager.Log;
import ApiMeta = ApiManager.ApiMeta;
import ApiResult = ApiManager.ApiResult;

export class BaseConnector implements ApiManager.IConnector {
    public manager: ApiManager.ApiManager;

    public id: string;
    public isInterface: boolean;
    public receiveCopy = true;

    public initLayer(layer: Layer) {}

    // layer methods first, in crud order.
    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {}

    public getLayer(layerId: string, meta: ApiMeta, callback: Function) {}

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {}

    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {}

    public searchLayer(layerId: string, keyWord: string, meta: ApiMeta, callback: Function) {
        callback(<CallbackResult>{ result: ApiResult.SearchNotImplemented });
    }

    public addLayerToProject(layerId: string, meta: ApiMeta, callback: Function) {}

    public removeLayerFromProject(layerId: string, meta: ApiMeta, callback: Function) {}

    public allGroups(projectId: string, meta: ApiMeta, callback: Function) {}

    public addGroup(group: Group, projectId: string, meta: ApiMeta, callback: Function) {}

    public removeGroup(groupId: string, projectId: string, meta: ApiMeta, callback: Function) {}

    // feature methods, in crud order

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {}

    //TODO: implement
    public getFeature(layerId: string, i: string, meta: ApiMeta, callback: Function) {}

    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {}

    //TODO: implement
    public addUpdateFeatureBatch(layerId: string, feature: ApiManager.IChangeEvent[], useLog: boolean, meta: ApiMeta, callback: Function) {}

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {}

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {}

    // public addLog(layerId: string, featureId: string, property: any, callback: Function) {
    //
    // }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {}

    public addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function) {}

    public getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {}

    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function) {}

    public getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function) {}

    public getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, meta: ApiMeta, callback: Function) {}

    public getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {}

    public initProject(project: Project) {}

    public addProject(project: Project, meta: ApiMeta, callback: Function) {}

    public getProject(projectId, meta: ApiMeta, callback: Function) {}

    public updateProject(project: Project, meta: ApiMeta, callback: Function) {}

    public deleteProject(projectId, meta: ApiMeta, callback: Function) {}

    public cloneProject(projectId, clonedProjectId: string, meta: ApiMeta, callback: Function) {}

    public addFile(base64: string, folder: string, file: string, meta: ApiMeta, callback: Function) {}

    public getFile(file: string, meta: ApiMeta, callback: Function) {}

    public addResource(resource: ApiManager.ResourceFile, meta: ApiMeta, callback: Function) {}

    public addPropertyTypes(resourceId: string, data: IPropertyType[], meta: ApiMeta, callback: Function) {}


    /** Get a resource file  */
    public getResource(resourceId : string, meta : ApiMeta, callback : Function) {}

    /** Get a specific key */
    public getKey(keyId: string, meta: ApiMeta, callback: Function) {}
    /** Get a list of available keys */
    public getKeys(meta: ApiMeta, callback: Function) {}
    /** Update the value for a given keyId */
    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {}
    /** Delete key */
    public deleteKey(keyId: string, meta: ApiMeta, callback: Function) {}


    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: ApiManager.ApiManager, options: any, callback : Function) {}

    public exit(callback : Function) {
        callback();
    }

    /**
     * Subscribe to certain keys.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    subscribeKey(keyPattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void) { }
}
