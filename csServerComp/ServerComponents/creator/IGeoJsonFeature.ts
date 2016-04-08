interface IGeoJsonFeature {
    id?: string;
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
