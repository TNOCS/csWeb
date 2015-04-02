module Heatmap {
    /**
    * A simple interface to describe heatmapsettings.
    */
    export interface IHeatmapSettings {
        referenceList: string[];
        featureTypes : string[];
        idealities   : IdealityMeasure[];
        minZoom      : number;
        maxZoom      : number;
        weights      : number[];
    }

    export class HeatmapSettings implements IHeatmapSettings {
        referenceList: string[] = [];
        featureTypes : string[] = [];
        idealities   : IdealityMeasure[] = [];
        minZoom      : number;
        maxZoom      : number;
        weights      : number[];
    }
}