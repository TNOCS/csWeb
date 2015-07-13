import LayerManager = require('LayerManager');
import express = require('express')


export class RestAPI implements LayerManager.IApiInterface {

    public manager: LayerManager.LayerManager

    constructor(public server: express.Express) {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init Rest API');


        //use this for testing. Serves no real purpose. 
        this.server.get("/test",(req: express.Request, res: express.Response) => {
            console.log("received something.. hello world!");
            res.send({Hello: "World"});
        });

        // gets the entire layer, which is stored as a single collection
        this.server.get('/:layer/', (req: any, res: any) => {
            this.manager.getAllFeatures(req.params.layer);
        })

        //adds a feature
        this.server.post("/:layer/feature", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layer, req.body);
        });

        //returns a feature
        this.server.get("/:layer/:id", (req: express.Request, res: express.Response) => {
            this.manager.getFeature(req.params.layer, req.params.id);
        });

        // for some reason (TS?) express doesn't work with del as http verb
        // unlike the JS version, which simply uses del as a keyword.
        // deletes a feature
        this.server.delete("/:layer/feature/:id", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layer, req.params.id);
        });

        // updates all features corresponding to query on ID
        this.server.put("/:layer/feature/:id", (req: express.Request, res: express.Response) => {
            this.manager.updateFeature(req.params.layer, req.params.id);
        });

        // express api aanmaken
        // vb. addFeature,



        // doorzetten naar de layermanager


    }

}
