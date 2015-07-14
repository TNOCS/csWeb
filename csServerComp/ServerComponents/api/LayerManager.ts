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
    getFeature(layer: Layer, featureId: string, callback: Function);
    updateFeature(layer: Layer, feature: any, callback: Function);
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

    //layer methods start here, in CRUD order.

    public addLayer(layer: Layer, callback: Function) {
        var s = this.storages["mongo"];
        s.addLayer(layer, (r: CallbackResult) => {
            callback(r);
        });
    }


    public getLayer(layerId: string, callback: Function) {
        var s = this.storages["mongo"];
        s.getLayer(layerId, (r: CallbackResult) => {
            callback(r);
        });
    }

    public deleteLayer(layerId: string, callback: Function) {
        var s = this.storages["mongo"];
        s.deleteLayer(layerId, (r: CallbackResult) => {
            callback(r);
        });
    }



    // Feature methods start here, in CRUD order.

    public addFeature(layerId: string, f: any, callback: Function) {
        console.log('feature added');
        var s = this.storages["mongo"];
        s.addFeature(layerId, f, (result) => callback(result));
    }

    public getFeature(layer: Layer, featureId: string, callback: Function) {
        var s = this.storages["mongo"];
        s.getFeature(layer, featureId, (result) => callback(result));
    }

    public updateFeature(layer: Layer, feature: any, callback: Function) {
        var s = this.storages["mongo"];
        s.updateFeature(layer, feature, (result) => callback(result));
    }

    public delFeature(layerId: string, featureId: string, callback: Function) {
        var s = this.storages["mongo"];
        s.deleteFeature(layerId, featureId, (result) => callback(result));
    }

}
