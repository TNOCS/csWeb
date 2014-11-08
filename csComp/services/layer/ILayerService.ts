module csComp.Services {
    export enum LayerType {
        GeoJson,
        Kml
    }

    export interface ILayerService {
        title      : string;
        accentColor: string;
        project    : Project;
        maxBounds  : IBoundingBox;
        findLayer(id: string): ProjectLayer;
        selectFeature(feature: GeoJson.IFeature);

        mb           : Services.MessageBusService;
        map          : Services.MapService;
        layerGroup   : L.LayerGroup<L.ILayer>;
        featureTypes : { [key: string]: GeoJson.IFeatureType; };
        metaInfoData: { [key: string]: GeoJson.IPropertyType; };
    }
}