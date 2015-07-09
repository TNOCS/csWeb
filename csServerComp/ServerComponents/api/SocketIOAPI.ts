import LayerManager = require('LayerManager');
import express = require('express')

export class SocketIOAPI implements LayerManager.IApiInterface {

    public manager: LayerManager.LayerManager

    constructor(public server: express.Express) {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
        this.manager = layerManager;
        console.log('init SocketIO API');


    }

}
