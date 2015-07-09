export interface IApiInterface {
    init(layerManager: LayerManager, options: any)
}

export interface IStorage {
    init(layerManager: LayerManager, options: any)
    addLayer(layer: Layer);
}

export class Layer {
    public storage: string;
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

    public addFeature(f: any) {
        console.log('feature added');

    }

}
