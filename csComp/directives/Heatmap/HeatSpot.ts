module Heatmap {
    /**
     * A heat spot represents one area on the map that has some ideal value.
     */
    export interface IHeatspot {
        geometry: csComp.Services.IGeoJsonGeometry;
        /**
         * The ideality is either a zone around a location, or, in case of a shape,
         * a number [0..1], where 0 is ignored, and 1 is ideal.
         * @type {IIdealityMeasure or number}
         */
        idealityMeasure: IIdealityMeasure | number;
    }

    export class Heatspot implements IHeatspot {
        constructor(public geometry: csComp.Services.IGeoJsonGeometry, public idealityMeasure: IIdealityMeasure | number) {}
    }

}
