module Heatmap {
    /**
    * A simple interface to describe heatmapsettings.
    */
    export interface IHeatmapSettings {
        referenceList : string[];
        intensityScale: number;
        minZoom       : number;
        maxZoom       : number;
    }

    export class HeatmapSettings implements IHeatmapSettings {
        referenceList : string[] = [];
        minZoom       : number = 10;
        maxZoom       : number = 15;
        intensityScale: number = 3;
    }
}