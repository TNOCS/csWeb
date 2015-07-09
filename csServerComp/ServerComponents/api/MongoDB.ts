import LayerManager = require('LayerManager');
export class MongoDBStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager

    constructor() {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init MongoDB Storage');



    }
}
