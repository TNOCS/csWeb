import LayerManager = require('LayerManager');
import Layer = LayerManager.Layer;
import mongodb = require('mongodb');



export class MongoDBStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager

    public db : mongodb.MongoClient;



    constructor(public server: string, public port : int) {

    }

    public addLayer(layer: Layer) {
        console.log('Adding layer');
        //todo

    }

    public addFeature(layerId: string, f: any) {
        var collection = db.collection(layerId);
        db.collection.insert({
            "testje": true
        }, function(e, results) {
                if (e) return next(e)
                res.send(results)
            });
          }

    public delFeature(layerID: string, f: string) {
        //todo
    }

    public getFeature(layerID: string, i: string) {

    }

    public upsertFeature() {
        //todo
    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        // set up connection here?

         this.db = new mongodb.Server(this.server, this.port, { auto_reconnect: true })
        
        var db = (this.db, { safe: true });
        console.log('init MongoDB Storage');

    }
}
