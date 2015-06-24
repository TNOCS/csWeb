module csComp.Services {
    'use strict';

    export class HierarchySource implements ILayerSource {
        title = "hierarchy";
        layer: ProjectLayer;
        requiresLayer = true;

        public constructor(public service: LayerService) {

        }

        public refreshLayer(layer: ProjectLayer) {
            this.service.removeLayer(layer);
            this.service.addLayer(layer);
        }

        public addLayer(layer: ProjectLayer, callback: Function) {
            this.baseAddLayer(layer, callback);
        }

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
                    d3.json(layer.url, (error, data) => {
                        layer.count = 0;
                        layer.isLoading = false;
                        // check if loaded correctly
                        if (error) {
                            this.service.$messageBusService.notify('ERROR loading ' + layer.title, error);
                            this.service.$messageBusService.publish('layer', 'error', layer);
                        } else {
                            // if this is a topojson layer, convert to geojson first
                            if (layer.type.toLowerCase() === 'topojson') {
                                data = csComp.Helpers.GeoExtensions.convertTopoToGeoJson(data);
                            }

                            // check if there are events definined
                            if (data.events && this.service.timeline) {
                                layer.events = data.events;
                                var devents = [];
                                layer.events.forEach((e: Event) => {
                                    if (!e.id) e.id = Helpers.getGuid();
                                    devents.push({
                                        'start': new Date(e.start),
                                        'content': e.title
                                    });
                                });
                                this.service.timeline.draw(devents);
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
                                this.service.initFeature(f, layer);
                            });
                        }
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
