module csComp.Services {
    'use strict';

    declare var L;

    export class TileLayerSource implements ILayerSource {
        title = "tilelayer";
        //service : LayerService;
        requiresLayer = false;
        private prevDateTimes: { [id: string]: string } = {};
        constructor(public service: LayerService) {
        }

        public refreshLayer(layer: ProjectLayer) {
            //console.log('refreshing');
            if (layer.mapLayer.getLayers().length > 0) {
                var l = <L.TileLayer>layer.mapLayer.getLayers()[0];
                //console.log("layer ID: " + layer.id);
                var u = layer.url;
                if (layer.timeDependent) {
                    // convert epoch to time string parameter
                    var ft = this.service.project.timeLine.focus;
                    if (layer.timeResolution) {
                        var tr = layer.timeResolution;
                        ft = Math.floor(ft / tr) * tr;
                        //console.log(ft.toString())
                    };
                    var d = new Date(0);
                    d.setUTCSeconds(ft / 1000);
                    //d.setFullYear(2011); // so the current year becomes 2011. For easier testing.
                    // this is for the Env4U project
                    var sDate: string = d.yyyymmdd();
                    var hrs = d.getHours();
                    var mins = d.getMinutes();
                    var secs = d.getSeconds();
                    var sDateTime: string = sDate + Utils.twoDigitStr(hrs) +
                        Utils.twoDigitStr(mins) + Utils.twoDigitStr(secs);
                    //console.log("DateTime: " + sDateTime);
                    if (sDateTime === this.prevDateTimes[layer.id]) {
                        //console.log("Same time stamp. No refresh");
                        return
                    }
                    this.prevDateTimes[layer.id] = sDateTime;
                    u += "&time=" + sDateTime;
                    //console.log(u);
                } else if (layer.disableCache) {
                    // check if we need to create a unique url to force a refresh
                    layer.cacheKey = new Date().getTime().toString();
                    u += "&cache=" + layer.cacheKey;
                }
                l.setUrl(u);
            }
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            return [
                ['Refresh', (($itemScope) => this.refreshLayer(layer))]
            ];
        }

        public addLayer(layer: ProjectLayer, callback: Function, data = null) {
            layer.renderType = "tilelayer";
            callback(layer);
            //this.$rootScope.$apply();
        }

        removeLayer(layer: ProjectLayer) {
        }

    }

}
