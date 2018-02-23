module csComp.Services {
    'use strict';

    export class HierarchySource implements ILayerSource {
        title = "hierarchy";
        layer: ProjectLayer;
        requiresLayer = true;
        $http: ng.IHttpService;

        public constructor(public service: LayerService, $http: ng.IHttpService) {
            this.$http = $http;
        }

        public refreshLayer(layer: ProjectLayer) {
            this.service.removeLayer(layer);
            this.service.addLayer(layer);
        }

        public addLayer(layer: ProjectLayer, callback: Function, data = null) {
            this.baseAddLayer(layer, callback);
        }

        public fitMap(layer: ProjectLayer) {
            var b = Helpers.GeoExtensions.getBoundingBox(this.layer.data);
            this.service.$messageBusService.publish("map", "setextent", b);
        }

        public layerMenuOptions(layer: ProjectLayer): [string, Function][] {
            return [
                ["Fit map", (($itemScope) => this.fitMap(layer))],
                ['Refresh', (($itemScope) => this.refreshLayer(layer))]
            ];
        }

        public getRequiredLayers(layer: ProjectLayer) {
            var requiredLayers: ProjectLayer[] = [];
            if (layer.hierarchySettings && layer.hierarchySettings.referenceList) {
                layer.hierarchySettings.referenceList.forEach((ref: string) => {
                    this.service.project.groups.forEach((group) => {
                        group.layers.forEach((l) => {
                            if (l.reference == ref) {
                                requiredLayers.push(l);
                            }
                        });
                    });
                });
            }
            return requiredLayers;
        }

        protected baseAddLayer(layer: ProjectLayer, callback: Function) {
            this.layer = layer;
            async.series([
                (cb) => {
                    layer.renderType = "geojson";
                    // Open a layer URL
                    layer.isLoading = true;
                    // get data

                    this.$http.get(layer.url)
                        .then((res: {data: any}) => {
                            let data = res.data;
                            layer.count = 0;
                            layer.isLoading = false;

                            // if this is a topojson layer, convert to geojson first
                            if (layer.type.toLowerCase() === 'topojson') {
                                data = csComp.Helpers.GeoExtensions.convertTopoToGeoJson(data);
                            }

                            // add featuretypes to global featuretype list
                            if (data.featureTypes) for (var featureTypeName in data.featureTypes) {
                                if (!data.featureTypes.hasOwnProperty(featureTypeName)) continue;
                                var featureType: IFeatureType = data.featureTypes[featureTypeName];

                                // give it a unique name
                                featureTypeName = layer.id + '_' + featureTypeName;
                                this.service._featureTypes[featureTypeName] = featureType;
                            }

                            if (data.timestamps) layer.timestamps = data.timestamps;

                            // store raw result in layer
                            layer.data = <any>data;
                            if (layer.data.geometries && !layer.data.features) {
                                layer.data.features = layer.data.geometries;
                            }
                            layer.data.features.forEach((f) => {
                                this.service.initFeature(f, layer, false, false);
                            });
                            this.service.$messageBusService.publish("timeline", "updateFeatures");

                            cb(null, null);
                        })
                        .catch(() => {
                            layer.count = 0;
                            layer.isLoading = false;
                            this.service.$messageBusService.notify('ERROR loading ' + layer.title, '\nwhile loading: ' + layer.url);
                            this.service.$messageBusService.publish('layer', 'error', layer);
                            cb(null, null);
                        });
                },
                // Callback
                () => {
                    callback(layer);
                }
            ]);
        }

        removeLayer(layer: ProjectLayer) {
            //alert('remove layer');
        }
    }
}
