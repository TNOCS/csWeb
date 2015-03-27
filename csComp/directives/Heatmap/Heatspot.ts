module Heatmap {
    /**
     * A heat spot represents an lat-lon-point on the map with a certain intensity.
     */
    export interface IHeatspot {
        i        : number;
        j        : number;
        intensity: number;

        AddLocation(i, j): IHeatspot;
    }

    /**
     * A heat spot represents a point on the map with a certain intensity.
     */
    export class Heatspot implements IHeatspot {
        constructor(public i: number, public j: number, public intensity: number) { }

        AddLocation(i, j) {
            // TODO
            //return new Heatspot(this.latitude + lat, this.longitude + lon, this.intensity);
            return new Heatspot(this.i + i, this.j + j, this.intensity);
        }
    }

}
