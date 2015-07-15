import LayerManager = require('./LayerManager');
import Layer = LayerManager.Layer;
import CallbackResult = LayerManager.CallbackResult;
import Log = LayerManager.Log;

export class BaseConnector implements LayerManager.IConnector {
    public manager: LayerManager.LayerManager


    public initLayer(layer: Layer) {

    }

    // layer methods first, in crud order.

    public addLayer(layer: Layer, callback: Function) {

    }

    public getLayer(layerId: string, callback: Function) {

    }

    public deleteLayer(layerId: string, callback: Function) {

    }


    // feature methods, in crud order

    public addFeature(layerId: string, feature: any, callback: Function) {

    }

    //TODO: implement
    public getFeature(layerId: string, i: string, callback: Function) {

    }

    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, callback: Function) {

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, callback: Function) {

    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, callback: Function) {

    }

    public updateLogs(layerId: string, featureId: string, logs: Log[], callback: Function) {

    }


    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: LayerManager.LayerManager, options: any) {


    }
}
