import LayerManager = require('LayerManager');
import Layer = LayerManager.Layer;
import mongodb = require('mongodb');
export class MongoDBStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager



    constructor(public db : string) {

    }

    public addLayer(layer: Layer) {
        console.log('Adding layer');
        //todo

    }

    public addFeature(f: any) {
      //db.collection('features').insert(f, function(err, result) {
        //todo
    }

    public deleteFeature(f: string) {
      //todo
    }

    public getFeature(i: string) {

    }

    public upsertFeature() {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        // set up connection here?

        //var db = mongodb.db(this.db, {safe:true});
        console.log('init MongoDB Storage');

    }
}
