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
        //ensure index will only create an index if none on the field are present, to avoid errors.
        collection.ensureIndex({'coordinates.geometry' : "2dsphere"}, function(e, indexname) {
          if (!e) {
            console.log("created a 2Dsphere geospatial index in layer "+layer.id+" upon insertion.");
          } else {
            console.log("Error during geospatial index creation. Error: "+e);
          }
        });

        // creating a sparse (= wont index if field is not present) index on logs.
        collection.ensureIndex({'logs.prop' : 1}, {sparse: true}, function(e, indexname) {
          if (!e) {
            console.log("created a sparse index in layer "+layer.id+" upon insertion.");
          } else {
            console.log("Error during sparse index creation. Error: "+e);
          }
        });
    }

    //inserts a large layer (1000+ features) with bulk insert
    public addLayerBulk(layer: Layer, callback: Function) {
      //TODO
    }

    // I know this code is far from consistent with the rest, but it works
    // The result from the find operation is a cursor, so this needs to be .toArray'ed
    // in order to form a proper layer for our callbackresult.
    public getLayer(layerId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.find({}, {sort: [['_id', 1]]}).toArray(function(e, response){
            if (e) {
              callback(<CallbackResult>{ result: "Error", error: e });
            }
            else {
              var results = new Layer();
              results.features = response;
              callback(<CallbackResult>{ result: "OK", layer: results});
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
                callback(<CallbackResult>{ result: "Error", error: err });
            }
        });
    }

    // This updates ALL documents in a given collection with given field.
    // If the field is not initially present, it will be created.
    // If the field is already present, it will be OVERWRITTEN.
    // e.g if the update is for { properties: "I want pistachios for breakfast" }
    // properties will just contain that silly line of text instead of our data.
    // Ergo, be careful with this.
    // TODO: Arnoud: should this take a query parameter? How would it be different
    // from updateFeature?
    public updateLayer(layerId: string, update: any, callback: Function) {
      var collection = this.db.collection(layerId);
      collection.update({}, {$set: update}, {safe: true, multi: true}, (e, response) => {
          if (!e) {
              callback(<CallbackResult>{ result: "OK" });
          }
          else {
              callback(<CallbackResult>{ result: "Error", error: e });
          }
      });
    }

    // feature methods, in crud order


    public addFeature(layerId: string, feature: any, callback: Function) {
        var collection = this.db.collection(layerId);
        feature.id = new mongodb.ObjectID(feature.id);
        collection.insert(feature, {}, function(e, response) {
            if (e) {
              callback(<CallbackResult>{ result: "Error", error: e });
            } else {
              callback(<CallbackResult>{ result: "OK  " });
            }
        });
    }

    public getFeature(layerId: string, featureId: string, callback: Function) {
      var collection = this.db.collection(layerId);
      collection.findOne({_id: new mongodb.ObjectID(featureId)}, function(e, response) {
          if (e) {
            callback(<CallbackResult>{ result: "Error", error: e});
          } else {
            var f = <Feature> response;
            callback(<CallbackResult>{ result: "OK", feature: f});
          }
      });
    }



    public updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function) {
      var collection = this.db.collection(layerId);
      var featureId = new mongodb.ObjectID(feature._id);
      delete feature._id;
      collection.update({_id: featureId}, {$set: feature}, {safe: true, multi: false}, (e, response) => {
          if (!e) {
              callback(<CallbackResult>{ result: "OK" });
          }
          else {
              callback(<CallbackResult>{ result: "Error", error: e });
          }
      });
    }

    public deleteFeature(layerId: string, featureId: string, callback: Function) {
        var collection = this.db.collection(layerId);
        console.log("Deleting feature with ID "+ new mongodb.ObjectID(featureId));
        collection.remove({_id: new mongodb.ObjectID(featureId)}, function(e, response) {
          if (e) {
            callback(<CallbackResult>{ result: "Error", error: e});
          } else {
            callback(<CallbackResult>{ result: "OK"});
          }
      });
    }

    // Log methods:
    // While these could be resolved via the updateFeature method, it serves the
    // simplicity of the API greatly if they receive their own set of CRUDs (27/7)

    public addLog(layerId: string, featureId: string, log: Log, callback: Function) {
      var collection = this.db.collection(layerId);
      log.ts = Date.now();
      // If the field is absent in the document to update, $push adds the array field with the value as its element.
      // http://docs.mongodb.org/manual/reference/operator/update/push/
      collection.update(
        {_id: featureId},
        { $push:
          { logs:
            {
              "ts": log.ts,
              "prop": log.prop,
              "value": log.value
            }
          }
        }, {multi: false}, (e, response) => {
          if (!e) {
              callback(<CallbackResult>{ result: "OK"});
          }
          else {
              callback(<CallbackResult>{ result: "Error", error: e });
          }
      });
    }

    // Gets only the log entries corresponding to a feature.
    public getLog(layerId: string, featureId: string, callback: Function) {
      var collection = this.db.collection(layerId);
      collection.findOne({_id: featureId}, {logs: 1}, function(e, response) {
          if (e) {
            callback(<CallbackResult>{ result: "Error", error: e});
          } else {
            var f = <Feature> response;
            callback(<CallbackResult>{ result: "OK", feature: f});
          }
      });
    }

    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, callback: Function) {
      var collection = this.db.collection(layerId);
      collection.update(
        {_id: featureId},
        { $pull:
          { logs:
            {
              "ts": ts,
              "prop": prop,
            }
          }
        }, {multi: false}, (e, response) => {
          if (!e) {
              callback(<CallbackResult>{ result: "OK"});
          }
          else {
              callback(<CallbackResult>{ result: "Error", error: e });
          }
      });
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {
      //Might have to look at how different this will be from existing updateLayer/Feature functionality
      // Edit: 26/7 Arnoud: this can be done via updateFeature, just make sure to send the entire feature along
    }

    // fetches all points in a given [].
    public getBBox(layerId: string, southWest: number[], northEast: number[], callback: Function) {
      var collection = this.db.collection(layerId);
      collection.find(
        {
        'geometry.coordinates': {
          $geoWithin: {
            $box:  [
              southWest, northEast
            ]
          }
        }
      }).toArray(function(e, response){
          if (e) {
            callback(<CallbackResult>{ result: "Error", error: e });
          }
          else {
            var results = new Layer();
            results.features = response;
            callback(<CallbackResult>{ result: "OK", layer: results});
          }
      });
  }

    // Similar to BBox, but instead fetches all points in a circle. Starts with nearest point and returns documents outwards.
    public getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, callback: Function) {
      var collection = this.db.collection(layerId);

      collection.aggregate([
        {
          $geoNear: {
            near: { type: "Point" , coordinates: [longtitude, latitude] } ,
             "maxDistance": maxDistance,
             "distanceField": "distance",
             "distanceMultiplier": 1,
             "num": 1000,
             "spherical": true
          }
        }
      ], function(e, response) {

             if (e) {
               callback(<CallbackResult>{ result: "Error", error: e});
             } else {
               var l = new Layer();
               l.type = "FeatureCollection"
               l = <Layer> response;
               callback(<CallbackResult>{ result: "OK", layer: l});
             }
         });
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
