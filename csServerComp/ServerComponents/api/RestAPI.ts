import LayerManager = require('LayerManager');
import express = require('express')

export class RestAPI implements LayerManager.IApiInterface {

    public manager: LayerManager.LayerManager

    constructor(public server: express.Express) {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init Rest API');
        //this.server.get("/testje", (req: any, res: any) => {
        //    this.manager.addFeature({ test: 'bla' });
        //});
        this.server.post("/feature", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.body);
        });

        this.server.get("/feature/:id", (req: express.Request, res: express.Response) => {
            this.manager.getFeature({ id: req.params.id});
        });

        // for some reason (TS?) express doesn't work with del as http verb
        this.server.delete("/feature/:id", (req: express.Request, res: express.Response) => {
            this.manager.addFeature({ id: req.params.id });
        });


        // express api aanmaken
        // vb. addFeature,



        // doorzetten naar de layermanager


    }

}
