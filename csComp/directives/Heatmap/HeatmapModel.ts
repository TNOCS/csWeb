module Heatmap {
    /**
    * A simple interface to describe a heat map.
    */
    export interface IHeatmapModel {
        title: string;
        id: string;
        heatmapItems: IHeatmapItem[];
        heatmapSettings: IHeatmapSettings;
    }

    export class HeatmapModel implements IHeatmapModel {
        heatmapItems : IHeatmapItem[] = [];
        heatmapSettings: IHeatmapSettings;
        id = "";

        constructor(public title: string) {
            this.title = title;
            this.heatmapSettings = new HeatmapSettings();
        }

        /**
         * Calculate the heatmap.
         */
        calculate(layerService: csComp.Services.LayerService, mapService: csComp.Services.MapService, heatmap: L.GeoJSON) { //: L.TileLayer.WebGLHeatMap) {
            console.log('Calculating heatmap');
            var mapBounds = mapService.map.getBounds();
            var NW = mapBounds.getNorthWest();
            var NE = mapBounds.getNorthEast();
            var SW = mapBounds.getSouthWest();
            var width = NW.distanceTo(NE);  //Width of the map as it is currently visible on the screen, including padding
            var height = NW.distanceTo(SW); //Height ...

            var heatspots: IHeatspot[] = [];
            // Iterate over all applicable features on the map and find the one with the largest interest distance.
            var dataset = csComp.Helpers.loadMapLayers(layerService);
            var maxInterestDistance = 0;
            //heatmap.clearData();
            dataset.features.forEach((f) => {
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
            var maxCellCount = HeatmapCtrl.MAX_HEATMAP_CELLS;
            var horizCells = Math.floor(Math.sqrt(maxCellCount * mapRatio));
            var vertCells = Math.floor(horizCells / mapRatio);
            var cellWidth = width / horizCells;
            var cellHeight = height / vertCells;
            var dLat = (NE.lat - SW.lat) / vertCells;
            var dLng = (NE.lng - SW.lng) / horizCells;
            var count: number = 0;

            var intensityGrid = [];
            var contributorGrid = [];
            for (var i = 0; i < horizCells; i++) {
                intensityGrid[i] = [];
                contributorGrid[i] = [];
                for (var j = 0; j < vertCells; j++) {
                    intensityGrid[i][j] = 0;
                    contributorGrid[i][j] = [];
                }
            }

            // Iterate over all applicable features on the map and create a intensity "stamp" for each feature
            dataset.features.forEach((f) => {
                this.heatmapItems.forEach((hi) => {
                    var heatspot = hi.calculateHeatspots(f, cellWidth, cellHeight, horizCells, vertCells, mapBounds, paddingRatio);
                    if (heatspot) {
                        //heatspots = heatspots.concat(heatspot);
                        //console.log('Created ' + heatspot.length + ' heatspots');
                        heatspot.forEach((hs) => {
                            //heatmap.addDataPoint(hs.i, hs.j, hs.intensity);
                            if (hs.intensity != 0 &&
                                hs.i >=0 && hs.i < horizCells && hs.j >= 0 && hs.j < vertCells) {
                                intensityGrid[hs.i][hs.j] = intensityGrid[hs.i][hs.j] + hs.intensity;
                                contributorGrid[hs.i][hs.j].push(hs.contributor);
                                count = count + 1;
                            }
                        });
                    }
                });
            });
            console.log('Created ' + count + ' heatspots');

            heatmap.clearLayers();
            var weightedIntensityScale: number = ((this.heatmapSettings.intensityScale / 3)*(this.heatmapSettings.intensityScale / 3)); // Convert intensityscale from [1,...,5] to ~[0.1, 0.5, 1, 2, 3]
            //Draw the intensityGrid
            for (var i = 0; i < horizCells; i++) {
                for (var j = 0; j < vertCells; j++) {
                    if (intensityGrid[i][j] != 0) {
                        var polyCoord = [[SW.lng + dLng * i, SW.lat + dLat * j],
                            [SW.lng + dLng * (i + 1), SW.lat + dLat * j],
                            [SW.lng + dLng * (i + 1), SW.lat + dLat * (j + 1)],
                            [SW.lng + dLng * i, SW.lat + dLat * (j + 1)]];
                        var feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [polyCoord]
                            },
                            "properties": {
                                "Name": "Heatmap cell (" + i.toString() + ", " + j.toString() + ")",
                                "gridX": i,
                                "gridY": j,
                                "intensity": (intensityGrid[i][j] * weightedIntensityScale).toFixed(3),
                                "contributors": JSON.stringify(contributorGrid[i][j])
                            }
                        };
                        heatmap.addData(feature);
                    }
                }
            }
        }

        /**
         * Update the weights of all heatmap items.
         */
        updateWeights() {
            var totalUserWeight = 0;
            this.heatmapItems.forEach((hi) => {
                if (hi.isSelected) totalUserWeight += Math.abs(hi.userWeight);
            });
            this.heatmapItems.forEach((hi) => {
                if (hi.isSelected) {
                    if (totalUserWeight != 0) {
                        hi.weight = hi.userWeight / totalUserWeight;
                    } else {
                        hi.weight = 0;
                    }
                    hi.reset();
                }
            });
        }

        /** 
        * Add a heatmap item to the list of items only in case we don't have it yet.
        */
        addHeatmapItem(heatmapItem: IHeatmapItem) {
            var ft = heatmapItem.featureType;
            var title = heatmapItem.title;
            for (var i = 0; i < this.heatmapItems.length; i++) {
                var hi = this.heatmapItems[i];
                if (hi.featureType.name === ft.name && hi.title === title) return;
            }
            this.heatmapItems.push(heatmapItem);
        }

        deserialize(layer: csComp.Services.ProjectLayer) {
            this.id = layer.id;
            this.heatmapSettings = layer.heatmapSettings;
            this.heatmapItems = [];
            var heatmapitems = layer.heatmapItems;
            heatmapitems.forEach((hi_info) => {
                var im = new IdealityMeasure(hi_info.idealityMeasure.idealDistance, hi_info.idealityMeasure.atLocation, hi_info.idealityMeasure.lostInterestDistance);
                if (hi_info.propertyTitle) {
                    var hi = new HeatmapItem(hi_info.title, hi_info.featureType, hi_info.weight, hi_info.userWeight, hi_info.isSelected, im, hi_info.propertyTitle, hi_info.propertyLabel, hi_info.optionIndex);
                } else {
                    var hi = new HeatmapItem(hi_info.title, hi_info.featureType, hi_info.weight, hi_info.userWeight, hi_info.isSelected, im);
                }
                this.addHeatmapItem(hi);
            });
        }

        serialize(): string {
            var minimizedHeatmapItems = [];
            this.heatmapItems.forEach((hi) => {
                if (hi.isSelected) {
                    hi.reset();
                    minimizedHeatmapItems.push(hi);
                }
            });
            var output: string = "\"type\":\"Heatmap\"";
            output += ",\n\"heatmapSettings\":" + JSON.stringify(this.heatmapSettings, null, ' ');
            output += ",\n\"heatmapItems\":";
            output += JSON.stringify(minimizedHeatmapItems, null, ' ');
            output += ",\n\"enabled\":";
            output += JSON.stringify(false);
            output += ",\n\"opacity\":";
            output += JSON.stringify(100);
            output += "\n}";
            return output;
            ////TODO: Add reference layers
            //var output: string = "\"type\":\"Heatmap\",\n\"heatmapsettings\":{\n";
            //var featureId: string = "";
            //var featureTypes: string[] = [];
            //var weights: { [name: string]: number; } = {};
            //var idealities: { [name: string]: IdealityMeasure; } = {};
            //this.heatmapItems.forEach((f) => {
            //    if (f.isSelected) {
            //        if (f.propertyTitle) {
            //            featureId = f.featureType.name + "+" + f.propertyTitle + "+" + f.title;
            //        } else {
            //            featureId = f.featureType.name;
            //        }
            //        featureTypes.push(featureId);
            //        weights[featureId] = f.weight;
            //        idealities[featureId] = f.idealityMeasure;
            //    }
            //});
            //output += "\"featureTypes\":";
            //output += JSON.stringify(featureTypes);
            //output += ",\n\"weights\":";
            //output += JSON.stringify(weights);
            //output += ",\n\"idealities\":";
            //output += JSON.stringify(idealities);
            //output += ",\n\"minZoom\":";
            //output += JSON.stringify(this.heatmapSettings.minZoom);
            //output += ",\n\"maxZoom\":";
            //output += JSON.stringify(this.heatmapSettings.maxZoom);
            //output += "\n},\n\"enabled\":";
            //output += JSON.stringify(false);
            //output += ",\n\"opacity\":";
            //output += JSON.stringify(100);
            //output += "\n}";
            //return output;
        }
    }
}
