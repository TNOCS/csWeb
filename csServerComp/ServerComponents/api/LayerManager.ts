export interface IApiInterface {
    init(layerManager: LayerManager, options: any)
}

export interface IStorage {
    init(layerManager: LayerManager, options: any)



}

export class LayerManager {

    public interfaces: { [key: string]: IApiInterface } = {}
    public storages: { [key: string]: IStorage } = {}

    public init() {
        console.log('init layer manager');
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
