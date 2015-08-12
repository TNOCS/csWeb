import Winston = require('winston');

/**
 * Api Result status
 */
export enum ApiResult {
    OK,
    Error
}

export interface ApiMeta {
    source?: string;
    user?: string;
}

/**
 * Default result object for api calls
 */
export class CallbackResult {
    public result: ApiResult;
    public error: any;
    public layer: Layer;
    public feature: Feature;
}

export interface IConnector {
    id: string;
    isInterface: boolean;
    init(layerManager: ApiManager, options: any);
    initLayer(layer: Layer, meta?: ApiMeta);
    //Layer methods
    addLayer(layer: Layer, meta: ApiMeta, callback: Function);
    getLayer(layerId: string, meta: ApiMeta, callback: Function);
    updateLayer(layerId: string, update: any, meta: ApiMeta, callback: Function);
    deleteLayer(layerId: string, meta: ApiMeta, callback: Function);
    //feature methods
    addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function);
    getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function);
    updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function);
    deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function);
    //log methods
    addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function);
    getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function);
    deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function);
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function);
    updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function);
    //geospatial stuff
    getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function);
    getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, meta: ApiMeta, callback: Function);
    getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function);
    getSensors(meta: ApiMeta, callback: Function);
    getSensor(sensorId: string, meta: ApiMeta);
}

export class SensorValue {
    value: any;
    timestamp: number;
}

export interface StorageObject {
    id: string;
    storage: string;
}

export class Sensor implements StorageObject {
    id: string;
    title: string;
    type: string;
    values: SensorValue[];
    storage: string;
}

/**
 * Geojson Layer definition
 */
export class Layer implements StorageObject {
    /**
     * id of storage connector
     */
    public storage: string;
    public useLog: boolean;
    public id: string;
    public type: string;
    public dynamic: boolean;
    public features: Feature[] = [];
}

/**
 * Geojson geometry definition
 */
export class Geometry {
    public type: string;
    public coordinates: number[];
}

/**
 * Geojson feature definition
 */
export class Feature {
    public id: string;
    public geometry: Geometry;
    public properties: { [key: string]: any };
    public logs: { [key: string]: Log[] };
}

/**
 * Geojson property definition
 */
export class Property {

}

export class Log {
    public ts: number;
    public prop: string;
    public value: any;
}

export class ApiManager {

    /**
     * Dictionary of connectors (e.g. storage, interface, etc.)
     */
    public connectors: { [key: string]: IConnector } = {}

    /**
     * Dictionary of layers (doesn't contain actual data)
     */
    public layers: { [key: string]: Layer } = {};

    /**
     * Dictionary of sensor sets
     */
    public sensors: { [key: string]: Sensor } = {};

    public defaultStorage = "mongo";
    public defaultLogging = false;

    public init() {
        Winston.info('init layer manager', { cat: "api" });
    }

    /**
     * Add connector to available connectors
     */
    public addConnector(key: string, s: IConnector, options: any) {
        s.id = key;
        this.connectors[key] = s;
        s.init(this, options);
    }

    /**
     * Find layer for a specific layerId (can return null)
     */
    public findLayer(layerId: string): Layer {
        if (this.layers.hasOwnProperty(layerId)) {
            return this.layers[layerId];
        }
        return null;;
    }

    /**
     * find feature in a layer by featureid
     */
    public findFeature(layerId: string, featureId: string, callback: Function) {
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        s.getFeature(layerId, featureId, {}, (r) => callback(r));
    }

    /**
     * Find storage for a layer
     */
    public findStorage(object: StorageObject): IConnector {
        var storage = (object && object.storage) || this.defaultStorage;
        if (this.connectors.hasOwnProperty(storage)) return this.connectors[storage];
        return null;
    }

    /**
     * Lookup layer and return storage engine for this layer
     */
    public findStorageForLayerId(layerId: string): IConnector {
        var layer = this.findLayer(layerId);
        return this.findStorage(layer);
    }

    //layer methods start here, in CRUD order.
    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        Winston.info('api: add layer ' + layer.id);
        var s = this.findStorage(layer);

