module csComp.Services {
    export enum LayerType {
        GeoJson,
        Kml
    }

    export interface ILayerService {
        title      : string;
        accentColor: string;
        project    : Project;
        solution   : Solution;
        maxBounds  : IBoundingBox;
        findLayer(id: string): ProjectLayer;
        selectFeature(feature: GeoJson.IFeature);
        openSolution(url: string, layers?: string, initialProject?: string): void;

        mb           : Services.MessageBusService;
        map          : Services.MapService;
        layerGroup   : L.LayerGroup<L.ILayer>;
        featureTypes : { [key: string]: GeoJson.IFeatureType; };
        metaInfoData : { [key: string]: GeoJson.IMetaInfo; };
    }
}