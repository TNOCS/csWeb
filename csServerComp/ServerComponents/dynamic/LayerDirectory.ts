import fs = require('fs');
import path = require('path');
import express = require('express')
var chokidar = require('chokidar');
import ClientConnection = require('./ClientConnection');
import MessageBus = require('../bus/MessageBus');

module LayerDirectory {
    export class LayerDirectory {
        public project: any;

        public constructor(public server: express.Express, public connection: ClientConnection.ConnectionManager) {
        }

        public Start() {
            // setup http handler
            this.server.get("/layerDirectory/", (req, res) => { this.GetDirectory(req, res); });
        }

        public GetDirectory(req: express.Request, res: express.Response) {
            var result = {
                "id": "knmi",
                "reference": "knmi",
                "languages": {
                    "nl": {
                        "title": "KNMI Radar",
                        "description": "(Bron: KNMI)"
                    },
                    "en": {
                        "title": "KNMI Radar",
                        "description": "(Source: KNMI)"
                    }
                },
                "type": "wms",
                "wmsLayers": "RADNL_OPER_R___25PCPRR_L3_COLOR",
                "url": "http://geoservices.knmi.nl/cgi-bin/RADNL_OPER_R___25PCPRR_L3.cgi?",
                "enabled": false,
                "opacity": 50
            };
            res.send(result);
        }


    }

}

export = LayerDirectory;
