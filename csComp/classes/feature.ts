module csComp.Services {
    export interface IEvent {
        id   : string;
        title: string;
        color: string;
        start: number;
    }

    export class Event implements IEvent {
        public id   : string;
        public title: string;
        public color: string;
        public start: number;

        public startDate = (): Date => { return new Date(this.start); } 
    }

    export interface IFeature {
        id?             : string;
        layerId         : string;
        type?           : string;
        geometry        : IGeoJsonGeometry;
        properties      : IStringToAny;
        isSelected?     : boolean;
        htmlStyle?      : string;
        featureTypeName?: string;
        fType?          : IFeatureType;
        isInitialized?  : boolean;
        sensors?        : { [id: string]: any[]}
    }

    /** 
     * A feature is a single object that is show on a map (e.g. point, polyline, etc)
     * Features are part of a layer and filtered and styled using group filters and styles
     * 
     */
    export class Feature implements IFeature {
        public id             : string;
        public layerId        : string;
        public type           : string;
        public geometry       : IGeoJsonGeometry;
        public properties     : IStringToAny;
        public isSelected     : boolean;
        public htmlStyle      : string;
        public featureTypeName: string;
        public fType          : IFeatureType;
        public isInitialized  : boolean;
        public sensors        : { [id: string]: any[] }
    }

    export interface IStringToAny {
        [key: string]: any;
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

    //export enum propertyTypeType {
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

    export interface IPropertyType {
        label?           : string;
        title?           : string;
        description?     : string;
        type?            : string;
        section?         : string;
        stringFormat?    : string;
        visibleInCallOut?: boolean;
        canEdit?         : boolean;
        filterType?      : string;
        isSearchable?    : boolean;
        minValue?        : number;
        maxValue?        : number;
        defaultValue?    : number;
    }

    export interface IPropertyTypeData {
        [key: string]: IPropertyType;
    }

    export interface IFeatureTypeStyle {
        nameLabel?           : string; // Default value is Name, i.e. the feature.properties.Name contains the title/name of the feature.
        fillColor?           : string;
        strokeColor?         : string;
        drawingMode?         : string;
        strokeWidth?         : number;
        iconWidth?           : number;
        iconHeight?          : number;
        iconUri?             : string;
        maxTitleResolution?  : string;
        analysispropertyType?: any;
    }

    export interface IFeatureType {
        name?            : string;
        style?           : IFeatureTypeStyle;
        propertyTypeData?: IPropertyType[];
        /**
         * Optional list of propertyType keys, separated by semi-colons. 
         * The keys can be resolved in the project's propertyTypeData dictionary, or in the local propertyTypeData.
         */
        propertyTypeKeys?: string;
    }

    export interface IGeoJsonFile {
        featureTypes?: { [key: string]: IFeatureType };
        type         : string;
        features     : Array<IFeature>;
    }

    export class PropertyInfo {
        max     : number;
        min     : number;
        count   : number;
        mean    : number;
        varience: number;
        sd      : number;
        sdMax   : number;
        sdMin   : number;
    }
} 