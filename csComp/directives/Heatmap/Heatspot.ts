module Heatmap {
    export interface IHeatspotContributor {
        name     : string;
        intensity: number;
    }

    /**
     * A heat spot represents an lat-lon-point on the map with a certain intensity.
     */
    export interface IHeatspot {
        i           : number;
        j           : number;
        intensity   : number;
        contributors: IHeatspotContributor[];

        AddLocation(i, j): IHeatspot;
        AddContributor(name, contribution);
    }

    /**
     * A heat spot represents a point on the map with a certain intensity.
     */
    export class Heatspot implements IHeatspot {
        constructor(public i: number, public j: number, public intensity: number, public contributors = []) { }

        AddLocation(i, j) {
            return new Heatspot(this.i + i, this.j + j, this.intensity, this.contributors);
        }

        AddContributor(name, contribution) {
            var cb = <IHeatspotContributor>{};
            cb.name = name;
            cb.intensity = contribution;
            this.contributors.push(cb);
        }

    }

}
