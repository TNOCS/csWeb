import ApiManager = require('./ApiManager');
import Layer = ApiManager.Layer;
import Feature = ApiManager.Feature;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import Log = ApiManager.Log;
import ApiMeta = ApiManager.ApiMeta;
import mongodb = require('mongodb');
import BaseConnector = require('./BaseConnector');
import Winston = require('winston');


/**
 * Contains the MongoDB operations.
 */
export class MongoDBStorage extends BaseConnector.BaseConnector {
    public manager: ApiManager.ApiManager

    public db: mongodb.Db;

    constructor(public server: string, public port: number) {
        super();
    }

    public initLayer(layer: Layer) {

    }

    /**
     * Adds a layer, creating a collection in the process and creating two
     * indexes: a 2dsphere index to support geospatial queries and a sparse
     * index to assist with browsing the log.
     * @param  {Layer}    layer    [The layer to be inserted]
     * @param  {Function} callback [Callback]
     * @return {result}            [Success of operation]
     */
    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layer.id);
        collection.insert(layer.features, {}, function(e, result) {
            if (e)
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            else
                callback(<CallbackResult> { result: ApiResult.OK });
        });

        //ensures index will only create an index if none on the field are present, to avoid errors.
        collection.ensureIndex({ 'coordinates.geometry': "2dsphere" }, function(e, indexname) {
            if (!e) {
                Winston.info("created a 2Dsphere geospatial index in layer " + layer.id + " upon insertion.");
            } else {
                Winston.info("Error during geospatial index creation. Error: " + e);
            }
        });

        // creating a sparse (= wont index if field is not present) index on logs.
        collection.ensureIndex({ 'logs.prop': 1 }, { sparse: true }, function(e, indexname) {
            if (!e) {
                Winston.info("created a sparse index in layer " + layer.id + " upon insertion.");
            } else {
                Winston.info("Error during sparse index creation. Error: " + e);
            }
        });
    }

    /**
     * Adds a large layer TODO
     * @param  {Layer}    layer    [description]
     * @param  {Function} callback [description]
     * @return {result}            [description]
     */
    public addLayerBulk(layer: Layer, callback: Function) {
        //TODO
    }

    /**
     * Returns a collection (layer) to the caller
     * @param  {string}   layerId  [The layer that needs to be called]
     * @param  {Function} callback [Callback]
     * @return {result}            [Success: Layer, Failure: error]
     */
    public getLayer(layerId: string, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.find({}, { sort: [['_id', 1]] }).toArray(function(e, response) {
            if (e) {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            }
            else {
                var results = new Layer();
                results.features = response;
                callback(<CallbackResult>{ result: ApiResult.OK, layer: results });
            }
        });
    }

    /**
     * Completely removes (drops) a layer, all features, logs and corresponding
     * indexes that were created upon insertion.
     * @param  {string}   layerId  [The name of the layer (collection)]
     * @param  {Function} callback [callback]
     * @return {result}            [Success of the operation]
     */
    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.drop((err, removed) => {
            if (!err) {
                callback(<CallbackResult>{ result: ApiResult.OK });
            }
            else {
                callback(<CallbackResult>{ result: ApiResult.Error, error: err });
            }
        });
    }

    /** This updates ALL documents in a given collection with given field.
     *  If the field is not initially present, it will be created.
     *  If the field is already present, it will be OVERWRITTEN.
     *  e.g if the update is for { properties: "I want pistachios for breakfast" }
     *  properties will just contain that silly line of text instead of our data.
     *  Ergo, be careful with this.
     * @param  {string}   layerId  [The layer to-be updated]
     * @param  {any}      update   [The fields that need to be updated (JSON)]
     * @param  {Function} callback [callback]
     * @return {result}            [success of the operation]
     */
    public updateLayer(layerId: string, update: any, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.update({}, { $set: update }, { safe: true, multi: true }, (e, response) => {
            if (!e) {
                callback(<CallbackResult>{ result: ApiResult.OK });
            }
            else {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            }
        });
    }

    /**
     * Adds a single feature - A single GeoJSON document - to the database.
     * @param  {string}   layerId  [The layer to insert to]
     * @param  {any}      feature  [The feature to insert (JSON)]
     * @param  {Function} callback [Callback]
     * @return {result}            [Success of the operation]
     */
    public addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        feature.id = new mongodb.ObjectID(feature.id);
        collection.insert(feature, {}, function(e, response) {
            if (e) {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            } else {
                callback(<CallbackResult>{ result: ApiResult.OK });
            }
        });
    }

    /**
     * Retrieves a feature from MongoDB. Features are stored as single JOSN
     * documents with logs attached.
     * @param  {string}   layerId   [The layer to query]
     * @param  {string}   featureId [The ID of the feature we're looking for]
     * @param  {Function} callback  [callback]
     * @return {result}             [Success of the operation]
     */
    public getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.findOne({ _id: new mongodb.ObjectID(featureId) }, function(e, response) {
            if (e) {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            } else {
                var f = <Feature> response;
                callback(<CallbackResult>{ result: ApiResult.OK, feature: f });
            }
        });
    }

    /**
     * Updates a feature according to the document (feature) submitted. The
     * feature contains the fields that need to be updated and their new, and
     * only their new, values. In order to properly update an embedded field the
     * entire feature including fields that won't chaneg should be sent,
     * as updating a document's 'properties.' field to something else can
     * overwrite subfields there if we're not careful.
     * @param  {string}   layerId  [The layer in which to look for]
     * @param  {any}      feature  [The new values of the feature]
     * @param  {boolean}  useLog   [Not used at current]
     * @param  {Function} callback [Callback]
     * @return {result}            [Success of the operation]
     */
    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        var featureId = new mongodb.ObjectID(feature._id);
        delete feature._id;
        collection.update({ _id: featureId }, { $set: feature }, { safe: true, multi: false }, (e, response) => {
            if (!e) {
                callback(<CallbackResult>{ result: ApiResult.OK });
            }
            else {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            }
        });
    }

    /**
     * Completely deletes a feature.
     * @param  {string}   layerId   [The layer in which to look for]
     * @param  {string}   featureId [The feature which to delete]
     * @param  {Function} callback  [Callback]
     * @return {result}             [The success of the operation]
     */
    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        Winston.info("Deleting feature with ID " + new mongodb.ObjectID(featureId));
        collection.remove({ _id: new mongodb.ObjectID(featureId) }, function(e, response) {
            if (e) {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            } else {
                callback(<CallbackResult>{ result: ApiResult.OK });
            }
        });
    }

    /**
     * Adds logs according to Arnoud's specification
     * @param  {string}   layerId   [description]
     * @param  {string}   featureId [description]
     * @param  {Log}      log       [description]
     * @param  {Function} callback  [description]
     * @return {[type]}             [description]
     */
    public addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        var update = { "$push": {} };
        update["$push"]["logs." + log.prop] = log;
        log.ts = Date.now();

        // If the field is absent in the document to update, $push adds the array field with the value as its element.
        // http://docs.mongodb.org/manual/reference/operator/update/push/
        collection.update(
            { _id: featureId },
            update, { multi: false }, (e, response) => {
                if (!e) {
                    callback(<CallbackResult>{ result: ApiResult.OK });
                }
                else {
                    callback(<CallbackResult>{ result: ApiResult.Error, error: e });
                }
            });
    }

    /**
     * Adds a log to a document. Log is a JSON document containing the ts (added
     * here), the property name, and the (new) value.
     * TODO: Add it in the way Arnoud specified
     * @param  {string}   layerId   [The Layer in which to look for the feature]
     * @param  {string}   featureId [The _id of the feature]
     * @param  {Log}      log       [The log file]
     * @param  {Function} callback  [Callback]
     * @return {result}             [Success of the operation]
     */
    public addLog2(layerId: string, featureId: string, log: Log, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        log.ts = Date.now();
        // If the field is absent in the document to update, $push adds the array field with the value as its element.
        // http://docs.mongodb.org/manual/reference/operator/update/push/
        collection.update(
            { _id: featureId },
            {
                $push:
                {
                    logs:
                    {
                        "ts": log.ts,
                        "prop": log.prop,
                        "value": log.value
                    }
                }
            }, { multi: false }, (e, response) => {
                if (!e) {
                    callback(<CallbackResult>{ result: ApiResult.OK });
                }
                else {
                    callback(<CallbackResult>{ result: ApiResult.Error, error: e });
                }
            });
    }

    /**
     * Gets all the log files corresponding to a single GeoJSON document.
     * @param  {string}   layerId   [The layer wich to query]
     * @param  {string}   featureId [The feature ID which to query for]
     * @param  {Function} callback  [Callback]
     * @return {result}             [Result of the operation, a single feature]
     */
    public getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.findOne({ _id: featureId }, { logs: 1 }, function(e, response) {
            if (e) {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            } else {
                var f = <Feature> response;
                callback(<CallbackResult>{ result: ApiResult.OK, feature: f });
            }
        });
    }

    /**
     * Deletes a single log entry from a parent feature (single GeoJSON
     * document). Uses the timestamp + property name as a way of identifying the
     * log. Ater this action only the specified log will be missing: others,
     * including other log files attached to the GeoJSON document, will still
     * be intact.
     * @param  {string}   layerId   [The layer which to query]
     * @param  {string}   featureId [The feature which to query]
     * @param  {number}   ts        [The timestamp of the action]
     * @param  {string}   prop      [The propert name]
     * @param  {Function} callback  [Callback]
     * @return {result}             [Result of the operation]
     */
    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.update(
            { _id: featureId },
            {
                $pull:
                {
                    logs:
                    {
                        "ts": ts,
                        "prop": prop,
                    }
                }
            }, { multi: false }, (e, response) => {
                if (!e) {
                    callback(<CallbackResult>{ result: ApiResult.OK });
                }
                else {
                    callback(<CallbackResult>{ result: ApiResult.Error, error: e });
                }
            });
    }

    /**
     * Arnoud: you had created a stub for this, but I'm pretty sure this is
     * already covered by the update feature. You'd just have to submit the
     * entire feature.
     * @param  {string}   layerId   [The layer which to query]
     * @param  {string}   featureId [The feature which to change]
     * @param  {string}   property  [The field name which to update]
     * @param  {any}      value     [The value of which to set the property to]
     * @param  {boolean}  useLog    [Whether operation should use a log]
     * @param  {Function} callback  [Callback]
     * @return {result}             [result of operation]
     */
    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {

    }

    /**
     * Fetches all points in a given rectangle (box), defined by the bottom left
     * and top right coordinates.
     * @param  {string}   layerId   [The layer which to query]
     * @param  {number[]} southWest [The bottom left point]
     * @param  {number[]} northEast [The top right point]
     * @param  {Function} callback  [Callback]
     * @return {result}             [Success of operation, layer]
     */
    public getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        collection.find(
            {
                'geometry.coordinates': {
                    $geoWithin: {
                        $box: [
                            southWest, northEast
                        ]
                    }
                }
            }).toArray(function(e, response) {
            if (e) {
                callback(<CallbackResult>{ result: ApiResult.Error, error: e });
            }
            else {
                var results = new Layer();
                results.features = response;
                callback(<CallbackResult>{ result: ApiResult.OK, layer: results });
            }
        });
    }

    /**
     * Similar to BBox, but instead fetches all points in a circle.
     * Starts with nearest point and returns documents outwards, so the first
     * documents retuned will also be the closest ones to the center.
     * @param  {string}   layerId     [The layer in which to look for]
     * @param  {number}   maxDistance [The max distance]
     * @param  {number}   longtitude  [Longtitude of the center]
     * @param  {number}   latitude    [Latitude of the center]
     * @param  {Function} callback    [Callback]
     * @return {result}               [Success of operation, Layer]
     */
    public getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        //for now limiting this to 1000 results. Could be parameterized in the future
        collection.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [longtitude, latitude] },
                    "maxDistance": maxDistance,
                    "distanceField": "distance",
                    "distanceMultiplier": 1,
                    "num": 1000,
                    "spherical": true
                }
            }
        ], function(e, response) {

                if (e) {
                    callback(<CallbackResult>{ result: ApiResult.Error, error: e });
                } else {
                    var l = new Layer();
                    l.type = "FeatureCollection"
                    l = <Layer> response;
                    callback(<CallbackResult>{ result: ApiResult.OK, layer: l });
                }
            });
    }

    /**
     * I figured that the ability to get something within a polygon would be
     * an interesting functionality. E.g. getting something within a region
     * specified by a GeoJSON polygon. Think about selecting all features
     * within Amsterdam's borders based on another GeoJSON containing the
     * polygon of that area.
     * This takes a GeoJSON document with a geometry.coordinates field as input.
     * @param  {string}   layerId  [The layer to query]
     * @param  {Feature}  feature  [the polygon containing the coordinates]
     * @param  {Function} callback [Callback]
     * @return {result}            [Success of operation, layer]
     */
    public getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {
        var collection = this.db.collection(layerId);
        Winston.info(JSON.stringify(feature));
        collection.aggregate([
            {
                $match: {
                    'geometry.coordinates': {
                        $geoWithin: {
                            $geometry: {
                                type: "Polygon",
                                coordinates: feature.geometry.coordinates
                            }
                        }
                    }
                }
            }], function(e, response) {
                if (e) {
                    callback(<CallbackResult>{ result: ApiResult.Error, error: e });
                } else {
                    var l = new Layer();
                    l.type = "FeatureCollection"
                    l = <Layer> response;
                    callback(<CallbackResult>{ result: ApiResult.OK, layer: l });
                }
            });
    }

    /**
     *
     * @param  {LayerManager.LayerManager} layerManager [layerManager]
     * @param  {any}                       options      [Any options]
     * @return {result}
     */
    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        // set up connection
        var server = new mongodb.Server(this.server, this.port, { auto_reconnect: true });
        //set up the db instance
        this.db = new mongodb.Db('commonSenseWeb', server, { w: 1 });
        this.db.open(() => {
            Winston.info('connection succes');
        });
        Winston.info('init MongoDB Storage');
    }
}
