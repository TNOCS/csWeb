module csComp.Services {
    'use strict';

    export class HeatmapSource implements ILayerSource {
        title = "heatmap";
        requiresLayer = true;
        //service: LayerService;
        heatmapModel: Heatmap.HeatmapModel = new Heatmap.HeatmapModel("ProjectHeatmap");
        constructor(public service: LayerService) { }

        //public init(service: LayerService) {
        //    this.service = service;
        //}

        public refreshLayer(layer: ProjectLayer) {
            this.generateHeatmap(layer); 
        }

        public layerMenuOptions(layer : ProjectLayer) : [[string,Function]]
        {
          return null;
        }

        public addLayer(layer: ProjectLayer, callback: Function) {
            async.series([
                (cb) => {
                    layer.layerRenderer = "heatmap";
                    layer.isLoading = true;

                    if (layer.quickRefresh && layer.quickRefresh == true) {
                        // In case the map has not moved, the heatmap cells do not need to be calculated again, only the style of the markers need to be updated.
                        this.heatmapModel.deserialize(layer);
                        this.heatmapModel.id = layer.id;
                        this.heatmapModel.updateWeights();

                        if (layer.heatmapItems) {
                            var hiWeights: csComp.Services.IProperty = {};
                            this.heatmapModel.heatmapItems.forEach((hi) => {
                                hiWeights[hi.toString()] = hi.weight;
                            });
                            
                            var weightedIntensityScale: number = ((this.heatmapModel.heatmapSettings.intensityScale / 3) * (this.heatmapModel.heatmapSettings.intensityScale / 3)); // Convert intensityscale from [1,...,5] to ~[0.1, 0.5, 1, 2, 3]
                            this.service.project.features.forEach((f: csComp.Services.IFeature) => {
                                if (f.properties.hasOwnProperty('intensities') && f.properties.hasOwnProperty('contributors')) {
                                    var intensities = JSON.parse(f.properties['intensities']);
                                    var totalIntensity = 0;
                                    for (var key in intensities) {
                                        if (intensities.hasOwnProperty(key)) {
                                            totalIntensity += intensities[key] * hiWeights[key] * weightedIntensityScale;
                                        }
                                    }
                                    f.properties['totalIntensity'] = totalIntensity;
                                    this.service.calculateFeatureStyle(f);
                                    this.service.activeMapRenderer.updateFeature(f);
                                }
                            });
                        }

                    } else {
                        // In all other occasions, (re)calculate the complete heatmap 
                        this.generateHeatmap(layer);
                        layer.enabled = true;
                        this.enableProjectLayer(layer);
                    }

                    layer.isLoading = false;
                    cb(null, null);
                },
                // Callback
                () => {
                    callback(layer);
                }
            ]);
        }

        removeLayer(layer: ProjectLayer) {
            delete (this.heatmapModel);
            this.heatmapModel = new Heatmap.HeatmapModel("ProjectHeatmap");
            layer.enabled = false;
            layer.data = JSON;
            this.enableProjectLayer(layer); // Set project layer to disabled
            //this.updateLayer(layer);
        }

        /* Enables the project layer if the 'layer' parameter has the same id as a project layer */
        enableProjectLayer(layer: ProjectLayer) {
            if (layer.id) {
                this.service.project.groups.forEach((group) => {
                    group.layers.forEach((l) => {
                        if (l.id == layer.id) {
                            l.enabled = layer.enabled;
                            if (l.enabled == false) {
                                layer.data = JSON;
                            }
                        }
                    });
                });
            }
        }

        getRequiredLayers(layer: ProjectLayer) {
            var requiredLayers: ProjectLayer[] = [];
            if (layer.heatmapSettings && layer.heatmapSettings.referenceList) {
                layer.heatmapSettings.referenceList.forEach((ref: string) => {
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

        getFeatureTypes(layer: ProjectLayer) {
            var featureTypes: string[] = [];
            layer.heatmapItems.forEach((hi: Heatmap.HeatmapItem) => {
                featureTypes.push(hi.featureType.name);
            });
            return featureTypes;
        }

        generateHeatmap(layer: ProjectLayer) {
            console.log('Generating heatmap');

            var geoLayer = L.geoJson([]);
            this.heatmapModel.deserialize(layer);
            this.heatmapModel.id = layer.id;

            var currentZoom = this.service.$mapService.getMap().getZoom();
            if (currentZoom < this.heatmapModel.heatmapSettings.minZoom || currentZoom > this.heatmapModel.heatmapSettings.maxZoom) {
                return;
            } else {
                this.heatmapModel.updateWeights();
                this.heatmapModel.calculate(this.service, this.service.$mapService, geoLayer);

                var time = new Date().getTime();
                layer.data = geoLayer.toGeoJSON();
            }

            if ((<any>(layer.data)) && (<any>(layer.data)).features) {
                (<any>(layer.data)).features.forEach((f) => {
                    this.service.initFeature(f, layer);
                    this.service.activeMapRenderer.addFeature(f);
                });

                // Set default style for the heatmap:
                if ((<any>(layer.data)).features[0]) {
                    var calloutProp = new FeatureProps.CallOutProperty("totalIntensity", "0", "totalIntensity", true, true,(<any>(layer.data)).features[0], false, false);
                    var propinfo = new PropertyInfo();
                    // Tweak the group style info to keep constant min/max color values on panning and zooming.
                    propinfo.count = (<any>(layer.data)).features.length;
                    propinfo.max = 1;
                    propinfo.min = -1;
                    propinfo.sdMax = propinfo.max;
                    propinfo.sdMin = propinfo.min;
                    propinfo.mean = 0;
                    propinfo.varience = 0.67;
                    propinfo.sd = Math.sqrt(propinfo.varience);
                    this.service.setStyle(calloutProp, false, propinfo); // Set the style
                }
            }
            var time2 = new Date().getTime();
            console.log('Init and style features in ' + (time2 - time).toFixed(1) + ' ms');
        }
    }
}
