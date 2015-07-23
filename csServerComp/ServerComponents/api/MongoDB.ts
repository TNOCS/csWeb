import LayerManager = require('./LayerManager');
import Layer = LayerManager.Layer;
import Feature = LayerManager.Feature;
import CallbackResult = LayerManager.CallbackResult;
import Log = LayerManager.Log;
import mongodb = require('mongodb');
import BaseConnector = require('./BaseConnector');

export class MongoDBStorage extends BaseConnector.BaseConnector {
    public manager: LayerManager.LayerManager

    public db: mongodb.Db;

    constructor(public server: string, public port: number) {
        super();
    }

    public initLayer(layer: Layer) {

    }

    // layer methods first, in crud order.
    public addLayer(layer: Layer, callback: Function) {
        var collection = this.db.collection(layer.id);
        collection.insert(layer.features, {}, function(e, result) {
            if (e)
                callback(<CallbackResult>{ result: "Error", error: e });
            else
                callback(<CallbackResult> { result: "OK" });
        });
    }

    //inserts a large layer (1000+ features) with bulk insert
    public addLayerBulk(layer: Layer, callback: Function) {
      //TODO
    }

    //TODO: fix
    public getLayer(layerId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.find({}, (e: Error, result: any) => {
            if (e) {
                callback(<CallbackResult>{ result: "Error" });
            }
            else {
                //var l = new Layer();
                //l.features = "";
                //l.id = layerId;
                console.log("get succesful");
                //todo create layer;
                //var l = result;
                callback(<CallbackResult>{ result:  result });
            }
        });
    }

    // drops a collection (-completely removes, no recovery)
    public deleteLayer(layerId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.drop((err, removed) => {
            if (!err) {
                callback(<CallbackResult>{ result: "OK" });
            }
            else {
                callback(<CallbackResult>{ result: "Error" });
            }
        });
    }

    public updateLayer(layerId: string, update: any, callback: Function) {
      //TODO: implement
    }

    // feature methods, in crud order

    // adds a single feature to an existing collection
    public addFeature(layerId: string, feature: any, callback: Function) {
        var collection = this.db.collection(layerId);
        feature.id = new mongodb.ObjectID(feature.id);
        collection.insert(feature, {}, function(e, response) {
            if (e) {
              callback(<CallbackResult>{ result: "Error" });
            } else {
              callback(<CallbackResult>{ result: "OK  " });
            }
        });
    }

    //TODO: implement
    public getFeature(layerId: string, featureId: string, callback: Function) {
      var collection = this.db.collection(layerId);
      collection.findOne({_id: new mongodb.ObjectID(featureId)}, function(e, response) {
          if (e) {
            callback(<CallbackResult>{ result: "Error"});
          } else {
            var f = <Feature> response;
            callback(<CallbackResult>{ result: "OK", feature: f});
          }
      });
    }

    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function) {

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        console.log("Deleting feature with ID "+ new mongodb.ObjectID(featureId));
        collection.remove({_id: new mongodb.ObjectID(featureId)}, function(e, response) {
          if (e) {
            callback(<CallbackResult>{ result: "Error"});
          } else {
            callback(<CallbackResult>{ result: "OK"});
          }
      });
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {
      //Might have to look at how different this will be from existing updateLayer/Feature functionality
      //TODO: implement
    }

    // fetches all points in a given [].
    // So in Mongo, this needs to take four coordinate pair params. Do we solve this algoritmically or just ask for four params?
    // Todo: implement
    public getBoundingBox(layerId: string, southWestLat: number, southWestLng: number, northEastLat: number, northEastLng: number, callback: Function) {
      //
    }

    // Similar to BBox, but instead fetches all points in a circle. Starts with nearest point and returns documents outwards.
    public getSphere(layerId: string, maxDistance: number, latitude: number, lontitude: number, callback: Function) {
      //todo
    }

    // So I figured that the ability to get something within a polygon would be
    // an interesting functionality. E.g. getting something within a region specified by
    // a GeoJSON polygon. Think about selecting all features within Amsterdam's
    // borders based on another GeoJSON containing the polygon of that area.
    public getWithinPolygon(layerId: string, feature: any, callback: Function) {

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