        // check if layer already exists
        if (!this.layers.hasOwnProperty(layer.id)) {
            this.layers[layer.id] = <Layer>{ id: layer.id, storage: s.id };
        }

        // store layer
        s.addLayer(layer, meta, (r: CallbackResult) => {
            callback(r);
        });

        this.getInterfaces().forEach((i: IConnector) => {
            i.initLayer(layer);
            i.addLayer(layer, meta, () => { });
        });
    }


    public getLayer(layerId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getLayer(layerId, meta, (r: CallbackResult) => {
            callback(r);
        });
    }

    public updateLayer(layerId: string, update: any, meta: ApiMeta, callback: Function) {

        var s = this.findStorageForLayerId(layerId);
        if (s) {
            s.updateLayer(layerId, update, meta, (r, CallbackResult) => {
                Winston.warn('updating layer finished');
                callback(r);
            });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.Error, error: 'layer not found' });
        }
    }

    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteLayer(layerId, meta, (r: CallbackResult) => {
            delete this.layers[layerId];
            callback(r);
        });
    }

    public getInterfaces(): IConnector[] {
        var res = [];
        for (var i in this.connectors) {
            if (this.connectors[i].isInterface) res.push(this.connectors[i]);
        }
        return res;
    }

    // Feature methods start here, in CRUD order.

    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        Winston.info('feature added');
        var layer = this.findLayer(layerId);
        if (!layer) {
            callback(<CallbackResult>{ result: ApiResult.Error, error: 'layer not found' });
        }
        else {
            var s = this.findStorage(layer);
            s.addFeature(layerId, feature, meta, (result) => callback(result));
            this.getInterfaces().forEach((i: IConnector) => {
                i.addFeature(layerId, feature, meta, () => { });
            });
        }


    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        this.updateProperty(layerId, featureId, property, value, useLog, meta, (r) => callback(r));
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        // check if timestamps are set (if not, do it)
        for (var p in logs) {
            logs[p].forEach((l: Log) => {
                if (!l.ts) l.ts = new Date().getTime();
            });
        }
        s.updateLogs(layerId, featureId, logs, meta, (r) => callback(r));
        this.getInterfaces().forEach((i: IConnector) => {
            i.updateLogs(layerId, featureId, logs, meta, () => { });
        });
    }

    public getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getFeature(layerId, featureId, meta, (result) => callback(result));
    }

    public updateFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.updateFeature(layerId, feature, true, meta, (result) => callback(result));
        this.getInterfaces().forEach((i: IConnector) => {
            i.updateFeature(layerId, feature, false, meta, () => { });
        });
    }

    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteFeature(layerId, featureId, meta, (result) => callback(result));
        this.getInterfaces().forEach((i: IConnector) => {
            i.deleteFeature(layerId, featureId, meta, () => { });
        });
    }


    //log stuff (new: 26/7)

    public addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.addLog(layerId, featureId, property, log, meta, (result) => callback(result));
    }

    public addSensor(sensor: Sensor, meta: ApiMeta, callback: Function) {
        Winston.info(JSON.stringify(sensor));
        callback(<CallbackResult>{ result: ApiResult.OK })
    }

    public getSensors(meta: ApiMeta, callback: Function) {
        callback(<CallbackResult>{ result: ApiResult.OK });
    }
    public addSensorValue(sensorId: string, value: SensorValue, meta: ApiMeta, callback: Function) { }

    public initLayer(layer: Layer) {

    }

    public getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getLog(layerId, featureId, meta, (result) => callback(result));
    }

    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteLog(layerId, featureId, ts, prop, meta, (result) => callback(result));
    }

    //geospatial queries (thus only supported for mongo)

    public getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getBBox(layerId, southWest, northEast, meta, (result) => callback(result));
    }

    public getSphere(layerId: string, maxDistance: number, lng: number, lat: number, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getSphere(layerId, maxDistance, lng, lat, meta, (result) => callback(result));
    }
    public getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getWithinPolygon(layerId, feature, meta, (result) => callback(result));
    }


}