export interface IApiInterface {
    init(layerManager: LayerManager, options: any)
}

export interface IStorage {
    init(layerManager: LayerManager, options: any)
    addLayer(layer: Layer);
    delFeature(layer: Layer, featureId: string);
    addFeature(layer: Layer, feature: any);
    getFeature(layer: Layer, featureId: string);
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
        this.storages[key] = s;
        s.init(this, options);
    }

    public addFeature(layer: Layer, f: any) {
        console.log('feature added');
        //volg ik het zo goed?
        var s = this.storages[f.storage];
        s.addFeature(layer, f);
    }

    public getFeature(layer: Layer, featureId: string) {
      var s = this.storages[layer.storage];
      s.getFeature(layer, featureId);
    }

    public delFeature(layer: Layer, featureId: string) {
      var s = this.storages[layer.storage];
      s.delFeature(layer, featureId);
    }

}
