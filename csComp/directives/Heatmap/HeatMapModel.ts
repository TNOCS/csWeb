module Heatmap {
    /**
    * A simple interface to describe a heat map.
    */
    export interface IHeatmapModel {
        title: string;
        heatmapItems: IHeatmapItem[];
    }

    export class HeatmapModel implements IHeatmapModel {
        heatmapItems: IHeatmapItem[] = [];
      
        constructor(public title: string) { }

        /**
         * Calculate the heatmap.
         */
        calculate(layerService: csComp.Services.LayerService, heatmap) { //: L.TileLayer.WebGLHeatMap) {
            console.log('Calculating heatmap');
            var heatspots: IHeatspot[] = [];
            // Iterate over all applicable features on the map and add them to the list of heat spots.
            var dataset = csComp.Helpers.loadMapLayers(layerService);
            heatmap.clearData();
            dataset.features.forEach((f) => {
                this.heatmapItems.forEach((hi) => {
                    var heatspot = hi.calculateHeatspots(f);
                    if (heatspot) {
                        //heatspots = heatspots.concat(heatspot
                        //console.log('Created ' + heatspot.length + ' heatspots');
                        heatspot.forEach((hs) => {
                            heatmap.addDataPoint(hs.latitude, hs.longitude, hs.intensity, hs.radius);
                        });
                    }
                });
            });
            //console.log('Created ' + heatspots.length + ' heatspots');
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
                    if (hi.userWeight !== 0)
                    {
                        hi.weight = hi.userWeight / totalUserWeight;
                        hi.reset();
                    }
                    else
                        hi.reset();
                }
            });
        }

        /** 
        * Add a heatmap item to the list of items only in case we don't have it yet.
        */
        addHeatmapItem(heatmapItem: IHeatmapItem) {
            var ft    = heatmapItem.featureType;
            var title = heatmapItem.title;
            for (var i = 0; i < this.heatmapItems.length; i++) {
                var hi = this.heatmapItems[i];
                if (hi.featureType === ft && hi.title === title) return;
            }
            this.heatmapItems.push(heatmapItem);
        }
    }
}
