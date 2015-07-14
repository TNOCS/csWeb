import LayerManager = require('./LayerManager');
import Layer = LayerManager.Layer;
import CallbackResult = LayerManager.CallbackResult;


export class FileStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager


    constructor(public rootpath: string) {
    }

    // layer methods first, in crud order.

    public addLayer(layer: Layer, callback: Function) {

        if (true)
            callback(<CallbackResult>{ result: "Error", error: null });
        else
            callback(<CallbackResult> { result: "OK" });

    }

    //TODO: Arnoud, what to do with this?
    public getLayer(layerId: string, callback: Function) {

        if (true) {
            callback(<CallbackResult>{ result: "Error" });
        }
        else {
            callback(<CallbackResult>{ result: "OK", layer: null });
        }

    }

    public deleteLayer(layerId: string, callback: Function) {
        if (true) {
            callback(<CallbackResult>{ result: "Error" });
        }
        else {
            callback(<CallbackResult>{ result: "OK", layer: null });
        }
    }


    // feature methods, in crud order

    public addFeature(layerId: string, feature: any, callback: Function) {
        if (true) {
            callback(<CallbackResult>{ result: "Error" });
        }
        else {
            callback(<CallbackResult>{ result: "OK", layer: null });
        }
    }



    //TODO: implement
    public getFeature(layer: Layer, i: string, callback: Function) {

    }

    //TODO: implement
    public updateFeature(layer: Layer, feature: any, callback: Function) {

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
