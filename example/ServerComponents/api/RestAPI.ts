import LayerManager = require('LayerManager');
import express = require('express')

export class RestAPI implements LayerManager.IApiInterface {

    public manager: LayerManager.LayerManager

    constructor(public server: express.Express) {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init Rest API');
        this.server.get("/testje", (req: any, res: any) => {
            this.manager.addFeature({ test: 'bla' });
        });



        // express api aanmaken
        // vb. addFeature,



        // doorzetten naar de layermanager


    }

}
