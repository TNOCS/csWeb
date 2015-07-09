import LayerManager = require('LayerManager');
import Layer = LayerManager.Layer;
export class MongoDBStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager

    constructor() {

    }

    public addLayer(layer: Layer) {
        console.log('Adding layer');
    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init MongoDB Storage');

    }
}
