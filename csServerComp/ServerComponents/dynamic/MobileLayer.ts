declare var require: (moduleId: string) => any;
import express = require('express')
import MessageBus = require('../bus/MessageBus');
import fs = require('fs');
import path = require('path');
import request = require('request');
import ApiManager = require('../api/ApiManager');
import Feature = ApiManager.Feature;
import Layer = ApiManager.Layer;
import ClientConnection = require("../dynamic/ClientConnection");
import DynamicLayer = require("../dynamic/DynamicLayer");
import Utils = require("../helpers/Utils");
import xml2js = require('xml2js');

import Winston = require('winston');


module MobileLayer {
    export class MobileLayer {
        private count: number;
        public layer: ApiManager.Layer;
        public startDate: number;

        constructor(public manager: ApiManager.ApiManager, layerId: string, typeUrl: string, server: express.Express, messageBus: MessageBus.MessageBusService, public connection: ClientConnection.ConnectionManager) {

            if (manager) {
                manager.deleteLayer(layerId, {}, (cb) => {
                    this.layer = <ApiManager.Layer>{
                        id: layerId,
                        typeUrl: typeUrl,
                        features: []
                        , storage: 'file'
                    }
                    manager.addUpdateLayer(this.layer, {}, (cb) => {



                    });
                })

            }
            else {
                console.log('no manager');
            }

            // this.connection.subscribe("rti", (msg, id: string) => {
            //     switch (msg.data) {
            //         case "bot":
            //
            //
            //             break;
            //         case "restart":
            //             Winston.warn("restarting script")
            //
            //             this.startDate = new Date().getTime();
            //             this.layer.features = [];
            //             this.manager.addUpdateLayer(this.layer, {}, (cb) => {
            //                 this.connection.publish("rti", "msg", "msg", "restart");
            //             });
            //             break;
            //     }
            // });

        }
    }
}
export = MobileLayer;
