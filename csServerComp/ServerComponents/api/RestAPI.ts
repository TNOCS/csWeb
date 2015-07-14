import LayerManager = require('./LayerManager');
import express = require('express')
import Layer = LayerManager.Layer;
import CallbackResult = LayerManager.CallbackResult;


export class RestAPI implements LayerManager.IApiInterface {

    public manager: LayerManager.LayerManager

    constructor(public server: express.Express) {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init Rest API');


        //use this for testing. Serves no real purpose.
        this.server.get("/test", (req: express.Request, res: express.Response) => {
            console.log("received something.. hello world!");
            res.send({ Hello: "World" });
        });

        //------ layer API paths, in CRUD order

        // adds a layer, using HTTP PUT, stores it in a collection of choice
        // TODO: error checking: you might not want to overwrite another layer
        // Or post to a layer collection that should be shielded-off (e.g. system or users)
        // And what if an agent starts sending gibberish?
        this.server.post('/layers/:layer', (req: express.Request, res: express.Response) => {
            var layer = new Layer();
            console.log(req.body);
            layer = req.body;
            layer.id = req.params.layer;
            this.manager.addLayer(layer, (result: CallbackResult) => {
                //todo: check errors
                //returns success of insert operation
                res.send(result);
            });
        })

        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.get('/layers/:layerId', (req: any, res: any) => {
            this.manager.getLayer(req.params.layerId, (result: CallbackResult) => {
                //todo: check error
                res.send(result.layer);
            });
        })

        // gets the entire layer, which is stored as a single collection
        // TODO: what to do when this gets really big? Offer a promise?
        this.server.delete('/layers/:layerId', (req: any, res: any) => {
            this.manager.deleteLayer(req.params.layerId, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        })

        //------ feature API paths, in CRUD order

        //adds a feature
        this.server.post("/layers/:layerId/feature", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layerId, req.body, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        //returns a feature
        this.server.get("/layers/:layerId/:featureId", (req: express.Request, res: express.Response) => {
            this.manager.getFeature(req.params.layerId, req.params.featureId, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // updates all features corresponding to query on ID (should be one)
        this.server.put("/layers/:layerId/features/:featureId", (req: express.Request, res: express.Response) => {
            this.manager.updateFeature(req.params.layerId, req.params.featureId, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });

        // for some reason (TS?) express doesn't work with del as http verb
        // unlike the JS version, which simply uses del as a keyword.
        // deletes a feature
        this.server.delete("/layers/:layerId/features/:featureId", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layerId, req.params.featureId, (result: CallbackResult) => {
                //todo: check error
                res.send(result);
            });
        });


    }

}
