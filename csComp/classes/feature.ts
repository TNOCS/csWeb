module csComp.GeoJson {

    export interface IFeature {
        id: string;
        layerId: string;
        type: string;
        geometry: IGeoJsonGeometry;
        properties: Array<IStringToString>;
        isSelected: boolean;
        htmlStyle: string;
        featureTypeName: string;
        fType: IFeatureType;
        isInitialized: boolean;
    }

    /** 
     * A feature is a single object that is show on a map (e.g. point, polyline, etc)
     * Features are part of a layer and filtered and styled using group filters and styles
     * 
     */
    export class Feature {
        public id: string;
        public layerId: string;
        public type: string;
        public geometry: IGeoJsonGeometry;
        public properties: Array<IStringToString>;
        public isSelected: boolean;
        public htmlStyle: string;
        public featureTypeName: string;
        public fType: IFeatureType;
        public isInitialized: boolean;
    }

    export interface IStringToString {
        [key: string]: string;
    }

    export interface IGeoJsonGeometry {
        type: string;
        coordinates: any;
    }

    export enum DrawingModeType {
        None,
        Image,
        Point,
        Square,
        Rectangle,
        Line,
        Circle,
        Freehand,
        Polyline,
        Polygon,
        MultiPolygon
    }

    //export enum MetaInfoType {
    //    Text,
    //    TextArea,
    //    Rating,
    //    Number,
    //    Bbcode,
    //    Boolean,
    //    Bit,
    //    Sensor,
    //    Xml,
    //    Options,
    //    Unknown,
    //    Image,
    //    DateTime,
    //    Mediafolder
    //}

    export enum featureFilterType {
        /** Turn filtering off */
        none,
        /** Default for numbers: histogram */
        bar,
        /** Default for text */
        text
    }

    export interface IMetaInfo {
        label?: string;
        title?: string;
        description?: string;
        type?: string;
        section?: string;
        stringFormat?: string;
        visibleInCallOut?: boolean;
        canEdit?: boolean;
        filterType?: string;
        isSearchable?: boolean;
        minValue?: number;
        maxValue?: number;
        defaultValue?: number;
    }

    export interface IFeatureTypeStyle {
        nameLabel?: string; // Default value is Name, i.e. the feature.properties.Name contains the title/name of the feature.
        fillColor?: string;
        strokeColor?: string;
        drawingMode?: string;
        strokeWidth?: number;
        iconWidth?: number;
        iconHeight?: number;
        iconUri?: string;
        maxTitleResolution?: string;
        analysisMetaInfo?: any;
    }

    export interface IFeatureType {
        name?: string;
        style?: IFeatureTypeStyle;
        metaInfoData?: IMetaInfo[];
        /**
         * Optional list of MetaInfo keys, separated by semi-colons. 
         * The keys can be resolved in the project's metaInfoData dictionary, or in the local metaInfoData.
         */
        metaInfoKeys?: string;
    }

    export interface IGeoJsonFile {
        poiTypes?: { [key: string]: IFeatureType };
        type: string;
        features: Array<Feature>;
    }

    //export class Feature implements IFeature {
    //    layerId   : string;
    //    type      : string;
    //    geometry  : IGeoJsonGeometry;
    //    properties: Array<IStringToString>;
    //}
} 