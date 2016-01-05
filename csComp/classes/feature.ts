module csComp.Services {

    export class Section {
        public properties: { [key : string] : csComp.Services.IPropertyType} = {};
    }

    export class Log {
        /**
         * Timestamp, epoch ms
         */
        ts: number;
        /**
         * property
         */
        prop:  string;
        value: any;
        user:  string;
    }

    export interface IGuiObject {
        /** When true, the feature is included on the map, as opposed to being removed by a filter. */
        included: boolean;
        [key: string]: any;
    }

    export interface IFeature {
        id?:              string;
        index:            number;
        layerId:          string;
        layer:            csComp.Services.ProjectLayer;
        type?:            string;
        geometry:         IGeoJsonGeometry;
        properties?:      IProperty;
        propertiesOld?:   IProperty;
        isSelected?:      boolean;
        htmlStyle?:       string;
        featureTypeName?: string;
        fType?:           IFeatureType;
        effectiveStyle:   IFeatureTypeStyle;
        _isInitialized?:  boolean;
        lastUpdated:      number;
        _gui:             IGuiObject;
        sensors?:         { [id: string]: any[] };
        logs?:            { [id: string]: Log[] };
        timestamps:       number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        /**
         * Temperal list of geometries used e.g. to move a point over time (bound to timestamps, same as sensors)
         */
        coordinates?: IGeoJsonGeometry[];          // used for temporal data
        languages?:   { [key: string]: ILocalisedData };
    }

    /**
     * A feature is a single object that is show on a map (e.g. point, polyline, etc)
     * Features are part of a layer and filtered and styled using group filters and styles
     *
     */
    export class Feature implements IFeature {
        id:              string;
        index:           number;
        layerId:         string;
        layer:           ProjectLayer;
        type:            string;
        geometry:        IGeoJsonGeometry;
        properties:      IProperty;
        propertiesOld:   IProperty;
        isSelected:      boolean;
        htmlStyle:       string;
        featureTypeName: string;
        lastUpdated:     number;
        _gui:            IGuiObject = { included: true };
        /** resolved feature type */
        fType: IFeatureType;
        /** calculated style, used for final rendering */
        effectiveStyle: IFeatureTypeStyle;
        _isInitialized: boolean;
        sensors:        { [id: string]: any[] };
        timestamps:     number[]; //epoch timestamps for sensor data or coordinates (replaces timestamps in layer, if all features use same timestamps recom. to use layer timestamps
        coordinates:    IGeoJsonGeometry[];          // used for temporal data
        logs:           { [id: string]: Log[] } = {};

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
        name?:        string;
        title?:       string;
        description?: string;
        section?:     string;
        options?:     string[];
    }

    export interface ILanguageData {
        [key: string]: ILocalisedData;
    }

    export enum LayerActivationTypes {
        manual,
        automatic
    }

    export interface ILayerPropertyDetails {
        activation?:         string;
        groupId?:            string;
        defaultFeatureType?: string;
        typeUrl?:            string;
    }

    export interface IPropertyType {
        id?:               string;
        label?:            string;
        title?:            string;
        description?:      string;
        type?:             string;
        section?:          string;
        stringFormat?:     string;
        visibleInCallOut?: boolean;
        canEdit?:          boolean;
        filterType?:       string;
        isSearchable?:     boolean;
        minValue?:         number;
        maxValue?:         number;
        defaultValue?:     number;
        count?:            number;
        calculation?:      string;
        subject?:          string;
        target?:           string;
        targetrelation?:   string;
        targetproperty?:   string;
        options?:          Object;
        categories?:       string[];
        languages?:        ILanguageData;
        legend?:           Legend;
        layerProps?:       ILayerPropertyDetails;
        /** User defined minimum value */
        min?:              number;
        /** User defined maximum value */
        max?:              number;
        targetid?:         string;
        /** Angular expression */
        expression?:       string;
    }

    export interface IPropertyTypeData {
        [key: string]: IPropertyType;
    }

    export interface IFeatureTypeStyle {
        /** Default value is Name, i.e. the feature.properties.Name contains the title/name of the feature. */
        nameLabel?:             string;
        /** The background fill color */
        fillColor?:             string;
        /** The stroke/outline color */
        strokeColor?:           string;
        /** The stroke/outline width */
        strokeWidth?:           number;
        /** The background fill color when selected */
        selectedFillColor?:     string;
        /** The stroke/outline color when selected */
        selectedStrokeColor?:   string;
        /** The stroke/outline width when selected */
        selectedStrokeWidth?:   number;
        /** Height of the property, e.g. when styling a property in Cesium */
        height?:                number;
        opacity?:               number;
        fillOpacity?:           number;
        /** Default true, draw an outline around the feature (sometimes, you wish to turn it off when dealing with a grid) */
        stroke?:                boolean;
        drawingMode?:           string;
        /** The width of the icon on the map in pixels */
        iconWidth?:             number;
        /** The height of the icon on the map in pixels */
        iconHeight?:            number;
        /** The URL of the icon on the map */
        iconUri?:               string;
        /** The URL of the model on the map (for Cesium) */
        modelUri?:              string;
        /** The name of the property that contains the model URI on the map (for Cesium) */
        modelUriProperty?:      string;
        /** The scale of the model on the map (for Cesium) */
        modelScale?:            number;
        /** The name of the property that contains the scale of the model (for Cesium, default 1) */
        modelScaleProperty?:    string;
        /** The minimum pixel size of the model on the map (for Cesium, default 32) */
        modelMinimumPixelSize?: number;
        /** The name of the property that contains the minimum size of the model (for Cesium) */
        modelMinimumPixelSizeProperty?: string;
        /** The rounding of the icon's background */
        cornerRadius?:          number;
        /** At what map resolution should we stop displaying the title. */
        maxTitleResolution?:    string;
        /** When true, set the rotation of the icon, e.g. when simulating moving objects */
        rotate?:                number;
        /** The property that specifies the rotation angle */
        rotateProperty?:        string;
        /** The property that specifies the height (in Cesium) */
        heightProperty?:        string;
        /** The property's text that should be displayed on top of the icon */
        innerTextProperty?:     string;
        /** The size of the property's text on top of the icon */
        innerTextSize?:         number;
        analysispropertyType?:  any;
        /** Internal (private) property, indicating that the feature has been initialized (initFeatureType has been called) */
        _isInitialized?:        boolean;
    }

    export interface IFeatureType {
        id?:                string;
        name?:              string;
        style?:             IFeatureTypeStyle;
        legendItems?:       LegendList.ILegendItem[];
        /** Optional expressions that are shown in the legend list. */
        legendExpr?:        IPropertyType[];
        properties?:        {};
        _propertyTypeData?: IPropertyType[];
        showAllProperties?: boolean;
        /** name of the property that contains a stringified L.GeoJSON object, which is shown when hovering above a feature */
        contourProperty?:  string;
        /**
         * Optional list of propertyType keys, separated by semi-colons.
         * The keys can be resolved in the project's propertyTypeData dictionary, or in the local propertyTypeData.
         */
        propertyTypeKeys?:  string;
        languages?:         ILanguageData;
        _isInitialized?:    boolean;
    }

    export interface IGeoJsonFile {
        featureTypes?: { [key: string]: IFeatureType };
        type:          string;
        features:      Array<IFeature>;
    }

    export interface PropertyInfo {
        max:      number;
        min:      number;
        count:    number;
        mean:     number;
        varience: number;
        sd:       number;
        userMin?: number;
        userMax?: number;
    }
}
