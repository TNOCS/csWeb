interface IGeoJsonFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: any;
    };
    properties: {
        [key: string]: any;
    }
}
export = IGeoJsonFeature;
