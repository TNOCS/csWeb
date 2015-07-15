import LayerManager = require('./LayerManager');
import Layer = LayerManager.Layer;
import Feature = LayerManager.Feature;
import Log = LayerManager.Log;
import CallbackResult = LayerManager.CallbackResult;
import BaseConnector = require('./BaseConnector');


export class FileStorage extends BaseConnector.BaseConnector {
    public manager: LayerManager.LayerManager

    public layers: { [key: string]: Layer } = {}

    constructor(public rootpath: string) {
        super();
        // load layers
    }

    /**
     * Find layer for a specific layerId (can return null)
     */
    public findLayer(layerId: string): Layer {
        if (this.layers.hasOwnProperty(layerId)) {
            return this.layers[layerId];
        } else { return null; };
    }

    // layer methods first, in crud order.

    public addLayer(layer: Layer, callback: Function) {
        console.log('Add file layer');
        try {
            this.layers[layer.id] = layer;
            callback(<CallbackResult> { result: "OK" });
        }
        catch (e) {
            callback(<CallbackResult>{ result: "Error", error: null });
        }
    }

    //TODO: Arnoud, what to do with this?
    public getLayer(layerId: string, callback: Function) {
        if (this.layers.hasOwnProperty(layerId)) {
            callback(<CallbackResult>{ result: "OK", layer: this.layers[layerId] });
        }
        else {
            callback(<CallbackResult>{ result: "Error" });
        }
    }

    public deleteLayer(layerId: string, callback: Function) {
        if (this.layers.hasOwnProperty(layerId)) {
            delete this.layers[layerId];
            callback(<CallbackResult>{ result: "OK", layer: null });
        }
        else {
            callback(<CallbackResult>{ result: "Error" });
        }

    }

    // feature methods, in crud order
    public addFeature(layerId: string, feature: Feature, callback: Function) {
        var layer = this.findLayer(layerId);
        if (layer) {
            layer.features.push(feature);
            callback(<CallbackResult>{ result: "OK", layer: null });
        }
        else {
            callback(<CallbackResult>{ result: "Error" });
        }
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {

    }

    public updateLogs(layerId: string, featureId: string, logs: Log[], callback: Function) {

    }



    //TODO: implement
    public getFeature(layerId: string, i: string, callback: Function) {

    }

    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function) {
        var layer = this.findLayer(layerId);
        var f = layer.features.filter((k) => { return k.id && k.id === feature.id });
        if (f && f.length > 0) {
            var index = layer.features.indexOf(f[0]);
            layer.features[index] = feature;
        }
        else {
            layer.features.push(feature);
        }
        callback(<CallbackResult>{ result: "OK", layer: null });
        console.log("file: update feature")

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, callback: Function) {
        /*var collection = this.db.collection(layerId);
        collection.remove({ '_id': featureId }, function(e, result) {
            if (e) return e;
            //res.send(result);
        })*/
    }

    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        // set up connection

        console.log('init File Storage');

    }
}
