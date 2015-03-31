module csComp.Services {
    'use strict';

    export class HeatmapSource implements ILayerSource {
        title = "heatmap";
        requiresLayer = true;
        service: LayerService;
        heatmapItems: Heatmap.IHeatmapItem[] = [];

        public init(service: LayerService) {
            this.service = service;
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
            layer.criteria.referenceList.forEach((ref: string) => {
                this.service.project.groups.forEach((group) => {
                    group.layers.forEach((l) => {
                        if (l.reference == ref) {
                            requiredLayers.push(l);
                        }
                    });
                });
            });
            return requiredLayers;
        }

        getFeatureTypes(layer: ProjectLayer) {
            var featureTypes: string[] = [];
            layer.criteria.featureTypes.forEach((ft: string) => {
                featureTypes.push(ft);
            });
            return featureTypes;
        }

        generateHeatmap(layer: ProjectLayer) {
            console.log('Calculating heatmap');
            var mapBounds = this.service.$mapService.map.getBounds();
            var NW = mapBounds.getNorthWest();
            var NE = mapBounds.getNorthEast();
            var SW = mapBounds.getSouthWest();
            var width = NW.distanceTo(NE);  //Width of the map as it is currently visible on the screen, including padding
            var height = NW.distanceTo(SW); //Height ...
            var heatspots: Heatmap.IHeatspot[] = [];
            this.heatmapItems = [];

            // Create a new heatmapitem for each featuretype that is listed in the criteria
            var featureTypes: string[] = this.getFeatureTypes(layer);
            for (var ftype in this.service.project.featureTypes) {
                featureTypes.forEach((ft) => {
                    // Only create heatmapitems for the requested featuretypes
                    if (ft == this.service.project.featureTypes[ftype].name) {
                        var hi: Heatmap.HeatmapItem = new Heatmap.HeatmapItem(this.service.project.featureTypes[ftype].name, this.service.project.featureTypes[ftype]);
                        var im = new Heatmap.IdealityMeasure();
                        im.atLocation           = layer.criteria.idealities[ft].atLocation;
                        im.idealDistance        = layer.criteria.idealities[ft].idealDistance;
                        im.lostInterestDistance = layer.criteria.idealities[ft].lostInterestDistance;
                        hi.idealityMeasure = im;
                        hi.isSelected      = true;
                        hi.weight          = layer.criteria.weights[ft];
                        hi.intensityScale  = 1;
                        this.heatmapItems.push(hi);
                    }
                });
            }

            var dataset = this.service.project.features;

            // Iterate over all applicable features on the map and find the one with the largest interest distance.
            var maxInterestDistance = 0;
            dataset.forEach((f) => {
                this.heatmapItems.forEach((hi) => {
                    if (hi.idealityMeasure.lostInterestDistance > maxInterestDistance) {
                        maxInterestDistance = hi.idealityMeasure.lostInterestDistance;
                    }
                });
            });
            var widthPaddingRatio = (width + 2 * maxInterestDistance) / width;
            var heigthPaddingRatio = (height + 2 * maxInterestDistance) / height;
            var paddingRatio = Math.max(widthPaddingRatio, heigthPaddingRatio);

            //Calculate a grid based on the maximum number of cells and the map ratio.
            var mapRatio = width / height;
            var maxCellCount = 2500;
            var horizCells = Math.floor(Math.sqrt(maxCellCount * mapRatio));
            var vertCells = Math.floor(horizCells / mapRatio);
            var cellWidth = width / horizCells;
            var cellHeight = height / vertCells;
            var dLat = (NE.lat - SW.lat) / vertCells;
            var dLng = (NE.lng - SW.lng) / horizCells;
            var count: number = 0;

            //Initialize the grid to zero
            var intensityGrid = [];
            for (var i = 0; i < horizCells; i++) {
                intensityGrid[i] = [];
                for (var j = 0; j < vertCells; j++) {
                    intensityGrid[i][j] = 0;
                }
            }

            // Iterate over all applicable features on the map and create a intensity "stamp" for each feature
            dataset.forEach((f) => {
                this.heatmapItems.forEach((hi) => {
                    var heatspot = hi.calculateHeatspots(f, cellWidth, cellHeight, horizCells, vertCells, mapBounds, paddingRatio);
                    if (heatspot) {
                        //heatspots = heatspots.concat(heatspot);
                        //console.log('Created ' + heatspot.length + ' heatspots');
                        heatspot.forEach((hs) => {
                            //heatmap.addDataPoint(hs.i, hs.j, hs.intensity);
                            if (hs.intensity != 0 &&
                                hs.i >= 0 && hs.i < horizCells && hs.j >= 0 && hs.j < vertCells) {
                                intensityGrid[hs.i][hs.j] = intensityGrid[hs.i][hs.j] + hs.intensity;
                                count = count + 1;
                            }
                        });
                    }
                });
            });
            console.log('Created ' + count + ' heatspots');

            var geoLayer = L.geoJson([]); /*, {
                style: function (feature) {
                    if (feature.properties.intensity <= 0) {
                        var hexString = Heatmap.HeatmapCtrl.intensityToHex(feature.properties.intensity);
                        return { color: "#FF" + hexString + hexString };
                    } else if (feature.properties.intensity > 0) {
                        var hexString = Heatmap.HeatmapCtrl.intensityToHex(feature.properties.intensity);
                        return { color: "#" + hexString + hexString + "FF" };
                    } else {
                        return { color: "#000000" };
                    }
                }
            });*/
            //Draw the intensityGrid
            for (var i = 0; i < horizCells; i++) {
                for (var j = 0; j < vertCells; j++) {
                    if (intensityGrid[i][j] != 0) {
                        var polyCoord = [[SW.lng + dLng * i, SW.lat + dLat * j],
                            [SW.lng + dLng * (i + 1), SW.lat + dLat * j],
                            [SW.lng + dLng * (i + 1), SW.lat + dLat * (j + 1)],
                            [SW.lng + dLng * i, SW.lat + dLat * (j + 1)],
                            [SW.lng + dLng * i, SW.lat + dLat * j]];
                        var feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [polyCoord]
                            },
                            "properties": {
                                "gridX": i,
                                "gridY": j,
                                "intensity": intensityGrid[i][j],
                                "Name": "Heatmap cell (" + i.toString() + ", " + j.toString() + ")"
                            }
                        };

                        //var ft: Feature = new Feature();
                        //var geo = <IGeoJsonGeometry>{};
                        //geo.type = "Polygon";
                        //geo.coordinates = [polyCoord];
                        //var props: IStringToAny = { "gridX": i, "gridY": j, "intensity": intensityGrid[i][j] };
                        //ft.type = "Feature";
                        //ft.geometry = geo;
                        //ft.properties = props;

                        geoLayer.addData(feature);

                    }
                }
            }
            layer.data = geoLayer.toGeoJSON();

            (<any>(layer.data)).features.forEach((f) => {
                this.service.initFeature(f, layer);
            });
        }
    }
}
