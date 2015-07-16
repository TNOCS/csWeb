

export class CallbackResult {
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
    addLayer(layer: Layer, Function);
    getLayer(layerId: string, callback: Function);
    deleteLayer(layerId: string, callback: Function);
    //feature methods
    addFeature(layerId: string, feature: any, callback: Function);
    getFeature(layerId: string, featureId: string, callback: Function);
    updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function);
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function);
    updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, callback: Function);
    deleteFeature(layerId: string, featureId: string, callback: Function);
}

export class Layer {
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

    public connectors: { [key: string]: IConnector } = {}
    public layers: { [key: string]: Layer } = {}

    public defaultStorage = "file";
    public defaultLogging = false;

    public init() {
        console.log('init layer manager');
    }



    public addConnector(key: string, s: IConnector, options: any) {
        console.log('Adding storage ' + key);
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
        } else { return null; };
    }

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
        if (!this.layers.hasOwnProperty(layer.id)) {
            this.layers[layer.id] = <Layer>{ id: layer.id, storage: s.id };
        }

        s.addLayer(layer, (r: CallbackResult) => {
            for (var i in this.connectors) {
                this.connectors[i].initLayer(layer);
            }
            callback(r);
        });

        this.getInterfaces().forEach((i: IConnector) => {
            i.addLayer(layer, () => { });
        });
    }


    public getLayer(layerId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getLayer(layerId, (r: CallbackResult) => {
            callback(r);
        });
    }

    public deleteLayer(layerId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteLayer(layerId, (r: CallbackResult) => {
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

}
