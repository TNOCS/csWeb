module Heatmap {

    /**
     * A heat spot represents an lat-lon-point on the map with a certain intensity.
     */
    export interface IHeatspot {
        i           : number;
        j           : number;
        intensity   : number;
        contributor : string;

        AddLocation(i, j, contributor): IHeatspot;
    }

    /**
     * A heat spot represents a point on the map with a certain intensity.
     */
    export class Heatspot implements IHeatspot {
        constructor(public i: number, public j: number, public intensity: number, public contributor?: string) { }

        AddLocation(i, j, contributor) {
            return new Heatspot(this.i + i, this.j + j, this.intensity, contributor);
        }

    }

}
