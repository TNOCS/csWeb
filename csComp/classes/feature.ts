module csComp.Services {
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
        index           : number;
        layerId         : string;
        layer           : ProjectLayer;
        type?           : string;
        geometry        : IGeoJsonGeometry;
        properties?     : IProperty;
        isSelected?     : boolean;
        htmlStyle?      : string;
        featureTypeName?: string;
        fType?          : IFeatureType;
        effectiveStyle  : IFeatureTypeStyle;
        isInitialized?  : boolean;
        sensors?: { [id: string]: any[] }
        timestamps: number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        coordinates?: IGeoJsonGeometry[];          // used for temporal data
        languages?      : { [key: string]: ILocalisedData }
    }

    /**
     * A feature is a single object that is show on a map (e.g. point, polyline, etc)
     * Features are part of a layer and filtered and styled using group filters and styles
     *
     */
    export class Feature implements IFeature {
        id             : string;
        index          : number;
        layerId        : string;
        layer          : ProjectLayer;
        type           : string;
        geometry       : IGeoJsonGeometry;
        properties     : IProperty;
        isSelected     : boolean;
        htmlStyle      : string;
        featureTypeName: string;
        /** resolved feature type */
        fType          : IFeatureType;
        /** calculated style, used for final rendering */
        effectiveStyle: IFeatureTypeStyle;
        isInitialized  : boolean;
        sensors        : { [id: string]: any[] }
        timestamps: number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        coordinates: IGeoJsonGeometry[];          // used for temporal data



    }

    export interface IProperty {
        [key: string]: any; //string | number | boolean;
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

    export interface ILocalisedData {
        name?       : string;
        title?      : string;
        description?: string;
        section?    : string;
        options?    : string[];
    }

    export interface ILanguageData {
        [key: string]: ILocalisedData
    }

    export enum LayerActivationTypes
    {
      manual,
      automatic
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
        count?           : number;
        calculation?     : string;
        subject?         : string;
        target?          : string;
        targetrelation?  : string;
        targetproperty?  : string;
        options?         : string[];
        languages?       : ILanguageData;
        legend?          : Legend;
        activation?      : string;
        targetid?        : string;
    }

    export interface IPropertyTypeData {
        [key: string]: IPropertyType;
    }

    export interface IFeatureTypeStyle {
        nameLabel?             : string; // Default value is Name, i.e. the feature.properties.Name contains the title/name of the feature.
        fillColor?             : string;
        strokeColor?           : string;
        height?                : number;
        opacity?               : number;
        fillOpacity?           : number;
        stroke?                : boolean;
        drawingMode?           : string;
        strokeWidth?           : number;
        iconWidth?             : number;
        iconHeight?            : number;
        iconUri?               : string;
        modelUri?              : string;
        modelScale?            : number;
        modelMinimumPixelSize? : number;
        cornerRadius?          : number;
        maxTitleResolution?    : string;
        rotate?                : number;
        innerTextProperty?     : string;
        innerTextSize?         : number;
        analysispropertyType?  : any;
        rotateProperty?        : string;
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
}
