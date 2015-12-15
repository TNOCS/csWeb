/**
 * Simple TypeScript project definition for proj4.
 * See also: http://proj4js.org/
 */

interface proj4converter {
    /**
     * Projects from the first projection to the second.
     * Projections can be proj or wkt strings.
     * Coordinates may an object of the form {x:x,y:y} or an array of the form [x,y].
     */
    forward(coordinates: number[]| { x: number, y: number }): any; //number[] | { x: number, y: number };
    /**
     * Projects from the second projection to the first.
     * Projections can be proj or wkt strings.
     * Coordinates may an object of the form {x:x,y:y} or an array of the form [x,y].
     */
    inverse(coordinates: number[]| { x: number, y: number }): any; //number[] | { x: number, y: number };
}

interface proj4static {
    /**
     8 the coordinates are transformed from projection 1 to projection 2. And returned in the same format that they were given in.
     * Projections can be proj or wkt strings.
     * Coordinates may an object of the form {x:x,y:y} or an array of the form [x,y].
     */
    (firstProjection: string, secondProjection: string, coordinates: number[] | { x: number, y: number }): any; //any; //number[]| { x: number, y: number };

    /**
     * If only 1 projection is given then it is assumed that it is being projected from WGS84 (fromProjection is WGS84).
     * Projections can be proj or wkt strings.
     * Coordinates may an object of the form {x:x,y:y} or an array of the form [x,y].
     */
    (firstProjection: string, coordinates: number[] | { x: number, y: number }): any; //number[]| { x: number, y: number };

    /**
     * If no coordinates are given an object with two methods is returned, its methods are forward
     * which projects from the first projection to the second and inverse which projects from the second to the first.
     */
    (firstProjection: string, secondProjection: string): proj4converter;

    /**
     * If only one projection is given, it's assumed to be coming from wgs84.
     */
    (firstProjection: string): proj4converter;

    defs(projKey: string, projection: string);
    defs(proj: Array<Array<string>>);
    //
    // declare module proj4 {
    //     export function defs();
    // }
}

// interface proj4defs {
//     defs(projKey: string, projection: string);
//     defs(proj: Array<Array<string>>);
// }

declare module "proj4" {
    export = proj4;
}
declare var proj4: proj4static;
