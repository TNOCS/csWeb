module csComp.Services {
    'use strict';

    export class HeatmapSource implements ILayerSource {
        title = "heatmap";
        requiresLayer = true;
        service: LayerService;
        heatmapModel: Heatmap.HeatmapModel = new Heatmap.HeatmapModel("ProjectHeatmap");

        public init(service: LayerService) {
            this.service = service;
        }

        public updateLayer(layer: ProjectLayer) {
            this.generateHeatmap(layer);
        }

        public addLayer(layer: ProjectLayer, callback: Function) {
            async.series([
                (cb) => {
                    layer.layerRenderer = "heatmap";
                    layer.isLoading = true;

                    // Calculate heatmap
                    this.generateHeatmap(layer);

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
            //TODO
            console.log('TODO: [HeatmapSource] remove layer');
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
            this.heatmapModel.updateWeights();
            this.heatmapModel.calculate(this.service, this.service.$mapService, geoLayer);
            layer.data = geoLayer.toGeoJSON();

            if ((<any>(layer.data)) && (<any>(layer.data)).features) {
                (<any>(layer.data)).features.forEach((f) => {
                    this.service.initFeature(f, layer);
                });

                // Set default style for the heatmap:
                if ((<any>(layer.data)).features[0]) {
                    var calloutProp = new FeatureProps.CallOutProperty("intensity", "0", "intensity", true, true,(<any>(layer.data)).features[0], false);
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
        }
    }
}
