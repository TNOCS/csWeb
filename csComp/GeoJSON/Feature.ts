module csComp.GeoJson {
    export class Feature implements IFeature {
        public id             : string;
        public layerId        : string;
        public type           : string;
        public geometry       : IGeoJsonGeometry;
        public properties     : Array<IStringToString>;
        public isSelected     : boolean;
        public htmlStyle      : string; 
        public featureTypeName: string; 
        public fType          : IFeatureType;
        public isInitialized  : boolean;
    }
} 