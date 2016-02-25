module csComp.Services {
    'use strict';

    export class DatabaseSource implements ILayerSource {
        title = 'database';
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
            this.service.$messageBusService.publish('map', 'setextent', b);
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            return [
                ['Fit map', (($itemScope) => this.fitMap(layer))],
                null,
                ['Refresh', (($itemScope) => this.refreshLayer(layer))]
            ];
        }

        protected baseAddLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.layer = layer;
            async.series([
                (cb) => {
                    layer.renderType = 'geojson';
                    layer.isLoading = true;
                    var minZoom;
                    if (layer.dataSourceParameters && layer.dataSourceParameters.hasOwnProperty('minZoom')) {
                        minZoom = layer.dataSourceParameters['minZoom'];
                    } else {
                        minZoom = 15;
                    }
                    var corners;
                    if (this.service.$mapService.map.getZoom() < minZoom) {
                        this.service.$messageBusService.notify('Zoom level too low', 'Zoom in to show contours', csComp.Services.NotifyLocation.TopRight, csComp.Services.NotifyType.Info);
                        // initialize empty layer and return
                        this.initLayer(layer, callback);
                        return;
                    } else {
                        // When the zoomlevel is valid:
                        corners = this.service.$mapService.map.getBounds();
                        var coords = [[
                            [corners.getSouthWest().lng, corners.getSouthWest().lat],
                            [corners.getNorthWest().lng, corners.getNorthWest().lat],
                            [corners.getNorthEast().lng, corners.getNorthEast().lat],
                            [corners.getSouthEast().lng, corners.getSouthEast().lat],
                            [corners.getSouthWest().lng, corners.getSouthWest().lat]]];
                        var bounds = JSON.stringify({ type: 'Polygon', coordinates: coords, crs: { type: 'name', properties: { 'name': 'EPSG:4326' } } });

                        // get data from BAG
                        var bagRequestData = {
                            bounds: bounds,
                            layer: ProjectLayer.serializeableData(layer)
                        };

                        $.ajax({
                            type: 'POST',
                            url: layer.url,
                            data: JSON.stringify(bagRequestData),
                            contentType: 'application/json',
                            dataType: 'json',
                            statusCode: {
                                200: (data) => {
                                    console.log('Received bag contours');
                                    this.initLayer(data.layer, callback);
                                },
                                404: (data) => {
                                    console.log('Could not get bag contours');
                                    this.initLayer(layer, callback);
                                }
                            },
                            error: () => this.service.$messageBusService.publish('layer', 'error', layer)
                        });
                    }
                }
            ]);
        }
        
        private initLayer(layer: ProjectLayer, callback: Function) {
            var projLayer = this.service.findLayer(layer.id);
            if (projLayer) {
                layer.count = 0;
                projLayer.isLoading = false;
                projLayer.enabled   = true;
                projLayer.data = layer.data;
            }
            if (projLayer.data && projLayer.data.features && projLayer.data.features.forEach) {
                projLayer.data.features.forEach((f) => {
                    this.service.initFeature(f, projLayer, false, false);
                });
            }
            if (this.service.$rootScope.$root.$$phase !== '$apply' && this.service.$rootScope.$root.$$phase !== '$digest') { this.service.$rootScope.$apply(); }
            callback(projLayer);
        }

        removeLayer(layer: ProjectLayer) {
            var projLayer = this.service.findLayer(layer.id);
            if (projLayer) projLayer.enabled = false;
            if (layer.data) {
                layer.data['features'] = [];
            }
            //alert('remove layer');
        }
    }
}
