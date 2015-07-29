

export class CallbackResult {
    /**
     * OK, Error
     */
    public result: string;
    public error: any;
    public layer: Layer;
    public feature: Feature;
}

export interface IConnector {
    id: string;
    isInterface: boolean;
    init(layerManager: LayerManager, options: any);
    initLayer(layer: Layer);
    //Layer methods
    addLayer(layer: Layer, callback: Function);
    getLayer(layerId: string, callback: Function);
    updateLayer(layerId: string, update: any, callback: Function)
    deleteLayer(layerId: string, callback: Function);
    //feature methods
    addFeature(layerId: string, feature: any, callback: Function);
    getFeature(layerId: string, featureId: string, callback: Function);
    updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function);
    deleteFeature(layerId: string, featureId: string, callback: Function);
    //log methods
    addLog(layerId: string, featureId: string, log: Log, callback: Function);
    getLog(layerId: string, featureId: string, callback: Function);
    deleteLog(layerId: string, featureId: string, ts: number, prop: string, callback: Function)
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function);
    updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, callback: Function);
    //geospatial stuff
    getBBox(layerId: string, southWest: number[], northEast: number[], callback: Function) 

}

export class Sensor {
    title: string;
    type: string;
    values: any[];
}

export class SensorSet {
    timestamps: number[] = [];
    sensors: { [key: string]: Sensor };

    constructor(public id: string) {
    }
}


export class Layer {
    /**
     * id of storage connector
     */
    public storage: string;
    public useLog: boolean;
    public id: string;
    public features: Feature[] = [];
}

export class Geometry {
    public type: string;
    public coordinates: number[];
}

export class Feature {
    public id: string;
    public geometry: Geometry;
    public properties: { [key: string]: any };
    public logs: { [key: string]: Log[] };
}

export class Log {
    public ts: number;
    public prop: string;
    public value: any;
}

export class LayerManager {

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
    public sensors: { [key: string]: SensorSet } = {};

    public defaultStorage = "mongo";
    public defaultLogging = false;

    public init() {
        console.log('init layer manager');
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
        s.getFeature(layerId, featureId, (r) => callback(r));
    }

    /**
     * Find storage for a layer
     */
    public findStorage(layer: Layer): IConnector {
        var storage = (layer && layer.storage) || this.defaultStorage;
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
    public addLayer(layer: Layer, callback: Function) {
        var s = this.findStorage(layer);

        // check if layer already exists
        if (!this.layers.hasOwnProperty(layer.id)) {
            this.layers[layer.id] = <Layer>{ id: layer.id, storage: s.id };
        }

        // store layer
        s.addLayer(layer, (r: CallbackResult) => {
            callback(r);
        });

        this.getInterfaces().forEach((i: IConnector) => {
            i.initLayer(layer);
            i.addLayer(layer, () => { });
        });
    }


    public getLayer(layerId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getLayer(layerId, (r: CallbackResult) => {
            callback(r);
        });
    }

    public updateLayer(layerId: string, update: any, callback: Function) {
      var s = this.findStorageForLayerId(layerId);
      s.updateLayer(layerId, update, (r, CallbackResult) => {
        callback(r);
      });
    }

    public deleteLayer(layerId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteLayer(layerId, (r: CallbackResult) => {
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

    public addFeature(layerId: string, feature: any, callback: Function) {
        console.log('feature added');
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        s.addFeature(layerId, feature, (result) => callback(result));
        this.getInterfaces().forEach((i: IConnector) => {
            i.addFeature(layerId, feature, () => { });
        });

    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        this.updateProperty(layerId, featureId, property, value, useLog, (r) => callback(r));
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, callback: Function) {
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        // check if timestamps are set (if not, do it)
        for (var p in logs) {
            logs[p].forEach((l: Log) => {
                if (!l.ts) l.ts = new Date().getTime();
            });
        }
        s.updateLogs(layerId, featureId, logs, (r) => callback(r));
        this.getInterfaces().forEach((i: IConnector) => {
            i.updateLogs(layerId, featureId, logs, () => { });
        });
    }

    public getFeature(layerId: string, featureId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getFeature(layerId, featureId, (result) => callback(result));
    }

    public updateFeature(layerId: string, feature: any, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.updateFeature(layerId, feature, true, (result) => callback(result));
        this.getInterfaces().forEach((i: IConnector) => {
            i.updateFeature(layerId, feature, false, () => { });
        });
    }

    public deleteFeature(layerId: string, featureId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteFeature(layerId, featureId, (result) => callback(result));
    }


    //log stuff (new: 26/7)

    public addLog(layerId: string, featureId: string, logAddition: any, callback: Function) {
      var log = <Log>logAddition;
      var s = this.findStorageForLayerId(layerId);
      s.addLog(layerId, featureId, log, (result) =>callback(result));
    }

    public getLog(layerId: string, featureId: string, callback: Function) {
      var s = this.findStorageForLayerId(layerId);
      s.getLog(layerId, featureId, (result) => callback(result));
    }

    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, callback: Function) {
      var s = this.findStorageForLayerId(layerId);
      s.deleteLog(layerId, featureId, ts, prop, (result) => callback(result));
    }

    //geospatial queries (thus only supported for mongo)

    public getBBox(layerId: string, southWest: number[], northEast: number[], callback: Function) {
      var s = this.findStorageForLayerId(layerId);
      s.getBBox(layerId, southWest, northEast, (result) => callback(result));
    }
}
