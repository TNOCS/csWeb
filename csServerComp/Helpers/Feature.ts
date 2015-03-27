    export interface IEvent {
        id   : string;
        title: string;
        color: string;
        start: number;
    }

    export class Event implements IEvent {
        id   : string;
        title: string;
        color: string;
        start: number;
        startDate = (): Date => { return new Date(this.start); }
    }

    export interface IFeature {
        id?             : string;
        layerId         : string;
        type?           : string;
        geometry        : IGeoJsonGeometry;
        properties?     : IStringToAny;
        isSelected?     : boolean;
        htmlStyle?      : string;
        featureTypeName?: string;
        fType?          : IFeatureType;
        isInitialized?  : boolean;
        /**
        * An optional dictionary of sensors, where each sensor or measurement represents the value of the sensor
        * at a certain point in time. Is often used with the layer's timestamp property in case all sensors have the same
        * number of measurements.
        */
        sensors?: { [id: string]: any[] }
        timestamps: number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        coordinates?: IGeoJsonGeometry[];          // used for temporal data
        /**
        * An optional language dictionary, where each key, e.g. 'en' for English, represents a localised data set. Each locale can overwrite
        * the value of the title, description etc. of a feature.
        */
        languages?      : { [key: string]: ILocalisedData }
    }

    /**
     * A feature is a single object that is show on a map (e.g. point, polyline, etc)
     * Features are part of a layer and filtered and styled using group filters and styles
     *
     */
    export class Feature implements IFeature {
        id             : string;
        layerId        : string;
        type           : string;
        geometry       : IGeoJsonGeometry;
        properties     : IStringToAny;
        isSelected     : boolean;
        htmlStyle      : string;
        featureTypeName: string;
        fType          : IFeatureType;
        isInitialized  : boolean;
        sensors: { [id: string]: any[] }
        timestamps: number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        coordinates: IGeoJsonGeometry[];          // used for temporal data
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

    /**
     * Localisation information, contains translations for one language.
     */
    export interface ILocalisedData {
        name?       : string;
        title?      : string;
        description?: string;
        section?    : string;
        options?    : string[];
    }

    /**
     * Localisation data, needed to support multiple languages.
     */
    export interface ILanguageData {
        [key: string]: ILocalisedData
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
        subject?         : string;
        target?          : string;
        options?         : string[];
        languages?       : ILanguageData;
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
        languages?       : ILanguageData;
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
