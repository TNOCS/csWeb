module csComp.Services {
    'use strict';

    export class DatabaseSource implements ILayerSource {
        title = "database";
        layer: ProjectLayer;
        requiresLayer = false;

        public constructor(public service: LayerService) { }

        public refreshLayer(layer: ProjectLayer) {
            this.service.removeLayer(layer);
            this.service.addLayer(layer);
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.baseAddLayer(layer, callback);
        }

        /** zoom to boundaries of layer */
        public fitMap(layer: ProjectLayer) {
            var b = Helpers.GeoExtensions.getBoundingBox(this.layer.data);
            this.service.$messageBusService.publish("map", "setextent", b);
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            return [
                ["Fit map", (($itemScope) => this.fitMap(layer))],
                null,
                ['Refresh', (($itemScope) => this.refreshLayer(layer))]
            ];
        }

        protected baseAddLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.layer = layer;
            if (!layer.data || !layer.data.features || layer.BBOX) {
                async.series([
                    (cb) => {
                        layer.renderType = "geojson";
                        // Open a layer URL
                        layer.isLoading = true;
                        if (layer.BBOX) delete layer.BBOX;
                        var corners;
                        if (this.service.$mapService.map.getZoom() < 16) {
                            console.log('Zoom level too low, zoom in to show contours');
                            corners = new L.LatLngBounds(new L.LatLng(99.00000, 99.00000), new L.LatLng(99.00001, 99.00001));
                        } else {
                            corners = this.service.$mapService.map.getBounds();
                        }
                        var coords = [[[corners.getSouthWest().lng, corners.getSouthWest().lat], [corners.getNorthWest().lng, corners.getNorthWest().lat], [corners.getNorthEast().lng, corners.getNorthEast().lat], [corners.getSouthEast().lng, corners.getSouthEast().lat], [corners.getSouthWest().lng, corners.getSouthWest().lat]]];
                        var bounds = JSON.stringify({ type: "Polygon", coordinates: coords, crs: { type: "name", properties: { "name": "EPSG:4326" } } });

                        // get data
                        var bagRequestData = {
                            bounds: bounds,
                            layer: ProjectLayer.serializeableData(layer)
                        };

                        $.ajax({
                            type: 'POST',
                            url: layer.url,
                            data: JSON.stringify(bagRequestData),
                            contentType: "application/json",
                            dataType: 'json',
                            success: ((data) => {
                                console.log('Requested bag contours');
                            }),
                            error: () => { this.service.$messageBusService.publish('layer', 'error', layer) }
                        })
                    },
                    // Callback
                    () => {
                        callback(layer);
                    }
                ]);
            }
            else {
                layer.count = 0;
                layer.isLoading = false;
                var projLayer = this.service.findLayer(layer.id);
                if (projLayer) {projLayer.isLoading = false; projLayer.enabled = true;}
                layer.data.features.forEach((f) => {
                    this.service.initFeature(f, layer, false);
                });
                if (this.service.$rootScope.$root.$$phase != '$apply' && this.service.$rootScope.$root.$$phase != '$digest') { this.service.$rootScope.$apply(); }
                callback(layer);
            }
        }

        removeLayer(layer: ProjectLayer) {
            var projLayer = this.service.findLayer(layer.id);
            if (projLayer) projLayer.enabled = false;
            layer.data.features = {};
            //alert('remove layer');
        }
    }
}
