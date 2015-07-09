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

        this.server.post("/:layer/feature", (req: express.Request, res: express.Response) => {
          //this.manager.addFeature(req)
            this.manager.addFeature(req.params.layer, req.body);
        });

        this.server.get("/:layer/:id", (req: express.Request, res: express.Response) => {
            this.manager.getFeature(req.params.layer, req.params.id);
        });

        // for some reason (TS?) express doesn't work with del as http verb
        this.server.delete("/:layer/feature/:id", (req: express.Request, res: express.Response) => {
            this.manager.addFeature(req.params.layer, req.params.id);
        });


        // express api aanmaken
        // vb. addFeature,



        // doorzetten naar de layermanager


    }

}
