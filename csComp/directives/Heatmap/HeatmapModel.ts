module Heatmap {
    /**
    * A simple interface to describe a heat map.
    */
    declare var turf: any;

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
        intensityGrid: csComp.Services.IProperty[][];
        contributorGrid: csComp.Services.IProperty[][];
        horizCells: number = 0;
        vertCells: number = 0;
        cellWidth: number = 0;
        cellHeight: number = 0;
        dLat: number = 0;
        dLng: number = 0;
        SW: L.LatLng;

        constructor(public title: string) {
            this.title = title;
            this.heatmapSettings = new HeatmapSettings();
        }

        /**
         * Calculate the heatmap.
         */
        calculate(layerService: csComp.Services.LayerService, mapService: csComp.Services.MapService, heatmap: L.GeoJSON) { //: L.TileLayer.WebGLHeatMap) {
            var time = new Date().getTime();
            console.log('Calculating heatmap');
            var mapBounds = mapService.map.getBounds();
            var NW = mapBounds.getNorthWest();
            var NE = mapBounds.getNorthEast();
            this.SW = mapBounds.getSouthWest();
            var width = NW.distanceTo(NE);  //Width of the map as it is currently visible on the screen, including padding
            var height = NW.distanceTo(this.SW); //Height ...

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
            var maxCellCount;
            switch (this.heatmapSettings.resolution) {
                case 1:
                    maxCellCount = 1000;
                    break;
                case 2:
                    maxCellCount = 4000;
                    break;
                case 3:
                    maxCellCount = 7000;
                    break;
                default:
                    maxCellCount = 4000;
                    break;
            }
            this.horizCells = Math.floor(Math.sqrt(maxCellCount * mapRatio));
            this.vertCells = Math.floor(this.horizCells / mapRatio);
            this.cellWidth = width / this.horizCells;
            this.cellHeight = height / this.vertCells;
            this.dLat = (NE.lat - this.SW.lat) / this.vertCells;
            this.dLng = (NE.lng - this.SW.lng) / this.horizCells;
            var count: number = 0;

            //var turfgrid = turf.squareGrid([SW.lng, SW.lat, NE.lng, NE.lat], cellWidth / 1000, 'kilometers');
            this.intensityGrid = [];
            this.contributorGrid = [];
            for (var i = 0; i < this.horizCells; i++) {
                this.intensityGrid[i] = [];
                this.contributorGrid[i] = [];
                for (var j = 0; j < this.vertCells; j++) {
                    this.intensityGrid[i][j] = {};
                    this.contributorGrid[i][j] = {};
                }
            }

            // Iterate over all applicable features on the map and create a intensity "stamp" for each feature
            dataset.features.forEach((f) => {
                this.heatmapItems.forEach((hi) => {
                    var heatspot = hi.calculateHeatspots(f, this.cellWidth, this.cellHeight, this.horizCells, this.vertCells, mapBounds, paddingRatio);
                    if (heatspot) {
                        //heatspots = heatspots.concat(heatspot);
                        //console.log('Created ' + heatspot.length + ' heatspots');
                        heatspot.forEach((hs) => {
                            //heatmap.addDataPoint(hs.i, hs.j, hs.intensity);
                            if (hs.intensity != 0 &&
                                hs.i >= 0 && hs.i < this.horizCells && hs.j >= 0 && hs.j < this.vertCells) {
                                (this.intensityGrid[hs.i][hs.j].hasOwnProperty(hi.toString())) ? this.intensityGrid[hs.i][hs.j][hi.toString()] += hs.intensity : this.intensityGrid[hs.i][hs.j][hi.toString()] = hs.intensity;
                                this.contributorGrid[hs.i][hs.j][hs.contributor] = hs.intensity;
                                count = count + 1;
                            }
                        });
                    }
                });
            });
            var time2 = new Date().getTime();
            console.log('Created ' + count + ' heatspots in ' + (time2 - time).toFixed(1) + ' ms');
            
            this.drawIntensityGrid(heatmap);

            var time3 = new Date().getTime();
            console.log('Calculated ' + (i*j) + ' cells in ' + (time3 - time).toFixed(1) + ' ms');
        }

        public drawIntensityGrid(heatmap: L.GeoJSON) {
            var weightedIntensityScale: number = ((this.heatmapSettings.intensityScale / 3) * (this.heatmapSettings.intensityScale / 3)); // Convert intensityscale from [1,...,5] to ~[0.1, 0.5, 1, 2, 3]
            heatmap.clearLayers();
            var hiWeights: csComp.Services.IProperty = {}; 
            this.heatmapItems.forEach((hi) => {
                hiWeights[hi.toString()] = hi.weight;
            });

            //Draw the intensityGrid
            for (var i = 0; i < this.horizCells; i++) {
                for (var j = 0; j < this.vertCells; j++) {
                    var totalIntensity: number = 0;
                    for (var hiTitle in this.intensityGrid[i][j]) {
                        if (this.intensityGrid[i][j].hasOwnProperty(hiTitle)) {
                            totalIntensity += (hiWeights[hiTitle] * this.intensityGrid[i][j][hiTitle]);
                        }
                    }
                    if (totalIntensity != 0) {
                        var polyCoord = [[this.SW.lng + this.dLng * i, this.SW.lat + this.dLat * j],
                            [this.SW.lng + this.dLng * (i + 1), this.SW.lat + this.dLat * j],
                            [this.SW.lng + this.dLng * (i + 1), this.SW.lat + this.dLat * (j + 1)],
                            [this.SW.lng + this.dLng * i, this.SW.lat + this.dLat * (j + 1)]];
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
                                "totalIntensity": (totalIntensity * weightedIntensityScale).toFixed(3),
                                "contributors": JSON.stringify(this.contributorGrid[i][j], function (key, intensity) {
                                    return intensity.toFixed ? Number(intensity.toFixed(3)) : intensity;
                                }),
                                "intensities": JSON.stringify(this.intensityGrid[i][j])
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
                    //hi.reset();
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
            var hs = layer.heatmapSettings;
            this.heatmapSettings = new HeatmapSettings(hs.referenceList, hs.minZoom, hs.maxZoom, hs.intensityScale, hs.resolution);
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
                    if (hi.propertyTitle) {
                        var hi_new = new HeatmapItem(hi.title, <csComp.Services.IFeatureType>{name: hi.featureType.name}, hi.weight, hi.userWeight, hi.isSelected, hi.idealityMeasure, hi.propertyTitle, hi.propertyLabel, hi.optionIndex);
                    } else {
                        var hi_new = new HeatmapItem(hi.title, <csComp.Services.IFeatureType>{name: hi.featureType.name}, hi.weight, hi.userWeight, hi.isSelected, hi.idealityMeasure);
                    }
                    minimizedHeatmapItems.push(hi_new);
                }
            });
            var output: string = "{\"id\": \"ID\",\n" +
                "\"reference\": \"REFERENCE\",\n" +
                "\"languages\": {\n" +
                "\"nl\": {\"title\": ";
            output += JSON.stringify(this.title);
            output += ",\n\"description\": \"BESCHRIJVING\"\n},\n" +
                        "\"en\": {\"title\": ";
            output += JSON.stringify(this.title);
            output += ",\n\"description\": \"DESCRIPTION\"\n}\n" +
                        "},\n" +
                        "\"description\": \"DESCRIPTION\",\n";
            output +="\"type\":\"Heatmap\"";
            output += ",\n\"heatmapSettings\":" + JSON.stringify(this.heatmapSettings, null, ' ');
            output += ",\n\"heatmapItems\":";
            output += JSON.stringify(minimizedHeatmapItems, null, ' ');
            output += ",\n\"enabled\":";
            output += JSON.stringify(false);
            output += ",\n\"opacity\":";
            output += JSON.stringify(100);
            output += "\n}";
            return output;
        }
    }
}
