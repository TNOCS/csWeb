export interface IApiInterface {
    init(layerManager: LayerManager, options: any)
}

export class CallbackResult {
    public result: string;
    public error: any;
    public layer: Layer;
}

export interface IStorage {
    init(layerManager: LayerManager, options: any);
    //Layer methods
    addLayer(layer: Layer, Function);
    getLayer(layerId: string, callback: Function);
    deleteLayer(layerId: string, callback: Function);
    //feature methods
    addFeature(layerId: string, feature: any, callback: Function);
    getFeature(layerId: string, featureId: string, callback: Function);
    updateFeature(layerId: string, feature: any, callback: Function);
    deleteFeature(layerId: string, featureId: string, callback: Function);
}

export class Layer {
    public storage: string;
    public id: string;
    public features: any[] = [];
}

export class LayerManager {

    public interfaces: { [key: string]: IApiInterface } = {}
    public storages: { [key: string]: IStorage } = {}
    public layers: { [key: string]: Layer } = {}

    public defaultStorage = "file";

    public init() {
        console.log('init layer manager');
    }

    public addInterface(key: string, i: IApiInterface, options: any) {
        this.interfaces[key] = i;
        i.init(this, options);
    }

    public addStorage(key: string, s: IStorage, options: any) {
        console.log('Adding storage ' + key);
        this.storages[key] = s;
        s.init(this, options);
    }

    /**
     * Find layer for a specific layerId
     */
    public findLayer(layerId: string): Layer {
        if (this.layers.hasOwnProperty(layerId)) {
            return this.layers[layerId];
        }
        return null;
    }

    /**
     * Find storage for a layer
     */
    public findStorage(layer: Layer): IStorage {
        var storage = layer.storage || this.defaultStorage;
        if (this.storages.hasOwnProperty(storage)) return this.storages[storage];
        return null;
    }

    public findStorageForLayerId(layerId: string): IStorage {
        var layer = this.findLayer(layerId);
        if (layer) return this.findStorage(layer);
    }

    //layer methods start here, in CRUD order.

    public addLayer(layer: Layer, callback: Function) {
        var s = this.findStorage(layer);
        s.addLayer(layer, (r: CallbackResult) => {
            callback(r);
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



    // Feature methods start here, in CRUD order.

    public addFeature(layerId: string, f: any, callback: Function) {
        console.log('feature added');
        var s = this.findStorageForLayerId(layerId);
        s.addFeature(layerId, f, (result) => callback(result));
    }

    public getFeature(layerId: string, featureId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getFeature(layerId, featureId, (result) => callback(result));
    }

    public updateFeature(layerId: string, feature: any, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.updateFeature(layerId, feature, (result) => callback(result));
    }

    public deleteFeature(layerId: string, featureId: string, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteFeature(layerId, featureId, (result) => callback(result));
    }

}
