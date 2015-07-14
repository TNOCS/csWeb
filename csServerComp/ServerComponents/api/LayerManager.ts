export interface IApiInterface {
    init(layerManager: LayerManager, options: any)
}

export class CallbackResult {
    public error: any;
    public layer: Layer;
}

export interface IStorage {
    init(layerManager: LayerManager, options: any);
    addLayer(layer: Layer);
    delFeature(layerId: string, featureId: string);
    addFeature(layerId: string, feature: any);
    addFeature2();
    getFeature(layer: Layer, featureId: string);
    updateFeature(layer: Layer, feature: any);
    getLayer(layerId: string, callback: Function);
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

    public addLayer(layer: Layer) {
        var s = this.storages[layer.storage];
        s.addLayer(layer);
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

    public addFeature(layerId: string, f: any) {
        console.log('feature added');
        var s = this.storages[f.storage];
        s.addFeature('testje', f);
    }

    public addFeature2(something: string) {
        console.log("inside the Layer Manager now..");
        //  s.addFeature2();
    }

    // TODO: Arnoud, I'm not sure where you want me to go with this. If we
    // intend to store layers at a collection level we might need to draw out
    // how everything is going to look. The code to store features will not make
    // much sense as a feature is a single document in mongo and conceptually
    // belongs to a layer.
    public updateFeature(layer: Layer, feature: any) {
        var s = this.storages[layer.storage];
        s.updateFeature(layer, feature);
    }

    public getFeature(layer: Layer, featureId: string) {
        var s = this.storages[layer.storage];
        s.getFeature(layer, featureId);
    }

    public getLayer(layerId: string, callback: Function) {
        var s = this.storages[0];
        s.getLayer(layerId, (r: CallbackResult) => {
            callback(r);
        });
    }

    public delFeature(layerId: string, featureId: string) {
        var s = this.storages[0];
        s.delFeature(layerId, featureId);
    }

}
