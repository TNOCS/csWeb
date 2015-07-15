import LayerManager = require('./LayerManager');
import Layer = LayerManager.Layer;
import CallbackResult = LayerManager.CallbackResult;
import Log = LayerManager.Log;
import mongodb = require('mongodb');

export class MongoDBStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager

    public db: mongodb.Db;

    constructor(public server: string, public port: number) {

    }

    // layer methods first, in crud order.

    public addLayer(layer: Layer, callback: Function) {
        var collection = this.db.collection(layer.id);
        collection.insert(layer, {}, function(e, result) {
            if (e)
                callback(<CallbackResult>{ result: "Error", error: e });
            else
                callback(<CallbackResult> { result: "OK" });
        });
    }

    //TODO: Arnoud, what to do with this?
    public getLayer(layerId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.findOne({}, (e: Error, result: any) => {
            if (e) {
                callback(<CallbackResult>{ result: "Error" });
            }
            else {
                //todo create layer;
                var l = <Layer>result;
                callback(<CallbackResult>{ result: "OK", layer: l });
            }
        });
    }

    public deleteLayer(layerId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.remove((err, removed) => {
            if (!err) {
                callback(<CallbackResult>{ result: "OK" });
            }
            else {
                callback(<CallbackResult>{ result: "Error" });
            }
        });
    }


    // feature methods, in crud order

    public addFeature(layerId: string, feature: any, callback: Function) {
        // not completely sure if this will work, might have toString it.
        var collection = this.db.collection(layerId);
        collection.insert(feature, {}, function(e) {
            if (e)
                console.log(e);
            else
                console.log("inserted a document");
        });
    }

    //TODO: implement
    public getFeature(layerId: string, i: string, callback: Function) {

    }

    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function) {

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string) {
        var collection = this.db.collection(layerId);
        collection.remove({ '_id': featureId }, function(e, result) {
            if (e) return e;
            //res.send(result);
        })
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {

    }

    public updateLogs(layerId: string, featureId: string, logs: Log[], callback: Function) {

    }


    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        // set up connection
        var server = new mongodb.Server(this.server, this.port, { auto_reconnect: true });
        //set up the db instance

        this.db = new mongodb.Db('commonSenseWeb', server, { w: 1 });
        this.db.open(() => {
            console.log('connection succes');
        });
        console.log('init MongoDB Storage');

    }
}
