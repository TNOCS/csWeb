module Heatmap {
    /**
     * A heat spot represents an indexed point on the map with a certain intensity.
     */
    export interface IHeatspot {
        i        : number;
        j        : number;
        intensity: number;

        //AddLocation(lat, lon): IHeatspot;
    }

    /**
     * A heat spot represents a point on the map with a certain intensity.
     */
    export class Heatspot implements IHeatspot {
        constructor(public i: number, public j: number, public intensity: number) { }

        //AddLocation(lat, lon) {
        //    // TODO
        //    //return new Heatspot(this.latitude + lat, this.longitude + lon, this.intensity);
        //}
    }

}
