module Heatmap {
    /**
     * A heat spot represents a point on the map with a certain intensity.
     */
    export interface IHeatspot {
        latitude : number;
        longitude: number;
        intensity: number;
        radius?  : number;

        AddLocation(lat, lon): IHeatspot;
        //geometry: csComp.Services.IGeoJsonGeometry;
        ///**
        // * The ideality is either a zone around a location, or, in case of a shape,
        // * a number [0..1], where 0 is ignored, and 1 is ideal.
        // * @type {IIdealityMeasure or number}
        // */
        //idealityMeasure: IIdealityMeasure | number;
    }

    export class Heatspot implements IHeatspot {
        constructor(public latitude: number, public longitude: number, public intensity: number, public radius: number = 50) { }

        AddLocation(lat, lon) {
            return new Heatspot(this.latitude + lat, this.longitude + lon, this.intensity);
        }
        //constructor(public geometry: csComp.Services.IGeoJsonGeometry, public idealityMeasure: IIdealityMeasure | number) {}
    }

}
