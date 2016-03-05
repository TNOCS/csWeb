module csComp.Services {
    export class TileLayerRenderer {
        static render(service: LayerService, layer: ProjectLayer) {
            var layers = layer.url.split('|');
            var layerUrl = layers[0];
            if (layer.timeDependent) {
                // convert epoch to time string parameter
                var ft = service.project.timeLine.focus;
                if (layer.timeResolution) {
                    var tr = layer.timeResolution;
                    ft = Math.floor(ft / tr) * tr;
                };
                var d = new Date(0);
                d.setUTCSeconds(ft / 1000);
                var sDate: string = d.yyyymmdd();
                var hrs  = d.getHours();
                var mins = d.getMinutes();
                var secs = d.getSeconds();
                var sTime: string = Utils.twoDigitStr(hrs) +
                    Utils.twoDigitStr(mins) + Utils.twoDigitStr(secs);
                layerUrl += '&time=' + sDate + sTime;
            } else if (layer.disableCache) {
                // check if we need to create a unique url to force a refresh
                layer.cacheKey = new Date().getTime().toString();
                layerUrl += '&cache=' + layer.cacheKey;
            }

            var tileLayer: any = L.tileLayer(layerUrl, { attribution: layer.description });
            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            tileLayer.setOpacity(layer.opacity / 100);
            service.map.map.addLayer(layer.mapLayer);

            if (layers.length > 1) {
                TileLayerRenderer.addUtfGrid(service, layer, layers[1]);
            }

            layer.mapLayer.addLayer(tileLayer);
            tileLayer.on('loading', (event) => {
                layer.isLoading = true;
                service.$rootScope.$apply();
                if (service.$rootScope.$$phase !== '$apply' && service.$rootScope.$$phase !== '$digest') { service.$rootScope.$apply(); }
            });
            tileLayer.on('load', (event) => {
                layer.isLoading = false;
                if (service.$rootScope.$$phase !== '$apply' && service.$rootScope.$$phase !== '$digest') { service.$rootScope.$apply(); }
            });
            layer.isLoading = true;
        }

        /**
         * Add a UTF Grid Layer to the tilelayer.
         */
        private static addUtfGrid(service: LayerService, layer: ProjectLayer, utfGridLayerUrl: string) {
            var utfGrid = new (<any>L).UtfGrid(utfGridLayerUrl, {
                resolution: 4,
                useJsonP: false
            });
            utfGrid.on('click', function (e) {
                //click events are fired with e.data==null if an area with no hit is clicked
                if (e.data) {
                    var feature = new Feature();
                    feature.properties = e.data;
                    feature.layer = layer;
                    feature.featureTypeName = `${layer.typeUrl}#${layer.defaultFeatureType}`;
                    feature.fType = service.getFeatureType(feature);
                    if (!feature.properties.hasOwnProperty('Name')) Helpers.setFeatureName(feature, this.propertyTypeData);
                    service.$messageBusService.publish('feature', 'onFeatureSelect', feature);
                    console.log('Clicked: ' + JSON.stringify(e.data, null, 2));
                } else {
                    console.log('click: nothing');
                }
            });
            // utfGrid.on('mouseover', function (e) {
            //     console.log('hover: ' + JSON.stringify(e.data, null, 2));
            // });
            service.map.map.addLayer(utfGrid);
        }
    }
}
