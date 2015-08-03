/**
 * Template for describing an RSS item, that contains coordinates, as GeoJSON.
 */
export class RssGeoJSON {
    type = "FeatureCollection";
    features: RssFeature[] = [];
}

export class RssFeature {
    type = "Feature";
    geometry: {
        type: string;
        coordinates: number[];
    };
    properties: { [key: string]: string | number | boolean | Date | any } = {};

    constructor(lat?: number | string, lon?: number | string) {
        if (lat && lon) {
            this.geometry = {
                type: "Point",
                coordinates: [+lon, +lat]
            };
        }
    }
}
