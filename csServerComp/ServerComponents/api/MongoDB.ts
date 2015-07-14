import LayerManager = require('LayerManager');
import Layer = LayerManager.Layer;
import CallbackResult = LayerManager.CallbackResult;
import mongodb = require('mongodb');

export class MongoDBStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager

    public db: mongodb.Db;



    constructor(public server: string, public port: number) {

    }

    public addLayer(layer: Layer) {
        //TODO: add support for inserting an entire layer,
        // although the addFeature should also be able to cope with it

    }

    //TODO: remove this code before pushing
    public addFeature2() {
        // normally, you'd take the layerID here and toString it
        // so you can enter a collection dynamically
        var collection = this.db.collection("testFeatures");
        collection.insert({ hello: 'Isitmeyourelookingfor' }, function(err) {
            if (err)
                console.log(err);
            else
                console.log("inserted 1 document");
        });
    }

    public addFeature(layerId: string, feature: any) {
        // not completely sure if this will work, might have toString it.
        var collection = this.db.collection(layerId);
        collection.insert(feature, {}, function(e) {
            if (e)
                console.log(e);
            else
                console.log("inserted a document");
        });
    }



    //TODO: Arnoud, what to do with this?
    public getLayer(layerId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.find({}, { sort: [['_id', 1]] })
            .toArray(function(e, results) {
            if (e) {
                callback(<CallbackResult>{ error: e });
            }
            else {
                //todo create layer;
                var l = new Layer();
                l.features = results;
                callback(<CallbackResult>{ layer: l });
            }
            // this contains the result set, but needs to be tied to express someway
            //res.send(results)
        });
    }

    //TODO: test further. Result is the # of deleted docs.
    public delFeature(layerId: string, featureId: string) {
        var collection = this.db.collection(layerId);
        collection.remove({ '_id': featureId }, function(e, result) {
            if (e) return e;
            //res.send(result);
        })
    }

    //TODO: implement
    public getFeature(layer: Layer, i: string) {

    }

    //TODO: implement
    public updateFeature(layer: Layer, feature: any) {

    }

    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        // set up connection
        var server = new mongodb.Server('localhost', 27017, { auto_reconnect: true })
        //set up the db instance

        this.db = new mongodb.Db('commonSenseWeb', server, { w: 1 });
        this.db.open(function() { });
        console.log('init MongoDB Storage');

    }
}
