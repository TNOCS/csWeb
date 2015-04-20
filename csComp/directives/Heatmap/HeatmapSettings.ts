module Heatmap {
    /**
    * A simple interface to describe heatmapsettings.
    */
    export interface IHeatmapSettings {
        referenceList : string[];
        intensityScale: number;
        minZoom       : number;
        maxZoom       : number;
        resolution    : number;

        addReference(reference: string): void;
    }

    export class HeatmapSettings implements IHeatmapSettings {
        referenceList: string[] = [];
        minZoom: number = 10;
        maxZoom: number = 15;
        intensityScale: number = 3;
        resolution: number = 2;

        public addReference(reference: string) {
            // Add unique reference layers only
            if (this.referenceList.indexOf(reference) < 0) {
                this.referenceList.push(reference);
            }
        }
    }
}