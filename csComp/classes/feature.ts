module csComp.Services {
    export class Log {
        /**
         * Timestamp, epoch ms
         */
        ts: number;
        /**
         * property
         */
        prop: string;
        value: any;
        user: string;
    }

    export interface IFeature {
        id?: string;
        index: number;
        layerId: string;
        layer: ProjectLayer;
        type?: string;
        geometry: IGeoJsonGeometry;
        properties?: IProperty;
        propertiesOld?: IProperty;
        isSelected?: boolean;
        htmlStyle?: string;
        featureTypeName?: string;
        fType?: IFeatureType;
        effectiveStyle: IFeatureTypeStyle;
        isInitialized?: boolean;
        lastUpdated: number;
        gui: Object;
        sensors?: { [id: string]: any[] }

        logs?: { [id: string]: Log[] };
        timestamps: number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        /**
         * Temperal list of geometries used e.g. to move a point over time (bound to timestamps, same as sensors)
         */
        coordinates?: IGeoJsonGeometry[];          // used for temporal data
        languages?: { [key: string]: ILocalisedData }
    }

    /**
     * A feature is a single object that is show on a map (e.g. point, polyline, etc)
     * Features are part of a layer and filtered and styled using group filters and styles
     *
     */
    export class Feature implements IFeature {
        id: string;
        index: number;
        layerId: string;
        layer: ProjectLayer;
        type: string;
        geometry: IGeoJsonGeometry;
        properties: IProperty;
        propertiesOld: IProperty;
        isSelected: boolean;
        htmlStyle: string;
        featureTypeName: string;
        lastUpdated: number;
        gui: Object = {};
        /** resolved feature type */
        fType: IFeatureType;
        /** calculated style, used for final rendering */
        effectiveStyle: IFeatureTypeStyle;
        isInitialized: boolean;
        sensors: { [id: string]: any[] }
        timestamps: number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        coordinates: IGeoJsonGeometry[];          // used for temporal data
        logs: { [id: string]: Log[] } = {};

        public static serialize(f: IFeature): IFeature {
            var res = <IFeature>{};
            res.id = f.id;
            res.geometry = f.geometry;
            res.properties = f.properties;
            res.logs = f.logs;
            if (f.timestamps) res.timestamps = f.timestamps;
            if (f.sensors) res.sensors = f.sensors;
            return res;
        }
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
        name?: string;
        title?: string;
        description?: string;
        section?: string;
        options?: string[];
    }

    export interface ILanguageData {
        [key: string]: ILocalisedData
    }

    export enum LayerActivationTypes {
        manual,
        automatic
    }

    export interface IPropertyType {
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
        count?: number;
        calculation?: string;
        subject?: string;
        target?: string;
        targetrelation?: string;
        targetproperty?: string;
        options?: string[];
        categories?: string[];
        languages?: ILanguageData;
        legend?: Legend;
        activation?: string;
        targetid?: string;
    }

    export interface IPropertyTypeData {
        [key: string]: IPropertyType;
    }

    export interface IFeatureTypeStyle {
        nameLabel?: string; // Default value is Name, i.e. the feature.properties.Name contains the title/name of the feature.
        fillColor?: string;
        strokeColor?: string;
        selectedFillColor?: string;
        selectedStrokeColor?: string;
        selectedStrokeWidth?: number;
        height?: number;
        opacity?: number;
        fillOpacity?: number;
        stroke?: boolean;
        drawingMode?: string;
        strokeWidth?: number;
        iconWidth?: number;
        iconHeight?: number;
        iconUri?: string;
        modelUri?: string;
        modelScale?: number;
        modelMinimumPixelSize?: number;
        cornerRadius?: number;
        maxTitleResolution?: string;
        rotate?: number;
        innerTextProperty?: string;
        innerTextSize?: number;
        analysispropertyType?: any;
        rotateProperty?: string;
        isInitialized?: boolean;
    }

    export interface IFeatureType {
        id?: string;
        name?: string;
        style?: IFeatureTypeStyle;
        properties?: {};
        propertyTypeData?: IPropertyType[];
        showAllProperties?: boolean;
        /** name of the property that contains a stringified L.GeoJSON object, which is shown when hovering above a feature */
        contourProperty?: string;
        /**
         * Optional list of propertyType keys, separated by semi-colons.
         * The keys can be resolved in the project's propertyTypeData dictionary, or in the local propertyTypeData.
         */
        propertyTypeKeys?: string;
        languages?: ILanguageData;
        isInitialized?: boolean;
    }

    export interface IGeoJsonFile {
        featureTypes?: { [key: string]: IFeatureType };
        type: string;
        features: Array<IFeature>;
    }

    export class PropertyInfo {
        max: number;
        min: number;
        count: number;
        mean: number;
        varience: number;
        sd: number;
    }
}
