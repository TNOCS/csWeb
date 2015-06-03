/// <reference path="../crossfilter/crossfilter.d.ts" />
/// <reference path="../leaflet/leaflet.d.ts" />
declare module csComp.GeoJson {
    class Feature implements IFeature {
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
    interface IStringToString {
        [key: string]: string;
    }
    interface IGeoJsonGeometry {
        type: string;
        coordinates: any;
    }
    interface IFeature {
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
    enum DrawingModeType {
        None = 0,
        Image = 1,
        Point = 2,
        Square = 3,
        Rectangle = 4,
        Line = 5,
        Circle = 6,
        Freehand = 7,
        Polyline = 8,
        Polygon = 9,
        MultiPolygon = 10,
    }
    enum featureFilterType {
        /** Turn filtering off */
        none = 0,
        /** Default for numbers: histogram */
        bar = 1,
        /** Default for text */
        text = 2,
    }
    interface IMetaInfo {
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
    class MetaInfo {
        label: string;
        title: string;
        description: string;
        type: string;
        section: string;
        stringFormat: string;
        visibleInCallOut: boolean;
        canEdit: boolean;
        filterType: string;
        isSearchable: boolean;
        minValue: number;
        maxValue: number;
        defaultValue: number;
    }
    interface IFeatureTypeStyle {
        nameLabel?: string;
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
    interface IFeatureType {
        name?: string;
        style?: IFeatureTypeStyle;
        metaInfoData?: IMetaInfo[];
        /**
         * Optional list of MetaInfo keys, separated by semi-colons.
         * The keys can be resolved in the project's metaInfoData dictionary, or in the local metaInfoData.
         */
        metaInfoKeys?: string;
    }
}

declare module csComp.Services {
    class Widget {
        content: Function;
        constructor();
    }
    interface IWidget {
        directive: string;
        data: Object;
        url: string;
        template: string;
        title: string;
        elementId: string;
        enabled: boolean;
        parentDashboard?: csComp.Services.Dashboard;
        renderer?: Function;
        resize?: Function;
        background: string;
        init?: Function;
        start?: Function;
        left?: string;
        right?: string;
        top?: string;
        bottom?: string;
        borderWidth?: string;
        borderColor?: string;
        borderRadius?: string;
        name: string;
        id: string;
        properties: {};
        dataSets?: DataSet[];
        range: csComp.Services.DateRange;
        updateDateRange?: Function;
        collapse: boolean;
        canCollapse: boolean;
        width: string;
        height: string;
        allowFullscreen: boolean;
        hover: boolean;
        messageBusService?: csComp.Services.MessageBusService;
        layerService?: csComp.Services.LayerService;
    }
    class BaseWidget implements IWidget {
        directive: string;
        template: string;
        title: string;
        data: {};
        url: string;
        elementId: string;
        parentDashboard: csComp.Services.Dashboard;
        enabled: boolean;
        borderWidth: string;
        borderColor: string;
        borderRadius: string;
        background: string;
        left: string;
        right: string;
        top: string;
        bottom: string;
        name: string;
        id: string;
        properties: {};
        dataSets: DataSet[];
        range: csComp.Services.DateRange;
        collapse: boolean;
        canCollapse: boolean;
        width: string;
        height: string;
        allowFullscreen: boolean;
        messageBusService: csComp.Services.MessageBusService;
        layerService: csComp.Services.LayerService;
        hover: boolean;
        constructor(title?: string, type?: string);
        static serializeableData(w: IWidget): IWidget;
        start(): void;
        init(): void;
        renderer: ($compile: any, $scope: any) => void;
        updateDateRange(r: csComp.Services.DateRange): void;
        resize: (status: string, width: number, height: number) => void;
    }
    class Dashboard {
        widgets: IWidget[];
        editMode: boolean;
        showMap: boolean;
        showTimeline: boolean;
        showLeftmenu: boolean;
        showRightmenu: boolean;
        showBackgroundImage: boolean;
        draggable: boolean;
        resizable: boolean;
        background: string;
        backgroundimage: string;
        visiblelayers: string[];
        baselayer: string;
        viewBounds: IBoundingBox;
        timeline: DateRange;
        id: string;
        name: string;
        disabled: boolean;
        constructor();
        /**
         * Returns an object which contains all the data that must be serialized.
         */
        static serializeableData(d: Dashboard): Object;
        static deserialize(input: Dashboard): Dashboard;
        static addNewWidget(widget: IWidget, dashboard: Dashboard): IWidget;
    }
    class Timeline {
        id: string;
        timestamps: number[];
    }
    class TimedDataSet {
        timeline: Timeline;
        timedata: number[];
    }
    class DataSet {
        id: string;
        title: string;
        color: string;
        data: {
            [key: number]: number;
        };
        constructor(id?: string, title?: string);
    }
}

declare module csComp.Services {
    class SensorSet {
        id: string;
        title: string;
        type: string;
        propertyTypeKey: string;
        propertyType: IPropertyType;
        timestamps: number[];
        values: any[];
        activeValue: any;
        activeValueText(): string;
        addValue(date: number, value: number): void;
    }
    class DataSource {
        id: string;
        url: string;
        /** static, dynamic */
        type: string;
        title: string;
        sensors: {
            (key: string): SensorSet;
        };
        static merge_sensor(s1: SensorSet, s2: SensorSet): SensorSet;
        /**
         * Load JSON data.
         * @type {DataSource}
         *
         * @param ds {DataSource}
         * @param callback {Function}
         */
        static LoadData(ds: DataSource, callback: Function): void;
    }
}

declare module csComp.Services {
    interface IEvent {
        id: string;
        title: string;
        color: string;
        start: number;
    }
    class Event implements IEvent {
        id: string;
        title: string;
        color: string;
        start: number;
        startDate: () => Date;
    }
    interface IFeature {
        id?: string;
        index: number;
        layerId: string;
        layer: ProjectLayer;
        type?: string;
        geometry: IGeoJsonGeometry;
        properties?: IProperty;
        isSelected?: boolean;
        htmlStyle?: string;
        featureTypeName?: string;
        fType?: IFeatureType;
        effectiveStyle: IFeatureTypeStyle;
        isInitialized?: boolean;
        sensors?: {
            [id: string]: any[];
        };
        timestamps: number[];
        coordinates?: IGeoJsonGeometry[];
        languages?: {
            [key: string]: ILocalisedData;
        };
    }
    /**
     * A feature is a single object that is show on a map (e.g. point, polyline, etc)
     * Features are part of a layer and filtered and styled using group filters and styles
     *
     */
    class Feature implements IFeature {
        id: string;
        index: number;
        layerId: string;
        layer: ProjectLayer;
        type: string;
        geometry: IGeoJsonGeometry;
        properties: IProperty;
        isSelected: boolean;
        htmlStyle: string;
        featureTypeName: string;
        /** resolved feature type */
        fType: IFeatureType;
        /** calculated style, used for final rendering */
        effectiveStyle: IFeatureTypeStyle;
        isInitialized: boolean;
        sensors: {
            [id: string]: any[];
        };
        timestamps: number[];
        coordinates: IGeoJsonGeometry[];
    }
    interface IProperty {
        [key: string]: any;
    }
    interface IGeoJsonGeometry {
        type: string;
        coordinates: any;
    }
    enum DrawingModeType {
        None = 0,
        Image = 1,
        Point = 2,
        Square = 3,
        Rectangle = 4,
        Line = 5,
        Circle = 6,
        Freehand = 7,
        Polyline = 8,
        Polygon = 9,
        MultiPolygon = 10,
    }
    enum featureFilterType {
        /** Turn filtering off */
        none = 0,
        /** Default for numbers: histogram */
        bar = 1,
        /** Default for text */
        text = 2,
    }
    interface ILocalisedData {
        name?: string;
        title?: string;
        description?: string;
        section?: string;
        options?: string[];
    }
    interface ILanguageData {
        [key: string]: ILocalisedData;
    }
    enum LayerActivationTypes {
        manual = 0,
        automatic = 1,
    }
    interface IPropertyType {
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
        languages?: ILanguageData;
        legend?: Legend;
        activation?: string;
        targetid?: string;
    }
    interface IPropertyTypeData {
        [key: string]: IPropertyType;
    }
    interface IFeatureTypeStyle {
        nameLabel?: string;
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
    }
    interface IFeatureType {
        id?: string;
        name?: string;
        style?: IFeatureTypeStyle;
        propertyTypeData?: IPropertyType[];
        /**
         * Optional list of propertyType keys, separated by semi-colons.
         * The keys can be resolved in the project's propertyTypeData dictionary, or in the local propertyTypeData.
         */
        propertyTypeKeys?: string;
        languages?: ILanguageData;
    }
    interface IGeoJsonFile {
        featureTypes?: {
            [key: string]: IFeatureType;
        };
        type: string;
        features: Array<IFeature>;
    }
    class PropertyInfo {
        max: number;
        min: number;
        count: number;
        mean: number;
        varience: number;
        sd: number;
        sdMax: number;
        sdMin: number;
    }
}

declare module csComp.Services {
    enum LayerType {
        GeoJson = 0,
        Kml = 1,
    }
    /** a project group contains a list of layers that can be grouped together.
     * Filters, styles can clustering is always defined on the group level.
     * If a filter is selected (e.g. show only the features within a certain property range)
     * this filter is applied to all layers within this group.
     * If clustering is enabled all features in all layers are grouped together
     */
    class ProjectGroup {
        id: string;
        title: string;
        description: string;
        layers: Array<ProjectLayer>;
        filters: Array<GroupFilter>;
        styles: Array<GroupStyle>;
        showTitle: boolean;
        cluster: L.MarkerClusterGroup;
        vectors: L.LayerGroup<L.ILayer>;
        /** Turn on the leaflet markercluster */
        clustering: boolean;
        /** If set, at this zoom level and below markers will not be clustered. This defaults to disabled */
        clusterLevel: number;
        /**  The maximum radius that a cluster will cover from the central marker (in pixels). Default 80. Decreasing will make more smaller clusters. You can also use a function that accepts the current map zoom and returns the maximum cluster radius in pixels. */
        maxClusterRadius: number;
        clusterFunction: Function;
        /** Creates radio buttons instead of checkboxes in the level */
        oneLayerActive: boolean;
        ndx: any;
        filterResult: IFeature[];
        markers: any;
        styleProperty: string;
        languages: ILanguageData;
        /**
         * Returns an object which contains all the data that must be serialized.
         */
        static serializeableData(projectGroup: ProjectGroup): Object;
    }
    /**
     * Filters are used to select a subset of features within a group.
     */
    class GroupFilter {
        id: string;
        title: string;
        enabled: boolean;
        filterType: string;
        property: string;
        property2: string;
        criteria: string;
        group: ProjectGroup;
        dimension: any;
        value: any;
        stringValue: string;
        rangex: number[];
        meta: IPropertyType;
    }
    /**
     * Styles can determine how features are shown on the map
     */
    class GroupStyle {
        id: string;
        title: string;
        enabled: boolean;
        layers: string[];
        visualAspect: string;
        property: string;
        colors: string[];
        group: ProjectGroup;
        availableAspects: string[];
        canSelectColor: boolean;
        colorScales: any;
        info: PropertyInfo;
        meta: IPropertyType;
        legends: {
            [key: string]: Legend;
        };
        activeLegend: Legend;
        fixedColorRange: boolean;
        constructor($translate: ng.translate.ITranslateService);
    }
    /**
     * the Legend class provides a data structure that is used to map a value to a color
     * (see also the function getColor())
    */
    class Legend {
        id: string;
        description: string;
        legendKind: string;
        visualAspect: string;
        legendEntries: LegendEntry[];
    }
    class LegendEntry {
        label: string;
        interval: {
            min: number;
            max: number;
        };
        value: number;
        stringValue: string;
        color: string;
    }
}

declare module csComp.Services {
    /** Interface of a project layer
     *  Note that this is a copy of the similarly named class, but the advantage is that I can use the
     *  interface definition also on the server side.
     *  TODO Check whether we need to keep the class definition.
     */
    interface IProjectLayer {
        /** Key of the propertyTypeData entry that provides a legend for this layer **/
        defaultLegendProperty?: string;
        /** Title as displayed in the menu */
        title: string;
        /** Number of features in the layer */
        count?: number;
        /** Description as displayed in the menu */
        description?: string;
        /** link to one or more meta description files containing  */
        typeUrl?: string | string[];
        /** Type of layer, e.g. GeoJSON, TopoJSON, or WMS */
        type: string;
        /** render type */
        renderType: string;
        /** Data source */
        url: string;
        /** Contains extended heatmap information (e.g. list of references to required sources, or weights) */
        heatmapSettings?: Heatmap.IHeatmapSettings;
        heatmapItems?: Heatmap.IHeatmapItem[];
        /** WMS sublayers that must be loaded */
        wmsLayers?: string;
        /** If enabled, load the layer */
        enabled?: boolean;
        /** Layer opacity */
        opacity?: number;
        /** When loading the data, the isLoading variable is true (e.g. used for the spinner control) */
        isLoading?: boolean;
        /** Indent the layer, so it seems to be a sublayer. */
        isSublayer?: boolean;
        mapLayer?: L.LayerGroup<L.ILayer>;
        /** Group of layers */
        group: ProjectGroup;
        /** proxy url, using own server, not implemented */
        useProxy?: boolean;
        /** force refresh on chaning bounding box */
        refreshBBOX?: boolean;
        layerSource: ILayerSource;
        /**
         * Number of seconds between automatic layer refresh.
         * @type {number}
         */
        refreshTimer?: number;
        /**
         * When enabling the refresh timer, store the returned timer token so we can stop the timer later.
         * @type {number}
         */
        timerToken?: number;
        /**
        * A list of UNIX timestamp, or the UTC time in milliseconds since 1/1/1970, which define the time a sensor value
        * was taken. So in case we have 10 timestamps, each feature's sensor (key) in the feature's sensors dictionary should
        * also have a lnegth of 10.
        * Note that this value is optional, and can be omitted if the sensor already contains a timestamp too. This is mainly intended
        * when all 'sensor measurements' are taken on the same moment. For example, the CENSUS date.
        * In Excel, you can use the formula =24*(A4-$B$1)*3600*1000 to convert a date to a UNIX time stamp.
        */
        timestamps?: number[];
        /** Internal ID, e.g. for the Excel service */
        id?: string;
        /** Reference for URL params: if the URL contains layers=REFERENCE1;REFERENCE2, the two layers will be turned on.  */
        reference?: string;
        events?: Event[];
        /** Language information that can be used to localize the title and description */
        languages?: ILanguageData;
        /** layer original source */
        data?: any;
        cesiumDatasource?: any;
        items?: any;
        /** use a timestamp with each url request to make them unique (only tile layer for now, timestamp created after each refresh )*/
        disableCache?: boolean;
        /** key attached for identifying to */
        cacheKey?: string;
        /** handle for receiving server events */
        serverHandle?: MessageBusHandle;
        parentFeature: IFeature;
        /** key name of default feature type */
        defaultFeatureType?: string;
    }
    /** Layer information. a layer is described in a project file and is always part of a group */
    class ProjectLayer implements IProjectLayer {
        /** Key of the propertyTypeData entry that provides a legend for this layer **/
        defaultLegendProperty: string;
        /** Title as displayed in the menu */
        title: string;
        /** Number of features in the layer */
        count: number;
        /** Description as displayed in the menu */
        description: string;
        /** Source type of layer, e.g. GeoJSON (default), TopoJSON, or WMS TODO Refactor to sourceType */
        type: string;
        /** Specificies how the content should be rendered. Default same as 'type', but allows you to transform the source to e.g. geojson for easier rendering */
        renderType: string;
        /** Data source */
        url: string;
        /** Contains extended heatmap information (e.g. list of references to required sources, or weights) */
        heatmapSettings: Heatmap.IHeatmapSettings;
        heatmapItems: Heatmap.IHeatmapItem[];
        /** Contains hierarchy settings */
        hierarchySettings: FeatureRelations.IHierarchySettings;
        /** In case we keep the type (feature,property) information in a separate file */
        typeUrl: string;
        /** WMS sublayers that must be loaded */
        wmsLayers: string;
        /** If enabled, load the layer */
        enabled: boolean;
        /** Layer opacity */
        opacity: number;
        /** When loading the data, the isLoading variable is true (e.g. used for the spinner control) */
        isLoading: boolean;
        /** Indent the layer, so it seems to be a sublayer. */
        isSublayer: boolean;
        mapLayer: L.LayerGroup<L.ILayer>;
        /** id of the group */
        groupId: string;
        /** Group of layers */
        group: ProjectGroup;
        /** proxy url, using own server, not implemented */
        useProxy: boolean;
        /** if true, use the current bounding box to retreive data from the server */
        refreshBBOX: boolean;
        /** The current bounding box to retreive data from the server */
        BBOX: string;
        layerSource: ILayerSource;
        /**
         * Number of seconds between automatic layer refresh.
         * @type {number}
         */
        refreshTimer: number;
        /**
         * When enabling the refresh timer, store the returned timer token so we can stop the timer later.
         * @type {number}
         */
        timerToken: number;
        /**
        * A list of UNIX timestamp, or the UTC time in milliseconds since 1/1/1970, which define the time a sensor value
        * was taken. So in case we have 10 timestamps, each feature's sensor (key) in the feature's sensors dictionary should
        * also have a lnegth of 10.
        * Note that this value is optional, and can be omitted if the sensor already contains a timestamp too. This is mainly intended
        * when all 'sensor measurements' are taken on the same moment. For example, the CENSUS date.
        * In Excel, you can use the formula =24*(A4-$B$1)*3600*1000 to convert a date to a UNIX time stamp.
        */
        timestamps: number[];
        /** Internal ID, e.g. for the Excel service */
        id: string;
        /** Reference for URL params: if the URL contains layers=REFERENCE1;REFERENCE2, the two layers will be turned on.  */
        reference: string;
        events: Event[];
        /** Language information that can be used to localize the title and description */
        languages: ILanguageData;
        /** layer original source */
        data: any;
        /**
         * Object to hold any specific parameters for a certain type of data source.
         */
        dataSourceParameters: IProperty;
        cesiumDatasource: any;
        items: any;
        /** use a timestamp with each url request to make them unique (only tile layer for now, timestamp created after each refresh )*/
        disableCache: boolean;
        /** key attached for identifying to */
        cacheKey: string;
        /** handle for receiving server events */
        serverHandle: MessageBusHandle;
        /** Whether layer can be quickly updated instead of completely rerendered */
        quickRefresh: boolean;
        lastSelectedFeature: IFeature;
        /** link to a parent feature, e.g. city layer references to a parent provence */
        parentFeature: IFeature;
        /** key name of default feature type */
        defaultFeatureType: string;
        /**
         * Returns an object which contains all the data that must be serialized.
         */
        static serializeableData(pl: ProjectLayer): Object;
    }
    /**
     * Baselayers are background maps (e.g. openstreetmap, nokia here, etc).
     * They are described in the project file
     */
    interface IBaseLayer {
        id: string;
        title: string;
        isDefault: boolean;
        subtitle: string;
        preview: string;
        /** URL pointing to the basemap source. */
        url: string;
        /** Maximum zoom level */
        maxZoom: number;
        /** Minimum zoom level */
        minZoom: number;
        subdomains: string[];
        /** String that is shown on the map, attributing the source of the basemap */
        attribution: string;
        test: string;
        cesium_url?: string;
        cesium_maptype?: string;
    }
    class BaseLayer implements IBaseLayer {
        id: string;
        title: string;
        isDefault: boolean;
        subtitle: string;
        preview: string;
        /** URL pointing to the basemap source. */
        url: string;
        /** Maximum zoom level */
        maxZoom: number;
        /** Minimum zoom level */
        minZoom: number;
        subdomains: string[];
        /** String that is shown on the map, attributing the source of the basemap */
        attribution: string;
        test: string;
        cesium_url: string;
        cesium_maptype: string;
    }
}

declare module csComp.Services {
    var availableZoomLevels: {
        title: string;
        value: number;
    }[];
    interface IMapRenderer {
        init(service: LayerService): any;
        enable(): any;
        disable(): any;
        addGroup(group: ProjectGroup): any;
        addLayer(layer: ProjectLayer): any;
        removeGroup(group: ProjectGroup): any;
        createFeature(feature: IFeature): any;
        removeFeature(feature: IFeature): any;
        updateFeature(feature: IFeature): any;
        addFeature(feature: IFeature): any;
        removeLayer(layer: ProjectLayer): any;
        updateMapFilter(group: ProjectGroup): any;
        changeBaseLayer(layer: BaseLayer): any;
        getZoom(): any;
        fitBounds(bounds: L.LatLngBounds): any;
    }
}
declare module csComp.Services {
    var availableZoomLevels: {
        title: string;
        value: number;
    }[];
    interface IMapRenderer {
        title: string;
        init(service: LayerService): any;
        enable(): any;
        disable(): any;
        addGroup(group: ProjectGroup): any;
        addLayer(layer: ProjectLayer): any;
        removeGroup(group: ProjectGroup): any;
        createFeature(feature: IFeature): any;
        removeFeature(feature: IFeature): any;
        updateFeature(feature: IFeature): any;
        addFeature(feature: IFeature): any;
        removeLayer(layer: ProjectLayer): any;
        updateMapFilter(group: ProjectGroup): any;
        changeBaseLayer(layer: BaseLayer): any;
    }
}

declare module csComp.Services {
    /**
    * Expert level for determining what options to show to the user.
    */
    enum Expertise {
        Beginner = 1,
        Intermediate = 2,
        Expert = 3,
        Admin = 4,
    }
    /**
    * Implement this interface to make your object serializable
    * @see http://stackoverflow.com/a/22886730/319711
    */
    interface ISerializable<T> {
        deserialize(input: Object): T;
    }
    class VisualState {
        leftPanelVisible: boolean;
        rightPanelVisible: boolean;
        dashboardVisible: boolean;
        mapVisible: boolean;
        timelineVisible: boolean;
    }
    class DateRange {
        start: number;
        end: number;
        focus: number;
        range: number;
        zoomLevel: number;
        zoomLevelName: string;
        isLive: boolean;
        static deserialize(input: DateRange): DateRange;
        /**
        * Set the focus time of the timeline, optionally including start and end time.
        */
        setFocus(d: Date, s?: Date, e?: Date): void;
        startDate: () => Date;
        focusDate: () => Date;
        endDate: () => Date;
    }
    /**
     * Represents to the overall solution class. A solution can contain multiple project.
     * This can be usefull when you want to have the same website, but with different content.
     * e.g. you could make it so that you can switch between different regions or different domains of interest.
     */
    class Solution {
        title: string;
        maxBounds: IBoundingBox;
        viewBounds: IBoundingBox;
        baselayers: IBaseLayer[];
        projects: SolutionProject[];
    }
    /** Project within a solution file, refers to a project url*/
    class SolutionProject {
        title: string;
        url: string;
        dynamic: boolean;
    }
    /**
    * Simple class to hold the user privileges.
    */
    interface IPrivileges {
        mca: {
            expertMode: boolean;
        };
        heatmap: {
            expertMode: boolean;
        };
    }
    /** bouding box to specify a region. */
    interface IBoundingBox {
        southWest: L.LatLng;
        northEast: L.LatLng;
    }
    interface ITimelineOptions {
        width?: string;
        height?: string;
        eventMargin?: number;
        eventMarginAxis?: number;
        editable?: boolean;
        layout?: string;
        /** NOTE: For internal use only. Do not set it, as it will be overwritten by the $layerService.currentLocale. */
        locale?: string;
        timeLine?: DateRange;
    }
    /** project configuration. */
    class Project implements ITypesResource, ISerializable<Project> {
        id: string;
        title: string;
        description: string;
        logo: string;
        url: string;
        /** true if a dynamic project and you want to subscribe to project changes using socket.io */
        connected: boolean;
        activeDashboard: Dashboard;
        baselayers: IBaseLayer[];
        featureTypes: {
            [id: string]: IFeatureType;
        };
        propertyTypeData: {
            [id: string]: IPropertyType;
        };
        groups: Array<ProjectGroup>;
        startposition: Coordinates;
        features: IFeature[];
        timeLine: DateRange;
        mcas: Mca.Models.Mca[];
        dashboards: Dashboard[];
        datasources: DataSource[];
        dataSets: DataSet[];
        viewBounds: IBoundingBox;
        userPrivileges: IPrivileges;
        languages: ILanguageData;
        expertMode: Expertise;
        markers: {};
        /**
         * Serialize the project to a JSON string.
         */
        serialize(): string;
        /**
         * Returns an object which contains all the data that must be serialized.
         */
        static serializeableData(project: Project): Object;
        deserialize(input: Project): Project;
    }
}

declare module csComp.Services {
    /** Class containing references to feature & property types */
    interface ITypesResource {
        url: string;
        featureTypes: {
            [id: string]: IFeatureType;
        };
        propertyTypeData: {
            [id: string]: IPropertyType;
        };
    }
    /** Class containing references to feature & property types */
    class TypeResource implements ITypesResource {
        url: string;
        featureTypes: {
            [id: string]: IFeatureType;
        };
        propertyTypeData: {
            [id: string]: IPropertyType;
        };
    }
}

declare module csComp.Helpers {
    interface IDictionary<T> {
        add(key: string, value: T): void;
        remove(key: string): void;
        containsKey(key: string): boolean;
        keys(): string[];
        clear(): void;
        count(): number;
        values(): Array<T>;
    }
    class Dictionary<T> implements IDictionary<T> {
        private theKeys;
        private theValues;
        constructor();
        initialize(init: {
            key: string;
            value: T;
        }[]): void;
        add(key: string, value: any): void;
        remove(key: string): void;
        clear(): void;
        count(): number;
        keys(): string[];
        values(): Array<T>;
        containsKey(key: string): boolean;
        toLookup(): IDictionary<T>;
    }
}

declare module csComp.Helpers {
    interface IGeoFeature {
        type: string;
        geometry: {
            type: string;
            coordinates: Array<number> | Array<Array<number>> | Array<Array<Array<number>>>;
        };
        properties: Object;
    }
    interface IGeoFeatureCollection {
        type: string;
        features: IGeoFeature[];
    }
    /**
    * A set of static geo tools
    * Source: http://www.csgnetwork.com/degreelenllavcalc.html
    */
    class GeoExtensions {
        static getBoundingBox(data: any): any;
        /**
        * Convert topojson data to geojson data.
        */
        static convertTopoToGeoJson(data: any): any;
        static deg2rad(degree: number): number;
        static rad2deg(rad: number): number;
        /**
        * Calculate the log base 10 of val
        */
        static log10(val: any): number;
        static convertDegreesToMeters(latitudeDegrees: number): {
            latitudeLength: number;
            longitudeLength: number;
        };
        /**
         * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
         *
         * @module turf/polygon
         * @category helper
         * @param {Array<Array<Number>>} rings an array of LinearRings
         * @param {Object=} properties a properties object
         * @returns {Feature<Polygon>} a Polygon feature
         * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
         * or if a LinearRing of the Polygon does not have matching Positions at the
         * beginning & end.
         * @example
         * var polygon = createPolygon([[
         *  [-2.275543, 53.464547],
         *  [-2.275543, 53.489271],
         *  [-2.215118, 53.489271],
         *  [-2.215118, 53.464547],
         *  [-2.275543, 53.464547]
         * ]], { name: 'poly1', population: 400});
         *
         * @seealso https://github.com/Turfjs/turf-polygon/blob/master/index.js
         */
        static createPolygonFeature(coordinates: Array<Array<Array<number>>>, properties: Object): IGeoFeature;
        /**
         * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
         *
         * @param {Feature[]} features input features
         * @returns {FeatureCollection} a FeatureCollection of input features
         * @example
         * var features = [
         *  turf.point([-75.343, 39.984], {name: 'Location A'}),
         *  turf.point([-75.833, 39.284], {name: 'Location B'}),
         *  turf.point([-75.534, 39.123], {name: 'Location C'})
         * ];
         *
         * var fc = turf.featurecollection(features);
         *
         * @seealso https://github.com/Turfjs/turf-featurecollection/blob/master/index.js
         */
        static createFeatureCollection(features: IGeoFeature[]): IGeoFeatureCollection;
    }
}

declare module csComp.Helpers {
    /**
     * Serialize an array of type T to a JSON string, by calling the callback on each array element.
     */
    function serialize<T>(arr: Array<T>, callback: (T) => Object): Object[];
    /**
     * Export data to the file system.
     */
    function saveData(data: string, filename: string, fileType: string): void;
    function supportsDataUri(): boolean;
    function standardDeviation(values: number[]): {
        avg: number;
        stdDev: number;
    };
    function average(data: number[]): number;
    /**
     * Collect all the property types that are referenced by a feature type.
     */
    function getPropertyTypes(type: csComp.Services.IFeatureType, propertyTypeData: csComp.Services.IPropertyTypeData): Services.IPropertyType[];
    /**
     * Convert a property value to a display value using the property info.
     */
    function convertPropertyInfo(pt: csComp.Services.IPropertyType, text: any): string;
    /**
    * Set the name of a feature.
    * @param {csComp.Services.IFeature} feature
    */
    function setFeatureName(feature: csComp.Services.IFeature): void;
    /**
    * Convert a feature's stringFormat to a string.
    * @param {Services.IFeature} feature
    * @param {string} stringFormat
    */
    function convertStringFormat(feature: Services.IFeature, stringFormat: string): string;
    /**
    * Get all indexes of the 'find' substring in the 'source' string.
    * @param {string} source
    * @param {string} find
    */
    function indexes(source: string, find: string): number[];
    function getGuid(): string;
    function S4(): string;
    /**
     * Load the features as visible on the map, effectively creating a virtual
     * GeoJSON file that represents all visible items.
     * Also loads the keys into the featuretype's propertyTypeData collection.
     */
    function loadMapLayers(layerService: Services.LayerService): Services.IGeoJsonFile;
    /**
     * Helper function to create content for the RightPanelTab
     * @param  {string} container The container name
     * @param  {string} directive The directive of the container
     * @param  {any}    data      Panel data
     * @return {RightPanelTab}    Returns the RightPanelTab instance. Add it to the
     * rightpanel by publishing it on the MessageBus.
     */
    function createRightPanelTab(container: string, directive: string, data: any, title: string, icon?: string): Services.RightPanelTab;
}

declare module csComp.Helpers {
    class PieData {
        id: number;
        label: string;
        color: string;
        weight: number;
    }
    class AsterPieData extends PieData {
        score: number;
    }
    interface IHistogramOptions {
        id?: string;
        numberOfBins?: number;
        width?: number;
        height?: number;
        xLabel?: string;
        selectedValue?: number;
    }
    interface IMcaPlotOptions extends IHistogramOptions {
        /** Scoring function x,y points */
        xy?: {
            x: number[];
            y: number[];
        };
        /** Value of the feature, i.e. the point that we wish to highlight */
        featureValue?: number;
    }
    class Plot {
        /**
         * Draw a histogram, and, if xy is specified, a line plot of x versus y (e.g. a scoring function).
         */
        static drawHistogram(values: number[], options?: IHistogramOptions): void;
        static getScale(stepSize: number, max: number): number;
        static drawMcaPlot(values: number[], options?: IMcaPlotOptions): void;
        static pieColors: string[];
        /**
        * Draw a Pie chart.
        */
        static drawPie(pieRadius: number, data?: PieData[], parentId?: string, colorScale?: string, svgId?: string): void;
        /**
        * Draw an Aster Pie chart, i.e. a pie chart with varying radius depending on the score, where the maximum score of 100 equals the pie radius.
        * See http://bl.ocks.org/bbest/2de0e25d4840c68f2db1
        */
        static drawAsterPlot(pieRadius: number, data?: AsterPieData[], parentId?: string, colorScale?: string, svgId?: string): void;
        private static clearSvg(svgId);
    }
}

declare module csComp.StringExt {
    function isNullOrEmpty(s: string): boolean;
    /**
     * String formatting
     * 'Added {0} by {1} to your collection'.f(title, artist)
     * 'Your balance is {0} USD'.f(77.7)
     */
    function format(s: string, ...args: string[]): string;
    function isNumber(n: any): boolean;
    function isBoolean(s: any): boolean;
    function isBbcode(s: any): boolean;
}

interface String {
    score(text: string, fuzziness: any): void;
}

declare module csComp.Helpers {
    function getColorFromStringValue(v: string, gs: csComp.Services.GroupStyle): string;
    function getColorFromStringLegend(v: string, l: csComp.Services.Legend): string;
    function getColorFromLegend(v: number, l: csComp.Services.Legend, defaultcolor?: string): string;
    function getColor(v: number, gs: csComp.Services.GroupStyle): string;
    /**
     * Extract a valid color string, without transparency.
     */
    function getColorString(color: string, defaultColor?: string): string;
}

declare module csComp {
    enum FileType {
        Js = 0,
        Css = 1,
    }
    class Utils {
        static loadedFiles: string[];
        /**
        * Load a JavaScript or CSS file dynamically by adding it to the end of the HEAD section in your document.
        * See also: http://www.javascriptkit.com/javatutors/loadjavascriptcss.shtml
        */
        static loadJsCssfile(filename: string, filetype: FileType, callback?: (evt: Event) => void): void;
    }
}

declare module Translations {
    class English {
        static locale: ng.translate.ITranslationTable;
    }
}

declare module Translations {
    class Dutch {
        static locale: ng.translate.ITranslationTable;
    }
}

declare module Charts {
    class ChartHelpers {
        /**
        * Returns the index and value of the maximum.
        */
        static max(arr: number[]): {
            maxIndex: number;
            max: number;
        };
        /**
        * Returns the index and value of the minimum.
        */
        static min(arr: number[]): {
            minIndex: number;
            min: number;
        };
        /**
        * Convert a timestamp to string.
        */
        static timestampToString(ts: number): any;
        static windowResize(fun: any): void;
        static initializeMargin(scope: any, attrs: any): void;
        static getD3Selector(attrs: any, element: any): string;
        static initializeLegendMargin(scope: any, attrs: any): void;
        static defaultColor(): (d: any, i: any) => any;
        static configureLegend(chart: any, scope: any, attrs: any): void;
        static checkElementID(scope: any, attrs: any, element: any, chart: any, data: any): void;
        static updateDimensions(scope: any, attrs: any, element: any, chart: any): void;
    }
}

declare module Charts {
    /**
      * Module
      */
    var myModule: any;
    interface ISparklineScope extends ng.IScope {
        timestamps: number[];
        sensor: number[];
        width?: number;
        height?: number;
        closed?: boolean;
        margin?: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        showaxis?: boolean;
    }
    interface IBarchartScope extends ng.IScope {
        data: number[];
    }
    interface ICircularchartScope extends ng.IScope {
        value: number;
        min: number;
        max: number;
        color?: string;
        titleClass: string;
        title: string;
        valueString: string;
        valueClass: string;
        animationDuration: number;
        width?: number;
        height?: number;
        margin?: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
    }
}

declare module BaseMapList {
    /**
      * Module
      */
    var myModule: any;
}

declare module BaseMapList {
    interface IBaseMapScope extends ng.IScope {
        vm: BaseMapListCtrl;
    }
    class BaseMapListCtrl {
        private $scope;
        private $layerService;
        private $mapService;
        private $messageBusService;
        private scope;
        static $inject: string[];
        constructor($scope: IBaseMapScope, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService);
        selectBaseLayer(key: any): void;
    }
}

declare module Helpers.ContextMenu {
    /**
      * Module
      */
    var myModule: any;
}

declare module DataTable {
    /**
      * Module
      */
    var myModule: any;
}

declare module DataTable {
    import IGeoJsonFile = csComp.Services.IGeoJsonFile;
    import IPropertyType = csComp.Services.IPropertyType;
    interface IDataTableViewScope extends ng.IScope {
        vm: DataTableCtrl;
    }
    /**
     * Represents a field in the table.
     * The value is the actual displayValue shown, the type is the propertyType type (e.g. number or text, useful when aligning the data), and the header is used for sorting.
     */
    class TableField {
        displayValue: string;
        originalValue: any;
        type: string;
        header: string;
        constructor(displayValue: string, originalValue: any, type: string, header: string);
    }
    class DataTableCtrl {
        private $scope;
        private $http;
        private $sce;
        private $translate;
        private $timeout;
        private $layerService;
        private $localStorageService;
        private $messageBusService;
        mapLabel: string;
        dataset: IGeoJsonFile;
        selectedType: csComp.Services.IFeatureType;
        numberOfItems: number;
        selectedLayerId: string;
        layerOptions: Array<any>;
        propertyTypes: Array<IPropertyType>;
        headers: Array<string>;
        sortingColumn: number;
        rows: Array<Array<TableField>>;
        private mapFeatureTitle;
        static $inject: string[];
        constructor($scope: IDataTableViewScope, $http: ng.IHttpService, $sce: ng.ISCEService, $translate: ng.translate.ITranslateService, $timeout: ng.ITimeoutService, $layerService: csComp.Services.LayerService, $localStorageService: ng.localStorage.ILocalStorageService, $messageBusService: csComp.Services.MessageBusService);
        /**
         * Add a label to local storage and bind it to the scope.
         */
        private bindToStorage(label, defaultValue);
        /**
         * Create a list of layer options and select the one used previously.
         */
        private updateLayerOptions();
        private loadLayer();
        /**
         * Load the features as visible on the map.
         */
        private loadMapLayers();
        private updatepropertyType(data);
        toggleSelection(propertyTypeTitle: string): void;
        private findLayerById(id);
        /**
         * Returns the data rows that are relevant for the current selection.
         */
        getRows(): Array<Array<TableField>>;
        /**
         * Generate a font awesome class based on the order.
         */
        sortOrderClass(headerIndex: number, reverseOrder: boolean): string;
        /**
         * Order the rows based on the header index and the order.
         */
        orderBy(headerIndex: number, reverseOrder: boolean): void;
        downloadCsv(): void;
        /**
         * Convert to trusted html string.
         */
        toTrusted(html: string): any;
    }
}

declare module ExpertMode {
    /**
      * Module
      */
    var myModule: any;
}

declare module ExpertMode {
    import Expertise = csComp.Services.Expertise;
    interface IExpertModeScope extends ng.IScope {
        vm: ExpertModeCtrl;
        expertMode: Expertise;
    }
    class ExpertModeCtrl {
        private $scope;
        private $localStorageService;
        private $layerService;
        private $mapService;
        private $messageBus;
        static $inject: string[];
        constructor($scope: IExpertModeScope, $localStorageService: ng.localStorage.ILocalStorageService, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService, $messageBus: csComp.Services.MessageBusService);
        /**
        * Get the CSS class to render the mode.
        */
        getCssClass(): string;
        /**
        * Set the expert mode: although we assume that each directive is responsible for managing it by listening
        * to the expertMode.newExpertise message, we already set some common options here.
        * This is to reduce the dependency on this directive.
        */
        private setExpertMode(expertMode);
    }
}

declare module FeatureList {
    /**
      * Module
      */
    var myModule: any;
}

declare module FeatureList {
    interface IFeatureListScope extends ng.IScope {
        vm: FeatureListCtrl;
        numberOfItems: number;
    }
    class FeatureListCtrl {
        private $scope;
        private $layerService;
        private $mapService;
        private scope;
        static $inject: string[];
        constructor($scope: IFeatureListScope, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService);
    }
}

declare module FeatureProps {
    /**
      * Module
      */
    var myModule: any;
}

declare module FeatureProps {
    import IFeature = csComp.Services.IFeature;
    import IFeatureType = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;
    import IPropertyTypeData = csComp.Services.IPropertyTypeData;
    interface IFeaturePropsScope extends ng.IScope {
        vm: FeaturePropsCtrl;
        showMenu: boolean;
        poi: IFeature;
        callOut: CallOut;
        tabs: JQuery;
        tabScrollDelta: number;
        featureTabActivated(sectionTitle: string, section: CallOutSection): any;
        autocollapse(init: boolean): void;
    }
    interface ICallOutProperty {
        key: string;
        value: string;
        property: string;
        canFilter: boolean;
        canStyle: boolean;
        feature: IFeature;
        description?: string;
        meta?: IPropertyType;
        isFilter: boolean;
    }
    class CallOutProperty implements ICallOutProperty {
        key: string;
        value: string;
        property: string;
        canFilter: boolean;
        canStyle: boolean;
        feature: IFeature;
        isFilter: boolean;
        isSensor: boolean;
        description: string;
        meta: IPropertyType;
        timestamps: number[];
        sensor: number[];
        constructor(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, feature: IFeature, isFilter: boolean, isSensor: boolean, description?: string, meta?: IPropertyType, timestamps?: number[], sensor?: number[]);
    }
    interface ICallOutSection {
        propertyTypes: {
            [label: string]: IPropertyType;
        };
        properties: Array<ICallOutProperty>;
        sectionIcon: string;
        addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, feature: IFeature, isFilter: boolean, description?: string, meta?: IPropertyType): void;
        hasProperties(): boolean;
    }
    class CallOutSection implements ICallOutSection {
        propertyTypes: {
            [label: string]: IPropertyType;
        };
        properties: Array<ICallOutProperty>;
        sectionIcon: string;
        constructor(sectionIcon?: string);
        showSectionIcon(): boolean;
        addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, feature: IFeature, isFilter: boolean, description?: string, meta?: IPropertyType): void;
        hasProperties(): boolean;
    }
    class CallOut {
        private type;
        private feature;
        private propertyTypeData;
        private layerservice;
        title: string;
        icon: string;
        sections: {
            [title: string]: ICallOutSection;
        };
        constructor(type: IFeatureType, feature: IFeature, propertyTypeData: IPropertyTypeData, layerservice: csComp.Services.LayerService);
        private calculateHierarchyValue(mi, feature, propertyTypeData, layerservice);
        sectionCount(): number;
        firstSection(): ICallOutSection;
        lastSection(): ICallOutSection;
        private getOrCreateCallOutSection(sectionTitle);
        /**
         * Set the title of the callout to the title of the feature.
         */
        private setTitle();
        private setIcon(feature);
        static title(type: IFeatureType, feature: IFeature): string;
    }
    class FeaturePropsCtrl {
        private $scope;
        private $location;
        private $sce;
        private $mapService;
        private $layerService;
        private $messageBusService;
        private scope;
        static $inject: string[];
        constructor($scope: IFeaturePropsScope, $location: ng.ILocationService, $sce: ng.ISCEService, $mapService: csComp.Services.MapService, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService);
        toTrusted(html: string): string;
        openLayer(property: FeatureProps.CallOutProperty): void;
        createScatter(property: FeatureProps.CallOutProperty): void;
        /**
         * Callback function
         * @see {http://stackoverflow.com/questions/12756423/is-there-an-alias-for-this-in-typescript}
         * @see {http://stackoverflow.com/questions/20627138/typescript-this-scoping-issue-when-called-in-jquery-callback}
         * @todo {notice the strange syntax using a fat arrow =>, which is to preserve the this reference in a callback!}
         */
        private sidebarMessageReceived;
        private featureMessageReceived;
        private displayFeature(feature);
        private updateHierarchyLinks(feature);
        showSensorData(property: ICallOutProperty): void;
        timestamps: {
            title: string;
            timestamp: number;
        }[];
        showSimpleTimeline: boolean;
        focusTime: string;
        setShowSimpleTimeline(): void;
        setTimestamps(): {
            title: string;
            timestamp: number;
        }[];
        setTime(time: {
            title: string;
            timestamp: number;
        }): void;
    }
}

declare module FeatureRelations {
    /**
      * Module
      */
    var myModule: any;
}

declare module FeatureRelations {
    import IFeature = csComp.Services.IFeature;
    interface IFeatureRelationsScope extends ng.IScope {
        vm: FeatureRelationsCtrl;
        showMenu: boolean;
        poi: IFeature;
        title: string;
        icon: string;
    }
    interface IHierarchySettings {
        referenceList: string[];
    }
    class RelationGroup {
        title: string;
        id: string;
        property: csComp.Services.IPropertyType;
        relations: Relation[];
    }
    class Relation {
        title: string;
        icon: string;
        subject: csComp.Services.IFeature;
        target: csComp.Services.IFeature;
    }
    class FeatureRelationsCtrl {
        private $scope;
        private $location;
        private $sce;
        private $mapService;
        private $layerService;
        private $messageBusService;
        private $translate;
        private scope;
        relations: RelationGroup[];
        showRelations: boolean;
        title: string;
        static $inject: string[];
        selectRelation(relation: Relation): void;
        private createNearbyRelation(f);
        initRelations(): void;
        getRelations(): RelationGroup[];
        constructor($scope: IFeatureRelationsScope, $location: ng.ILocationService, $sce: ng.ISCEService, $mapService: csComp.Services.MapService, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService, $translate: ng.translate.ITranslateService);
        /**
                 * Callback function
                 * @see {http://stackoverflow.com/questions/12756423/is-there-an-alias-for-this-in-typescript}
                 * @see {http://stackoverflow.com/questions/20627138/typescript-this-scoping-issue-when-called-in-jquery-callback}
                 * @todo {notice the strange syntax using a fat arrow =>, which is to preserve the this reference in a callback!}
                 */
        private sidebarMessageReceived;
        private featureMessageReceived;
    }
}

declare module FilterList {
    /**
      * Module
      */
    var myModule: any;
}

declare module FilterList {
    interface IFilterListScope extends ng.IScope {
        vm: FilterListCtrl;
    }
    class FilterListCtrl {
        private $scope;
        private $layerService;
        private scope;
        static $inject: string[];
        constructor($scope: IFilterListScope, $layerService: csComp.Services.LayerService);
    }
}

declare module LanguageSwitch {
    /**
      * Module
      */
    var myModule: any;
}

declare module LanguageSwitch {
    interface ILanguageSwitchScope extends ng.IScope {
        vm: LanguageSwitchCtrl;
    }
    interface ILanguage {
        key: string;
        img: string;
        name: string;
    }
    class LanguageSwitchCtrl {
        private $scope;
        private $translate;
        private $languages;
        private $messageBus;
        private scope;
        language: ILanguage;
        static $inject: string[];
        constructor($scope: ILanguageSwitchScope, $translate: any, $languages: ILanguage[], $messageBus: csComp.Services.MessageBusService);
        switchLanguage(language: ILanguage): void;
    }
}

declare module Heatmap {
    /**
     * Module
     */
    var myModule: ng.IModule;
}

declare module Heatmap {
    import IFeature = csComp.Services.IFeature;
    interface IHeatmapScope extends ng.IScope {
        vm: HeatmapCtrl;
        ratingStates: any;
        projLayer: csComp.Services.ProjectLayer;
    }
    class HeatmapCtrl {
        private $scope;
        private $modal;
        private $translate;
        private $timeout;
        private $localStorageService;
        private $layerService;
        private $mapService;
        private messageBusService;
        private static confirmationMsg1;
        private static confirmationMsg2;
        heatmap: L.GeoJSON;
        heatmapModel: HeatmapModel;
        heatmapModels: HeatmapModel[];
        heatmapSettings: IHeatmapSettings;
        expertMode: boolean;
        moveListenerInitialized: boolean;
        projLayer: csComp.Services.ProjectLayer;
        selectedFeature: IFeature;
        properties: FeatureProps.CallOutProperty[];
        showFeature: boolean;
        showChart: boolean;
        featureIcon: string;
        static $inject: string[];
        constructor($scope: IHeatmapScope, $modal: any, $translate: ng.translate.ITranslateService, $timeout: ng.ITimeoutService, $localStorageService: ng.localStorage.ILocalStorageService, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService, messageBusService: csComp.Services.MessageBusService);
        updateAvailableHeatmaps(): void;
        createHeatmap(): void;
        editHeatmap(heatmap: HeatmapModel): void;
        exportHeatmap(heatmap: HeatmapModel): void;
        removeHeatmap(heatmap: HeatmapModel): void;
        private deleteHeatmap(heatmap);
        /**
         * Show the heat map editor in a modal.
         */
        private showHeatmapEditor(heatmap);
        private scopeApply();
        getVotingClass(hi: IHeatmapItem): string;
        weightUpdated(): void;
        intensityScaleUpdated(): void;
        resolutionUpdated(): void;
        private updateHeatmapWithoutRerendering();
        /**
         * Update the available pre-set heatmaps.
         */
        private updateHeatmap();
        private initializeHeatmap();
    }
}

declare module Heatmap {
    import IGeoJsonFile = csComp.Services.IGeoJsonFile;
    interface IHeatmapEditorScope extends ng.IScope {
        vm: HeatmapEditorCtrl;
    }
    class HeatmapEditorCtrl {
        private $scope;
        private $modalInstance;
        private $layerService;
        private $translate;
        private messageBusService;
        heatmap: HeatmapModel;
        /**
         * A virtual geojson file that represents all useable data for creating a heatmap.
         * @type {IGeoJsonFile}
         */
        dataset: IGeoJsonFile;
        scoringFunctions: ScoringFunction[];
        showItem: number;
        idealDistance: number;
        distanceMaxValue: number;
        lostInterestDistance: number;
        static $inject: string[];
        constructor($scope: IHeatmapEditorScope, $modalInstance: any, $layerService: csComp.Services.LayerService, $translate: ng.translate.ITranslateService, messageBusService: csComp.Services.MessageBusService, heatmap?: HeatmapModel);
        save(): void;
        cancel(): void;
        toggleItemDetails(index: number): void;
    }
}

declare module Heatmap {
    /**
    * A simple interface to describe an item that can be used in a heatmap.
    * We either accept a FeatureType (e.g. Hospital or Shop), or a property that
    * is of type options (e.g. shop, magazine).
    */
    interface IHeatmapItem {
        title: string;
        featureType: csComp.Services.IFeatureType;
        /**
         * In case we are not interested in the feature type itself, but in a certain property,
         * e.g. the property that determines what it represents like buildingFunction.
         * @type {string}
         */
        propertyTitle?: string;
        propertyLabel: string;
        /**
         * When we are using an options property type, such as buildingFunction, we need
         * to indicate the particular option that we will evaluate.
         * @type {number}
         */
        optionIndex?: number;
        /**
         * The user weight specifies how much you like this item, e.g. the maximum value.
         * @type {number}, range [-5..5].
         */
        userWeight: number;
        /**
         * The weight specifies how much you like this item, relative to others.
         * @type {number}, range [-1..1].
         */
        weight: number;
        /**
         * The ideality measure specifies how much you like this item with respect to its
         * distance.
         * @type {IIdealityMeasure}
         */
        idealityMeasure: IIdealityMeasure;
        isSelected?: boolean;
        reset(): void;
        setScale(latitude: number, longitude: number): void;
        calculateHeatspots(feature: csComp.Services.IFeature, cellWidth: number, cellHeight: number, horizCells: number, vertCells: number, mapBounds: L.LatLngBounds, paddingRatio: number): IHeatspot[];
    }
    class HeatmapItem implements IHeatmapItem {
        title: string;
        featureType: csComp.Services.IFeatureType;
        weight: number;
        userWeight: number;
        isSelected: boolean;
        idealityMeasure: IIdealityMeasure;
        propertyTitle: string;
        propertyLabel: string;
        optionIndex: number;
        /**
        * 1 meter represents meterToLatDegree degrees in vertical direction.
        */
        private static meterToLatDegree;
        /**
        * 1 meter represents meterToLonDegree degrees in horizontal direction.
        */
        private static meterToLonDegree;
        heatspots: IHeatspot[];
        private static twoPi;
        constructor(title: string, featureType: csComp.Services.IFeatureType, weight?: number, userWeight?: number, isSelected?: boolean, idealityMeasure?: IIdealityMeasure, propertyTitle?: string, propertyLabel?: string, optionIndex?: number);
        /**
         * Returns an object which contains all the data that must be serialized.
         */
        static serializeableData(i: HeatmapItem): Object;
        calculateHeatspots(feature: csComp.Services.Feature, cellWidth: number, cellHeight: number, horizCells: number, vertCells: number, mapBounds: L.LatLngBounds, paddingRatio: number): IHeatspot[];
        /**
        * Calculate the intensity around the location.
        * NOTE We are performing a relative computation around location (0,0) in a rectangular grid.
        */
        private calculateHeatspot(cellWidth, cellHeight);
        /**
        * Translate the heatspot (at (0,0)) to the actual location.
        */
        private pinHeatspotToGrid(feature, horizCells, vertCells, mapBounds, paddingRatio);
        /**
        * Set the scale to convert a 1x1 meter grid cell to the appropriate number of degrees
        * in vertical and horizontal direction.
        */
        setScale(latitude: number): void;
        select(): void;
        reset(): void;
        toString(): string;
    }
}

declare module Heatmap {
    interface IHeatmapModel {
        title: string;
        id: string;
        heatmapItems: IHeatmapItem[];
        heatmapSettings: IHeatmapSettings;
    }
    class HeatmapModel implements IHeatmapModel {
        title: string;
        heatmapItems: IHeatmapItem[];
        heatmapSettings: IHeatmapSettings;
        id: string;
        intensityGrid: csComp.Services.IProperty[][];
        contributorGrid: csComp.Services.IProperty[][];
        horizCells: number;
        vertCells: number;
        cellWidth: number;
        cellHeight: number;
        dLat: number;
        dLng: number;
        SW: L.LatLng;
        constructor(title: string);
        /**
         * Calculate the heatmap.
         */
        calculate(layerService: csComp.Services.LayerService, mapService: csComp.Services.MapService, heatmap: L.GeoJSON): void;
        drawIntensityGrid(heatmap: L.GeoJSON): void;
        /**
         * Update the weights of all heatmap items.
         */
        updateWeights(): void;
        /**
        * Add a heatmap item to the list of items only in case we don't have it yet.
        */
        addHeatmapItem(heatmapItem: IHeatmapItem): void;
        deserialize(layer: csComp.Services.ProjectLayer): void;
        serialize(): string;
    }
}

declare module Heatmap {
    /**
    * A simple interface to describe heatmapsettings.
    */
    interface IHeatmapSettings {
        referenceList: string[];
        intensityScale: number;
        minZoom: number;
        maxZoom: number;
        resolution: number;
        addReference(reference: string): void;
    }
    class HeatmapSettings implements IHeatmapSettings {
        referenceList: string[];
        minZoom: number;
        maxZoom: number;
        intensityScale: number;
        resolution: number;
        constructor(referenceList?: string[], minZoom?: number, maxZoom?: number, intensityScale?: number, resolution?: number);
        addReference(reference: string): void;
    }
}

declare module Heatmap {
    /**
     * A heat spot represents an lat-lon-point on the map with a certain intensity.
     */
    interface IHeatspot {
        i: number;
        j: number;
        intensity: number;
        contributor: string;
        AddLocation(i: any, j: any, contributor: any): IHeatspot;
    }
    /**
     * A heat spot represents a point on the map with a certain intensity.
     */
    class Heatspot implements IHeatspot {
        i: number;
        j: number;
        intensity: number;
        contributor: string;
        constructor(i: number, j: number, intensity: number, contributor?: string);
        AddLocation(i: any, j: any, contributor: any): Heatspot;
    }
}

declare module Heatmap {
    /**
     * The ideality measure specifies how much you like this item with respect to its
     * distance. For example, if I like a shop to be ideally at 200m of my house, it
     * also means that there is a zone around the shop with a radius of 200m where
     * I would ideally live.
     */
    interface IIdealityMeasure {
        /**
        * The distance with respect to my location where I would like to find the item.
        * @type {number}, in meters
        */
        idealDistance: number;
        /**
        * How happy would I be if the item would be at my location.
        * @type {number}, range [0..1]
        */
        atLocation: number;
        /**
         * At what distance would the item no longer be of value to me.
         * @type {number}, range in meters
         */
        lostInterestDistance: number;
        computeIdealityAtDistance(distance: number): number;
    }
    enum ScoringFunctionType {
        LinearAscendingDescending = 0,
    }
    class ScoringFunction {
        title: string;
        type: ScoringFunctionType;
        scores: string;
        cssClass: string;
        constructor(scoringFunctionType?: ScoringFunctionType);
    }
    class ScoringFunctions {
        static scoringFunctions: ScoringFunctions[];
    }
    class IdealityMeasure implements IIdealityMeasure {
        idealDistance: number;
        atLocation: number;
        lostInterestDistance: number;
        constructor(idealDistance?: number, atLocation?: number, lostInterestDistance?: number);
        computeIdealityAtDistance(distance: number): number;
    }
}

declare module LayersDirective {
    /**
      * Module
      */
    var myModule: any;
}

declare module LayersDirective {
    interface ILayersDirectiveScope extends ng.IScope {
        vm: LayersDirectiveCtrl;
        options: Function;
    }
    class LayersDirectiveCtrl {
        private $scope;
        private $layerService;
        private $messageBusService;
        private $mapService;
        private $dashboardService;
        private scope;
        static $inject: string[];
        constructor($scope: ILayersDirectiveScope, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService, $mapService: csComp.Services.MapService, $dashboardService: csComp.Services.DashboardService);
        editGroup(group: csComp.Services.ProjectGroup): void;
        editLayer(layer: csComp.Services.ProjectLayer): void;
        openLayerMenu(e: any): void;
        toggleLayer(layer: csComp.Services.ProjectLayer): void;
    }
}

declare module Legend {
    /**
      * Module
      */
    var myModule: any;
}

declare module Legend {
    class LegendData {
        propertyTypeKey: string;
        mode: string;
    }
    interface ILegendDirectiveScope extends ng.IScope {
        vm: LegendCtrl;
        data: LegendData;
        legend: csComp.Services.Legend;
    }
    class LegendCtrl {
        private $scope;
        private $layerService;
        private $messageBus;
        private scope;
        private widget;
        private passcount;
        static $inject: string[];
        constructor($scope: ILegendDirectiveScope, $layerService: csComp.Services.LayerService, $messageBus: csComp.Services.MessageBusService);
    }
}

declare module LegendList {
    /**
      * Module
      */
    var myModule: any;
}

declare module LegendList {
    interface ILegendItem {
        title: string;
        uri: string;
    }
    interface ILegendListScope extends ng.IScope {
        vm: LegendListCtrl;
        numberOfItems: number;
        legendItems: ILegendItem[];
    }
    class LegendListCtrl {
        private $scope;
        private $layerService;
        private $mapService;
        private $messageBusService;
        static $inject: string[];
        constructor($scope: ILegendListScope, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService);
        private updateLegendItems();
        private getImageUri(ft);
        private getName(key, ft);
    }
}

declare module Mca.Models {
    import IFeature = csComp.Services.IFeature;
    enum ScoringFunctionType {
        Manual = 0,
        Ascending = 1,
        Descending = 2,
        AscendingSigmoid = 3,
        DescendingSigmoid = 4,
        GaussianPeak = 5,
        GaussianValley = 6,
    }
    /**
    * Scoring function creates a PLA of the scoring algorithm.
    */
    class ScoringFunction {
        title: string;
        type: ScoringFunctionType;
        scores: string;
        cssClass: string;
        constructor(scoringFunctionType?: ScoringFunctionType);
        /**
         * Create a score based on the type, in which x in [0,10] and y in [0.1].
         * Before applying it, you need to scale the x-axis based on your actual range.
         * Typically, you would map x=0 to the min(x)+0.1*range(x) and x(10)-0.1*range(x) to max(x),
         * i.e. x' = ax+b, where a=100/(8r) and b=-100(min+0.1r)/(8r) and r=max-min
         */
        static createScores(type: ScoringFunctionType): string;
    }
    class ScoringFunctions {
        static scoringFunctions: ScoringFunctions[];
    }
    class Criterion {
        title: string;
        description: string;
        /**
        * Top level label will be used to add a property to a feature, mca_LABELNAME, with the MCA value.
        * Lower level children will be used to obtain the property value.
        */
        label: string;
        /** Color of the pie chart */
        color: string;
        /** Specified weight by the user */
        userWeight: number;
        /** Derived weight based on the fact that the sum of weights in a group of criteria needs to be 1. */
        weight: number;
        /** Scoring function y = f(x), which translates a specified measurement x to a value y, where y in [0,1].
         * Format [x1,y1 x2,y2], and may contain special characters, such as min or max to define the minimum or maximum.
         */
        scores: string;
        propValues: number[];
        criteria: Criterion[];
        /** Piece-wise linear approximation of the scoring function by a set of x and y points */
        isPlaUpdated: boolean;
        /** Piece-wise linear approximation must be scaled:x' = ax+b, where a=100/(8r) and b=-100(min+0.1r)/(8r) and r=max-min */
        isPlaScaled: boolean;
        minValue: number;
        maxValue: number;
        minCutoffValue: number;
        maxCutoffValue: number;
        x: number[];
        y: number[];
        deserialize(input: Criterion): Criterion;
        private requiresMinimum();
        private requiresMaximum();
        getTitle(): string;
        /**
         * Update the piecewise linear approximation (PLA) of the scoring (a.k.a. user) function,
         * which translates a property value to a MCA value in the range [0,1] using all features.
         */
        updatePla(features: IFeature[]): void;
        getScore(feature: IFeature): number;
    }
    class Mca extends Criterion implements csComp.Services.ISerializable<Mca> {
        /** Section of the callout */
        section: string;
        stringFormat: string;
        /** Optionally, export the result also as a rank */
        rankTitle: string;
        rankDescription: string;
        /** Optionally, stringFormat for the ranked result */
        rankFormat: string;
        /** Maximum number of star ratings to use to set the weight */
        userWeightMax: number;
        /** Applicable feature ids as a string[]. */
        featureIds: string[];
        scaleMaxValue: number;
        scaleMinValue: number;
        rankLabel: string;
        constructor();
        deserialize(input: Mca): Mca;
        /**
        * Update the MCA by calculating the weights and setting the colors.
        */
        update(): void;
        private calculateWeights(criteria?);
        /** Set the colors of all criteria and sub-criteria */
        private setColors();
    }
}

declare module Mca {
    /**
     * Module
     */
    var myModule: ng.IModule;
}

declare module Mca {
    import IFeature = csComp.Services.IFeature;
    interface IMcaScope extends ng.IScope {
        vm: McaCtrl;
        ratingStates: any;
    }
    class McaCtrl {
        private $scope;
        private $modal;
        private $translate;
        private $timeout;
        private $localStorageService;
        private $layerService;
        private messageBusService;
        private static mcaChartId;
        private static mcas;
        private static confirmationMsg1;
        private static confirmationMsg2;
        features: IFeature[];
        selectedFeature: IFeature;
        properties: FeatureProps.CallOutProperty[];
        showFeature: boolean;
        showChart: boolean;
        featureIcon: string;
        mca: Models.Mca;
        selectedCriterion: Models.Criterion;
        availableMcas: Models.Mca[];
        showAsterChart: boolean;
        showDialog: boolean;
        expertMode: boolean;
        showSparkline: boolean;
        private groupStyle;
        static $inject: string[];
        constructor($scope: IMcaScope, $modal: any, $translate: ng.translate.ITranslateService, $timeout: ng.ITimeoutService, $localStorageService: ng.localStorage.ILocalStorageService, $layerService: csComp.Services.LayerService, messageBusService: csComp.Services.MessageBusService);
        private getVotingClass(criterion);
        private createDummyMca();
        toggleMcaChartType(): void;
        toggleSparkline(): void;
        weightUpdated(criterion: Models.Criterion): void;
        updateMca(criterion?: Models.Criterion): void;
        editMca(mca: Models.Mca): void;
        createMca(): void;
        private showMcaEditor(newMca);
        removeMca(mca: Models.Mca): void;
        private getMcaIndex(mca);
        private addMca(mca);
        private deleteMca(mca);
        private addMcaToLocalStorage(mca);
        private removeMcaFromLocalStorage(mca);
        featureMessageReceived: (title: string, feature: IFeature) => void;
        private scopeApply();
        private updateSelectedFeature(feature, drawCharts?);
        drawChart(criterion?: Models.Criterion): void;
        private getParentOfSelectedCriterion(criterion?);
        private drawHistogram(criterion?);
        private drawAsterPlot(criterion?);
        private drawPieChart(criterion?);
        /**
        * Based on the currently loaded features, which MCA can we use
        */
        updateAvailableMcas(mca?: Models.Mca): void;
        calculateMca(): void;
        private applyPropertyInfoToCriteria(mca, featureType);
        private addPropertyInfo(featureId, mca, forceUpdate?);
        setStyle(item: FeatureProps.CallOutProperty): void;
        private static createPropertyType(mca);
        private static createRankPropertyType(mca);
    }
}

declare module Mca {
    import IFeatureType = csComp.Services.IFeatureType;
    import IGeoJsonFile = csComp.Services.IGeoJsonFile;
    interface IMcaEditorScope extends ng.IScope {
        vm: McaEditorCtrl;
    }
    interface IExtendedPropertyInfo extends csComp.Services.IPropertyType {
        isSelected?: boolean;
        category?: string;
        scores?: string;
        scoringFunctionType?: Models.ScoringFunctionType;
        /** The data is considered invalid when below this value */
        minCutoffValue?: number;
        /** The data is considered invalid when above this value */
        maxCutoffValue?: number;
        userWeight?: number;
    }
    class McaEditorCtrl {
        private $scope;
        private $modalInstance;
        private $layerService;
        private $translate;
        private messageBusService;
        private mca;
        dataset: IGeoJsonFile;
        propInfos: Array<IExtendedPropertyInfo>;
        headers: Array<string>;
        selectedFeatureType: IFeatureType;
        mcaTitle: string;
        rankTitle: string;
        scoringFunctions: Models.ScoringFunction[];
        showItem: number;
        scaleMax: number;
        scaleMin: number;
        static $inject: string[];
        constructor($scope: IMcaEditorScope, $modalInstance: any, $layerService: csComp.Services.LayerService, $translate: ng.translate.ITranslateService, messageBusService: csComp.Services.MessageBusService, mca?: Models.Mca);
        private updatePropertyInfoUponEdit(criterion, category?);
        loadPropertyTypes(): void;
        private selectFirstFeatureType();
        private updatePropertyInfo(featureType);
        toggleSelection(metaInfoTitle: string): void;
        isDisabled(): boolean;
        /**
         * Create a new MCA criterion
         */
        save(): void;
        cancel(): void;
        toggleItemDetails(index: number): void;
    }
}

declare module MapElement {
    /**
      * Module
      */
    var myModule: any;
}

declare module MapElement {
    interface IMapElementScope extends ng.IScope {
        vm: MapElementCtrl;
        mapid: string;
        initMap: Function;
    }
    class MapElementCtrl {
        private $scope;
        private $layerService;
        private mapService;
        private $messageBusService;
        private scope;
        private locale;
        static $inject: string[];
        constructor($scope: IMapElementScope, $layerService: csComp.Services.LayerService, mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService);
        initMap(): void;
    }
}

declare module OfflineSearch {
    /**
      * Module
      */
    var myModule: any;
}

declare module OfflineSearch {
    interface IProjectLocation {
        title: string;
        url: string;
    }
    /**
     * The name of the property you include in generating the offline search result.
     */
    interface IPropertyType {
        /**
         * Name of the property
         * @type {string}
         */
        name: string;
        /**
         * The title of the property.
         * @type {string}
         */
        title: string;
        /**
         * Language information for localisation.
         * @type {f.ILanguageData}
         */
        languages?: csComp.Services.ILanguageData;
    }
    /**
     * Specify the offline search options.
     */
    interface IOfflineSearchOptions {
        /**
         * Words you wish to exclude from the index.
         * @type {string[]}
         */
        stopWords: string[];
        /**
         * The property types that you wish to use for generating the index.
         * @type {osr.PropertyType}
         */
        propertyTypes: IPropertyType[];
    }
    class Layer {
        groupTitle: string;
        index: number;
        id: string;
        title: string;
        path: string;
        type: string;
        /**
         * Names of all the features.
         * @type {string[]}
         */
        featureNames: string[];
        constructor(groupTitle: string, index: number, id: string, title: string, path: string, type: string);
    }
    /**
     * An index entry that contains a search result.
     */
    class Entry {
        private v;
        constructor(layerIndexOrArray: Array<number> | number, featureIndex?: number, propertyIndex?: number);
        layerIndex: number;
        featureIndex: number;
        /**
         * This function is called when serializing the Entry object to JSON, which is
         * much less verbose than the default JSON. In the constructor, I've used a
         * Union type to deserialize it again.
         */
        toJSON(): number[];
    }
    class KeywordIndex {
        [key: string]: Entry[];
    }
    class OfflineSearchResult {
        project: IProjectLocation;
        options: IOfflineSearchOptions;
        layers: Layer[];
        keywordIndex: KeywordIndex;
        constructor(project: IProjectLocation, options: IOfflineSearchOptions);
    }
}

declare module OfflineSearch {
    interface IOfflineSearchScope extends ng.IScope {
        vm: OfflineSearchCtrl;
    }
    interface ILookupResult {
        title?: string;
        score: number;
        key: string;
        entries: Entry[];
    }
    class OfflineSearchResultViewModel {
        title: string;
        layerTitle: string;
        groupTitle: string;
        entry: Entry;
        firstInGroup: boolean;
        constructor(title: string, layerTitle: string, groupTitle: string, entry: Entry);
        toString(): string;
        fullTitle: string;
    }
    class OfflineSearchCtrl {
        private $scope;
        private $layerService;
        private $mapService;
        private $messageBus;
        private offlineSearchResult;
        searchText: string;
        isReady: boolean;
        static $inject: string[];
        constructor($scope: IOfflineSearchScope, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService, $messageBus: csComp.Services.MessageBusService);
        /**
         * Load the offline search results (json file).
         */
        private loadSearchResults(url);
        /**
         * Get the locations based on the entered text.
         */
        getLocation(text: string, resultCount?: number): OfflineSearchResultViewModel[];
        /**
         * Merge the resuls of two keyword lookups by checking whether different entries refer
         * to the same layer and feature.
         * @result1 {ILookupResult[]}
         * @result2 {ILookupResult[]}
         */
        private mergeResults(result1, result2);
        /**
         * Do a fuzzy keyword comparison between the entered text and the list of keywords,
         * and return a subset.
         * @text: {string}
         */
        private getKeywordHits(text);
        /**
         * When an item is selected, optionally open the layer and jump to the selected feature.
         */
        onSelect(selectedItem: OfflineSearchResultViewModel): void;
        private selectFeature(layerId, featureIndex);
    }
}

declare module ProjectHeaderSelection {
    /**
      * Module
      */
    var myModule: any;
}

declare module ProjectHeaderSelection {
    interface IProjectHeaderSelectionScope extends ng.IScope {
        vm: ProjectHeaderSelectionCtrl;
    }
    class ProjectHeaderSelectionCtrl {
        private $scope;
        $layerService: csComp.Services.LayerService;
        $dashboardService: csComp.Services.DashboardService;
        private $mapService;
        $messageBusService: csComp.Services.MessageBusService;
        scope: any;
        project: csComp.Services.SolutionProject;
        static $inject: string[];
        constructor($scope: any, $layerService: csComp.Services.LayerService, $dashboardService: csComp.Services.DashboardService, $mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService);
    }
}

declare module ProjectSettings {
    /**
      * Module
      */
    var myModule: any;
}

declare module ProjectSettings {
    interface IProjectSettingsScope extends ng.IScope {
        vm: ProjectSettingsCtrl;
    }
    class ProjectSettingsCtrl {
        private $scope;
        private $modal;
        private $timeout;
        private $layerService;
        private scope;
        static $inject: string[];
        constructor($scope: IProjectSettingsScope, $modal: any, $timeout: ng.ITimeoutService, $layerService: csComp.Services.LayerService);
        saveSettings(): void;
    }
}

declare module Helpers.Resize {
    /**
      * Module
      */
    var myModule: any;
}

declare module ShowModal {
    /**
      * Module
      */
    var myModule: any;
}

declare module StyleList {
    /**
      * Module
      */
    var myModule: any;
}

declare module StyleList {
    interface IStyleListScope extends ng.IScope {
        vm: StyleListCtrl;
    }
    class StyleListCtrl {
        private $scope;
        private $layerService;
        private scope;
        static $inject: string[];
        constructor($scope: IStyleListScope, $layerService: csComp.Services.LayerService);
    }
}

declare module Voting {
    /**
      * Module
      */
    var myModule: any;
}

declare module Timeline {
    interface ITimelineService {
        getTimelineOptions(): csComp.Services.ITimelineOptions;
        setTimelineOptions(options: csComp.Services.ITimelineOptions): void;
    }
    /**
      * Module
      */
    var myModule: any;
}

declare module Timeline {
    interface ITimelineScope extends ng.IScope {
        vm: TimelineCtrl;
        numberOfItems: number;
        timeline: any;
    }
    class TimelineCtrl {
        private $scope;
        private $layerService;
        private $mapService;
        private $messageBusService;
        private TimelineService;
        private scope;
        private locale;
        static $inject: string[];
        focusDate: Date;
        line1: string;
        line2: string;
        startDate: Date;
        endDate: Date;
        timer: any;
        isPlaying: boolean;
        showControl: boolean;
        isPinned: boolean;
        constructor($scope: ITimelineScope, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService, TimelineService: Timeline.ITimelineService);
        private initTimeline();
        updateDragging(): void;
        onRangeChanged(properties: any): void;
        start(): void;
        toggleLive(): void;
        myTimer(): void;
        mouseEnter(): void;
        mouseLeave(): void;
        pinToNow(): void;
        stop(): void;
        updateFocusTime(): void;
        /**
        * Load the locales: instead of loading them from the original timeline-locales.js distribution,
        * add them here so you don't need to add another js dependency.
        * @seealso: http://almende.github.io/chap-links-library/downloads.html
        */
        loadLocales(): void;
    }
}

declare module csComp.Services {
    interface IMessageBusCallback {
        (title: string, data?: any): any;
    }
    class MessageBusHandle {
        constructor(topic: string, callback: IMessageBusCallback);
        topic: string;
        callback: IMessageBusCallback;
    }
    interface IBaseEvent {
        add(listener: () => void): void;
        remove(listener: () => void): void;
        trigger(...a: any[]): void;
    }
    class TypedEvent implements IBaseEvent {
        private _listeners;
        add(listener: () => void): void;
        remove(listener?: () => void): void;
        trigger(...a: any[]): void;
    }
    interface IMessageEvent extends IBaseEvent {
        add(listener: (message: string) => void): void;
        remove(listener: (message: string) => void): void;
        trigger(message: string): void;
    }
    class Connection {
        id: string;
        url: string;
        isConnected: boolean;
        isConnecting: boolean;
        cache: {
            [topic: string]: Array<IMessageBusCallback>;
        };
        subscriptions: {
            [id: string]: ServerSubscription;
        };
        socket: any;
        events: IMessageEvent;
        constructor(id: string, url: string);
        unsubscribe(id: string, callback: IMessageBusCallback): void;
        reSubscribeAll(): void;
        subscribe(target: string, type: string, callback: IMessageBusCallback): ServerSubscription;
        connect(callback: Function): void;
        disconnect(): void;
    }
    enum NotifyLocation {
        BottomRight = 0,
        BottomLeft = 1,
        TopRight = 2,
        TopLeft = 3,
    }
    class ServerSubscription {
        target: string;
        type: string;
        callbacks: Array<IMessageBusCallback>;
        id: string;
        serverCallback: any;
        constructor(target: string, type: string);
    }
    /**
     * Simple message bus service, used for subscribing and unsubsubscribing to topics.
     * @see {@link https://gist.github.com/floatingmonkey/3384419}
     */
    class MessageBusService {
        private $translate;
        private static cache;
        static $inject: string[];
        private connections;
        constructor($translate: ng.translate.ITranslateService);
        getConnection(id: string): Connection;
        initConnection(id: string, url: string, callback: Function): void;
        serverPublish(topic: string, message: any, serverId?: string): any;
        serverSubscribe(target: string, type: string, callback: IMessageBusCallback, serverId?: string): MessageBusHandle;
        serverUnsubscribe(handle: MessageBusHandle, serverId?: string): any;
        /**
         * Publish a notification that needs to be translated
         * @title:       the translation key of the notification's title
         * @text:        the translation key of the notification's content
         * @location:    the location on the screen where the notification is shown (default bottom right)
         */
        notifyWithTranslation(title: string, text: string, location?: NotifyLocation): void;
        /**
         * Publish a notification
         * @title:       the title of the notification
         * @text:        the contents of the notification
         * @location:    the location on the screen where the notification is shown (default bottom right)
         */
        notify(title: string, text: string, location?: NotifyLocation): void;
        /**
         * Show a confirm dialog
         * @title           : the title of the notification
         * @text            : the contents of the notification
         * @callback        : the callback that will be called after the confirmation has been answered.
         */
        confirm(title: string, text: string, callback: (result: boolean) => any): void;
        notifyBottom(title: string, text: string): void;
        /**
         * Publish a notification
         * @title: the title of the notification
         * @text:  the contents of the notification
         */
        notifyData(data: any): void;
        /**
         * Publish to a topic
         */
        publish(topic: string, title: string, data?: any): void;
        /**
         * Subscribe to a topic
         * @param {string} topic The desired topic of the message.
         * @param {IMessageBusCallback} callback The callback to call.
         */
        subscribe(topic: string, callback: IMessageBusCallback): MessageBusHandle;
        /**
         * Unsubscribe to a topic by providing its handle
         */
        unsubscribe(handle: MessageBusHandle): void;
    }
    class EventObj {
        myEvents: any;
        bind(event: any, fct: any): void;
        unbind(event: any, fct: any): void;
        unbindEvent(event: any): void;
        unbindAll(): void;
        trigger(event: any, ...args: any[]): void;
        registerEvent(evtname: string): void;
        registerEvents(evtnames: Array<string>): void;
    }
    /**
      * Module
      */
    var myModule: any;
}

declare module csComp.Services {
    class ConnectionService {
        private $messageBusService;
        private $layerService;
        static $inject: string[];
        constructor($messageBusService: Services.MessageBusService, $layerService: Services.LayerService);
    }
}

declare module csComp.Services {
    interface ILayerSource {
        title: string;
        service: ILayerService;
        addLayer(layer: ProjectLayer, callback: Function): any;
        removeLayer(layer: ProjectLayer): void;
        refreshLayer(layer: ProjectLayer): void;
        requiresLayer: boolean;
        getRequiredLayers?(layer: ProjectLayer): ProjectLayer[];
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
    }
    interface ILayerService {
        title: string;
        accentColor: string;
        solution: Solution;
        project: Project;
        maxBounds: IBoundingBox;
        findLayer(id: string): ProjectLayer;
        findLoadedLayer(id: string): ProjectLayer;
        currentLocale: string;
        activeMapRenderer: IMapRenderer;
        mb: Services.MessageBusService;
        map: Services.MapService;
        layerGroup: L.LayerGroup<L.ILayer>;
        featureTypes: {
            [key: string]: Services.IFeatureType;
        };
        propertyTypeData: {
            [key: string]: Services.IPropertyType;
        };
        timeline: any;
    }
    class LayerService implements ILayerService {
        private $location;
        $compile: any;
        private $translate;
        $messageBusService: Services.MessageBusService;
        $mapService: Services.MapService;
        $rootScope: any;
        maxBounds: IBoundingBox;
        title: string;
        accentColor: string;
        mb: Services.MessageBusService;
        map: Services.MapService;
        featureTypes: {
            [key: string]: IFeatureType;
        };
        propertyTypeData: {
            [key: string]: IPropertyType;
        };
        project: Project;
        projectUrl: SolutionProject;
        solution: Solution;
        dimension: any;
        noFilters: boolean;
        noStyles: boolean;
        lastSelectedFeature: IFeature;
        selectedLayerId: string;
        timeline: any;
        currentLocale: string;
        loadedLayers: Helpers.Dictionary<ProjectLayer>;
        layerGroup: L.LayerGroup<L.ILayer>;
        info: L.Control;
        layerSources: {
            [key: string]: ILayerSource;
        };
        mapRenderers: {
            [key: string]: IMapRenderer;
        };
        activeMapRenderer: IMapRenderer;
        typesResources: {
            [key: string]: ITypesResource;
        };
        visual: VisualState;
        static $inject: string[];
        constructor($location: ng.ILocationService, $compile: any, $translate: ng.translate.ITranslateService, $messageBusService: Services.MessageBusService, $mapService: Services.MapService, $rootScope: any);
        /**
         * Initialize the available layer sources
         */
        private initLayerSources();
        private removeSubLayers(feature);
        /**
        check for every feature (de)select if layers should automatically be activated
        */
        private checkFeatureSubLayers();
        loadRequiredLayers(layer: ProjectLayer): void;
        addLayer(layer: ProjectLayer): void;
        loadTypeResources(layer: ProjectLayer, callback: Function): void;
        initTypeResources(source: ITypesResource): void;
        checkLayerLegend(layer: ProjectLayer, property: string): void;
        /**
         * Check whether we need to enable the timer to refresh the layer.
         */
        private checkLayerTimer(layer);
        removeStyle(style: GroupStyle): void;
        updatePropertyStyle(k: string, v: any, parent: any): void;
        updateStyle(style: GroupStyle): void;
        private updateGroupFeatures(group);
        updateFeatureTypes(featureType: IFeatureType): void;
        selectRenderer(renderer: string): void;
        getPropertyTypes(fType: IFeatureType): IPropertyType[];
        selectFeature(feature: IFeature): void;
        updateSensorData(): void;
        /***
         * get list of properties that are part of the filter collection
         */
        private filterProperties(group);
        /**
         * init feature (add to feature list, crossfilter)
         */
        initFeature(feature: IFeature, layer: ProjectLayer): IFeatureType;
        removeFeature(feature: IFeature): void;
        /**
        * Calculate the effective feature style.
        */
        calculateFeatureStyle(feature: IFeature): void;
        /**
        * Initialize the feature type and its property types by setting default property values, and by localizing it.
        */
        private initFeatureType(ft);
        /**
        * Initialize the property type with default values, and, if applicable, localize it.
        */
        private initPropertyType(pt);
        /**
        * Set default PropertyType's properties:
        * type              = text
        * visibleInCallout  = true
        * canEdit           = false
        * isSearchable      = true
        */
        private setDefaultPropertyType(pt);
        private localizePropertyType(pt);
        /**
         * find a filter for a specific group/property combination
         */
        private findFilter(group, property);
        /**
         * Find a feature by layerId and FeatureId.
         * @layerId {string}
         * @featureIndex {number}
         */
        findFeatureById(layerId: string, featureIndex: number): IFeature;
        /**
         * Find a group by id
         */
        findGroupById(id: string): ProjectGroup;
        /**
         * Find the feature by name.
         */
        findFeatureByName(name: string): IFeature;
        /**
        * Find a loaded layer with a specific id.
        */
        findLoadedLayer(id: string): ProjectLayer;
        /**
         * Find a layer with a specific id.
         */
        findLayer(id: string): ProjectLayer;
        /**
         * Creates a GroupStyle based on a property and adds it to a group.
         * If the group already has a style which contains legends, those legends are copied into the newly created group.
         * Already existing groups (for the same visualAspect) are replaced by the new group
         */
        setStyle(property: any, openStyleTab?: boolean, customStyleInfo?: PropertyInfo): GroupStyle;
        /**
         * checks if there are other styles that affect the same visual aspect, removes them (it)
         * and then adds the style to the group's styles
         */
        private saveStyle(group, style);
        addFilter(group: ProjectGroup, prop: string): void;
        /**
         * enable a filter for a specific property
         */
        setFilter(filter: GroupFilter, group: csComp.Services.ProjectGroup): void;
        /**
        * enable a filter for a specific property
        */
        setPropertyFilter(property: FeatureProps.CallOutProperty): void;
        /**
         * Return the feature style for a specific feature.
         * First, look for a layer specific feature type, otherwise, look for a project-specific feature type.
         * In case both fail, create a default feature type at the layer level.
         */
        getFeatureType(feature: IFeature): IFeatureType;
        /**
         * In case we are dealing with a regular JSON file without type information, create a default type.
         */
        private createDefaultType(feature);
        resetFilters(): void;
        private getGroupFeatures(g);
        rebuildFilters(g: ProjectGroup): void;
        /**
         * deactivate layer
         */
        removeLayer(layer: ProjectLayer, removeFromGroup?: boolean): void;
        /***
         * Open solution file with references to available baselayers and projects
         * @params url: URL of the solution
         * @params layers: Optionally provide a semi-colon separated list of layer IDs that should be opened.
         * @params initialProject: Optionally provide a project name that should be loaded, if omitted the first project in the definition will be loaded
         */
        openSolution(url: string, layers?: string, initialProject?: string): void;
        /**
        * Clear all layers.
        */
        private clearLayers();
        /**
         * Open project
         * @params url: URL of the project
         * @params layers: Optionally provide a semi-colon separated list of layer IDs that should be opened.
         */
        openProject(solutionProject: csComp.Services.SolutionProject, layers?: string): void;
        removeGroup(group: ProjectGroup): void;
        /** initializes project group (create crossfilter index, clustering, initializes layers) */
        initGroup(group: ProjectGroup, layerIds?: string[]): void;
        /** initializes a layer (check for id, language, references group, add to active map renderer) */
        initLayer(group: ProjectGroup, layer: ProjectLayer, layerIds?: string[]): void;
        checkDataSourceSubscriptions(ds: DataSource): void;
        checkSubscriptions(): void;
        closeProject(): void;
        findSensorSet(key: string, callback: Function): any;
        /**
         * Calculate min/max/count for a specific property in a group
         */
        calculatePropertyInfo(group: ProjectGroup, property: string): PropertyInfo;
        updateFilterGroupCount(group: ProjectGroup): void;
        private addScatterFilter(group, filter);
        /***
         * Update map markers in cluster after changing filter
         */
        updateMapFilter(group: ProjectGroup): void;
        resetMapFilter(group: ProjectGroup): void;
    }
    /**
      * Module
      */
    var myModule: any;
}

declare module csComp.Services {
    class RightPanelTab {
        title: string;
        container: string;
        directive: string;
        data: any;
        icon: string;
    }
    class DashboardService {
        private $rootScope;
        private $compile;
        private $location;
        private $translate;
        private $messageBusService;
        private $layerService;
        private $mapService;
        maxBounds: IBoundingBox;
        featureDashboard: csComp.Services.Dashboard;
        mainDashboard: csComp.Services.Dashboard;
        editMode: boolean;
        activeWidget: IWidget;
        dashboards: any;
        widgetTypes: {
            [key: string]: IWidget;
        };
        socket: any;
        editWidgetMode: boolean;
        init(): void;
        static $inject: string[];
        constructor($rootScope: any, $compile: any, $location: ng.ILocationService, $translate: ng.translate.ITranslateService, $messageBusService: Services.MessageBusService, $layerService: Services.LayerService, $mapService: Services.MapService);
        selectDashboard(dashboard: csComp.Services.Dashboard, container: string): void;
        addNewWidget(widget: IWidget, dashboard: Dashboard): IWidget;
        updateWidget(widget: csComp.Services.IWidget): void;
        addWidget(widget: IWidget): IWidget;
        activateTab(tab: RightPanelTab): void;
        deactivateTab(tab: RightPanelTab): void;
        editWidget(widget: csComp.Services.IWidget): void;
        stopEditWidget(): void;
        removeWidget(): void;
    }
    /**
      * Module
      */
    var myModule: any;
}

declare module csComp.Services {
    interface IMapLayersScope extends ng.IScope {
        map: L.Map;
        vm: MapCtrl;
    }
    class MapCtrl {
        private $scope;
        private $location;
        private $mapService;
        static $inject: string[];
        constructor($scope: IMapLayersScope, $location: ng.ILocationService, $mapService: MapService);
    }
}

declare module csComp.Services {
    class MapService {
        private $localStorageService;
        private $timeout;
        private $messageBusService;
        private static expertModeKey;
        static $inject: string[];
        map: L.Map;
        baseLayers: any;
        activeBaseLayer: BaseLayer;
        mapVisible: boolean;
        timelineVisible: boolean;
        rightMenuVisible: boolean;
        maxBounds: L.LatLngBounds;
        expertMode: Expertise;
        constructor($localStorageService: ng.localStorage.ILocalStorageService, $timeout: ng.ITimeoutService, $messageBusService: csComp.Services.MessageBusService);
        /**
      * The expert mode can either be set manually, e.g. using this directive, or by setting the expertMode property in the
      * project.json file. In neither are set, we assume that we are dealing with an expert, so all features should be enabled.
      *
      * Precedence:
      * - when a declaration is absent, assume Expert.
      * - when the mode is set in local storage, take that value.
      * - when the mode is set in the project.json file, take that value.
      */
        private initExpertMode();
        isExpert: boolean;
        isIntermediate: boolean;
        isAdminExpert: boolean;
        initMap(): void;
        getBaselayer(layer: string): BaseLayer;
        changeBaseLayer(layer: string): void;
        invalidate(): void;
        /**
         * Zoom to a location on the map.
         */
        zoomToLocation(center: L.LatLng, zoomFactor?: number): void;
        /**
         * Zoom to a feature on the map.
         */
        zoomTo(feature: IFeature, zoomLevel?: number): void;
        /**
         * Compute the bounding box.
         * Returns [min_x, max_x, min_y, max_y]
         */
        private getBoundingBox(arr);
        getMap(): L.Map;
    }
    /**
      * Module
      */
    var myModule: any;
}

declare module csComp.Search {
    interface ISearchFormScope extends ng.IScope {
        vm: SearchFormCtrl;
        location: L.LatLng;
    }
    class SearchFormCtrl {
        private $scope;
        private $mapService;
        static $inject: string[];
        constructor($scope: ISearchFormScope, $mapService: csComp.Services.MapService);
        doSearch(): void;
    }
}

declare module csComp.Services {
    class TimeService {
        private $messageBusService;
        static $inject: string[];
        map: L.Map;
        baseLayers: any;
        private activeBaseLayer;
        constructor($messageBusService: csComp.Services.MessageBusService);
    }
}

declare module Dashboard {
    /**
      * Module
      */
    var myModule: any;
}

declare module Dashboard {
    interface IDashboardScope extends ng.IScope {
        vm: DashboardCtrl;
        gridsterOptions: any;
        dashboard: csComp.Services.Dashboard;
        container: string;
        param: any;
        initDashboard: Function;
        minus: Function;
    }
    interface IWidgetScope extends ng.IScope {
        data: any;
    }
    class DashboardCtrl {
        private $scope;
        private $compile;
        private $layerService;
        private $mapService;
        private $messageBusService;
        private $dashboardService;
        private $templateCache;
        private scope;
        private project;
        static $inject: string[];
        constructor($scope: IDashboardScope, $compile: any, $layerService: csComp.Services.LayerService, $mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService, $dashboardService: csComp.Services.DashboardService, $templateCache: any);
        toggleWidget(widget: csComp.Services.IWidget): void;
        updateWidget(w: csComp.Services.IWidget): void;
        checkMap(): void;
        checkLayers(): void;
        checkViewbound(): void;
        checkTimeline(): void;
        isReady(widget: csComp.Services.IWidget): void;
        updateDashboard(): void;
    }
}

declare module DashboarHeaderdSelection {
    /**
      * Module
      */
    var myModule: any;
}

declare module DashboarHeaderdSelection {
    interface IDashboardHeaderSelectionScope extends ng.IScope {
        vm: any;
        addWidget: Function;
        title: string;
    }
    class DashboardHeaderSelectionCtrl {
        private $scope;
        private $layerService;
        $dashboardService: csComp.Services.DashboardService;
        private $mapService;
        $messageBusService: csComp.Services.MessageBusService;
        scope: any;
        project: csComp.Services.SolutionProject;
        static $inject: string[];
        constructor($scope: any, $layerService: csComp.Services.LayerService, $dashboardService: csComp.Services.DashboardService, $mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService);
    }
}

declare module DashboardSelection {
    /**
      * Module
      */
    var myModule: any;
}

declare module DashboardSelection {
    interface IDashboardSelectionScope extends ng.IScope {
        vm: any;
        addWidget: Function;
        title: string;
    }
    class DashboardSelectionCtrl {
        private $scope;
        private $layerService;
        $dashboardService: csComp.Services.DashboardService;
        private $mapService;
        private $messageBusService;
        scope: any;
        project: csComp.Services.SolutionProject;
        activeWidget: csComp.Services.BaseWidget;
        static $inject: string[];
        constructor($scope: any, $layerService: csComp.Services.LayerService, $dashboardService: csComp.Services.DashboardService, $mapService: csComp.Services.MapService, $messageBusService: csComp.Services.MessageBusService);
        startWidgetEdit(widget: csComp.Services.BaseWidget): void;
        /***
        Start editing a specific dashboard
        */
        startDashboardEdit(dashboard: csComp.Services.Dashboard): void;
        /***
        Stop editing a specific dashboard
        */
        stopDashboardEdit(dashboard: csComp.Services.Dashboard): void;
        stopEdit(): void;
        startEdit(): void;
        widgetHighlight(widget: csComp.Services.BaseWidget): void;
        widgetStopHighlight(widget: csComp.Services.BaseWidget): void;
        /** Add new dashboard */
        addDashboard(widget: csComp.Services.IWidget): void;
        /** Remove existing dashboard */
        removeDashboard(key: string): void;
        /** publish a message that a new dashboard was selected */
        private publishDashboardUpdate();
        /** Select an active dashboard */
        selectDashboard(dashboard: csComp.Services.Dashboard): void;
    }
}

declare module DashboardEdit {
    /**
      * Module
      */
    var myModule: any;
}

declare module DashboardEdit {
    interface IDashboardEditScope extends ng.IScope {
        vm: DashboardEditCtrl;
    }
    class DashboardEditCtrl {
        private $scope;
        private $mapService;
        private $layerService;
        private $messageBusService;
        private $dashboardService;
        private scope;
        dashboard: csComp.Services.Dashboard;
        static $inject: string[];
        constructor($scope: IDashboardEditScope, $mapService: csComp.Services.MapService, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService, $dashboardService: csComp.Services.DashboardService);
        toggleTimeline(): void;
        toggleMap(): void;
        checkMap(): void;
        checkTimeline(): void;
    }
}

declare module WidgetEdit {
    /**
      * Module
      */
    var myModule: any;
}

declare module WidgetEdit {
    interface IWidgetEditScope extends ng.IScope {
        vm: WidgetEditCtrl;
    }
    class WidgetEditCtrl {
        private $scope;
        private $mapService;
        private $layerService;
        private $messageBusService;
        private $dashboardService;
        private scope;
        static $inject: string[];
        constructor($scope: IWidgetEditScope, $mapService: csComp.Services.MapService, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService, $dashboardService: csComp.Services.DashboardService);
    }
}

declare module FeatureTypes {
    /**
      * Module
      */
    var myModule: any;
}

declare module FeatureTypes {
    interface IFeatureTypesScope extends ng.IScope {
        vm: FeatureTypesCtrl;
    }
    class FeatureTypesCtrl {
        private $scope;
        private $layerService;
        private $messageBusService;
        private scope;
        selectedResourceUrl: string;
        selectedResource: csComp.Services.ITypesResource;
        static $inject: string[];
        constructor($scope: IFeatureTypesScope, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService);
        updateFeatureTypes(ft: csComp.Services.IFeatureType): void;
        selectResource(): void;
    }
}

declare module LayerEdit {
    /**
      * Module
      */
    var myModule: any;
}

declare module LayerEdit {
    interface ILayerEditScope extends ng.IScope {
        vm: LayerEditCtrl;
    }
    class LayerEditCtrl {
        private $scope;
        private $mapService;
        private $layerService;
        private $messageBusService;
        private $dashboardService;
        private scope;
        layer: csComp.Services.ProjectLayer;
        static $inject: string[];
        constructor($scope: ILayerEditScope, $mapService: csComp.Services.MapService, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService, $dashboardService: csComp.Services.DashboardService);
        addLayer(): void;
    }
}

declare module GroupEdit {
    /**
      * Module
      */
    var myModule: any;
}

declare module GroupEdit {
    interface IGroupEditScope extends ng.IScope {
        vm: GroupEditCtrl;
        group: csComp.Services.ProjectGroup;
    }
    class GroupEditCtrl {
        private $scope;
        private $mapService;
        private $layerService;
        private $messageBusService;
        private $dashboardService;
        private scope;
        noLayerSelected: boolean;
        static $inject: string[];
        constructor($scope: IGroupEditScope, $mapService: csComp.Services.MapService, $layerService: csComp.Services.LayerService, $messageBusService: csComp.Services.MessageBusService, $dashboardService: csComp.Services.DashboardService);
        updateLayers(): void;
        addLayer(): void;
        toggleClustering(): void;
    }
}

declare module Filters {
    interface IBarFilterScope extends ng.IScope {
        vm: BarFilterCtrl;
        filter: csComp.Services.GroupFilter;
        options: Function;
        editMode: boolean;
    }
    class BarFilterCtrl {
        $scope: IBarFilterScope;
        private $layerService;
        private $messageBus;
        private $timeout;
        private scope;
        private widget;
        static $inject: string[];
        constructor($scope: IBarFilterScope, $layerService: csComp.Services.LayerService, $messageBus: csComp.Services.MessageBusService, $timeout: ng.ITimeoutService);
        private displayFilterRange(min, max);
        private dcChart;
        initBarFilter(): void;
        private updateFilter();
        updateRange(): void;
        remove(): void;
    }
}

declare module Filters {
    interface IDateFilterScope extends ng.IScope {
        vm: DateFilterCtrl;
        filter: csComp.Services.GroupFilter;
    }
    class DateFilterCtrl {
        $scope: IDateFilterScope;
        private $layerService;
        private $messageBus;
        private scope;
        private widget;
        switch: string;
        private subHandle;
        static $inject: string[];
        constructor($scope: IDateFilterScope, $layerService: csComp.Services.LayerService, $messageBus: csComp.Services.MessageBusService);
        select(): void;
        private check(d);
        initTextFilter(): void;
        updateTextFilter(): void;
        remove(): void;
    }
}

declare module Filters {
    /**
      * Module
      */
    var myModule: any;
}

declare module Filters {
    interface ITextFilterScope extends ng.IScope {
        vm: TextFilterCtrl;
        filter: csComp.Services.GroupFilter;
    }
    class TextFilterCtrl {
        $scope: ITextFilterScope;
        private $layerService;
        private $messageBus;
        private scope;
        private widget;
        static $inject: string[];
        constructor($scope: ITextFilterScope, $layerService: csComp.Services.LayerService, $messageBus: csComp.Services.MessageBusService);
        initTextFilter(): void;
        updateTextFilter(): void;
        remove(): void;
    }
}

declare module MarkdownWidget {
    /**
      * Module
      */
    var myModule: any;
}

declare module MarkdownWidget {
    class MarkdownWidgetData {
        title: string;
        content: string;
        url: string;
    }
    interface IMarkdownWidgetScope extends ng.IScope {
        vm: MarkdownWidgetCtrl;
        data: MarkdownWidgetData;
    }
    class MarkdownWidgetCtrl {
        private $scope;
        private $timeout;
        private $layerService;
        private $messageBus;
        private $mapService;
        private scope;
        private widget;
        static $inject: string[];
        constructor($scope: IMarkdownWidgetScope, $timeout: ng.ITimeoutService, $layerService: csComp.Services.LayerService, $messageBus: csComp.Services.MessageBusService, $mapService: csComp.Services.MapService);
    }
}

declare module Indicators {
    /**
      * Module
      */
    var myModule: any;
}

declare module Indicators {
    class indicatorData {
        title: string;
        orientation: string;
        indicators: indicator[];
    }
    class indicator {
        title: string;
        visual: string;
        type: string;
        sensor: string;
        sensorSet: csComp.Services.SensorSet;
        layer: string;
        /** dashboard to select after click */
        dashboard: string;
        isActive: boolean;
        id: string;
        color: string;
        indexValue: number;
    }
    interface ILayersDirectiveScope extends ng.IScope {
        vm: IndicatorsCtrl;
        data: indicatorData;
    }
    class IndicatorsCtrl {
        private $scope;
        private $timeout;
        private $layerService;
        private $messageBus;
        private $mapService;
        private $dashboardService;
        private scope;
        private widget;
        static $inject: string[];
        constructor($scope: ILayersDirectiveScope, $timeout: ng.ITimeoutService, $layerService: csComp.Services.LayerService, $messageBus: csComp.Services.MessageBusService, $mapService: csComp.Services.MapService, $dashboardService: csComp.Services.DashboardService);
        updateIndicator(i: indicator): void;
        private checkLayers();
        selectIndicator(i: indicator): void;
    }
}

declare module csComp.Services {
    class GeoJsonSource implements ILayerSource {
        service: LayerService;
        title: string;
        layer: ProjectLayer;
        requiresLayer: boolean;
        constructor(service: LayerService);
        refreshLayer(layer: ProjectLayer): void;
        addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void): void;
        /** zoom to boundaries of layer */
        fitMap(layer: ProjectLayer): void;
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
        protected baseAddLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void): void;
        removeLayer(layer: ProjectLayer): void;
    }
    class DynamicGeoJsonSource extends GeoJsonSource {
        service: LayerService;
        title: string;
        connection: Connection;
        constructor(service: LayerService);
        private updateFeatureByProperty(key, id, value);
        private deleteFeatureByProperty(key, id, value);
        initSubscriptions(layer: ProjectLayer): void;
        addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void): void;
        connectionEvent(status: string): void;
        removeLayer(layer: ProjectLayer): void;
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
    }
}

declare module csComp.Services {
    interface IGridDataSourceParameters extends IProperty {
        /**
         * Grid type, for example 'custom' (default) or 'esri' ASCII Grid
         */
        gridType: string;
        /**
         * Projection of the ESRI ASCII GRID
         */
        projection: string;
        /**
         * Property name of the cell value of the generated json.
         */
        propertyName: string;
        /**
         * Skip a comment line when it starts with this character
         */
        commentCharacter?: string;
        /**
         * Character that separates cells. Default is space.
         */
        separatorCharacter?: string;
        /**
         * Skip a number of lines from the start.
         */
        skipLines?: number;
        /**
         * Skip a number of lines after a comment block ends.
         */
        skipLinesAfterComment?: number;
        /**
         * Skip a number of spaces from the start of the line.
         */
        skipSpacesFromLine?: number;
        /**
         * Number of grid columns.
         */
        columns: number;
        /**
         * Number of grid rows.
         */
        rows: number;
        /**
         * Start latitude in degrees.
         */
        startLat: number;
        /**
         * Start longitude in degrees.
         */
        startLon: number;
        /**
         * Add deltaLat after processing a grid cell.
         * NOTE: When the direction is negative, use a minus sign e.g. when counting from 90 to -90..
         */
        deltaLat: number;
        /**
         * Add deltaLon degrees after processing a grid cell.
         */
        deltaLon: number;
        /**
         * Skip a first column, e.g. containing the latitude degree.
         */
        skipFirstColumn?: boolean;
        /**
         * Skip a first row, e.g. containing the longitude degree.
         */
        skipFirstRow?: boolean;
        /**
         * When the cell value is below this threshold, it is ignored.
         */
        minThreshold?: number;
        /**
        * When the cell value is above this threshold, it is ignored.
         */
        maxThreshold?: number;
        /**
         * The input values to be NoData in the output raster. Optional. Default is -9999.
         */
        noDataValue: number;
    }
    /**
     * A GRID data source is a raster or grid in which the grid cells are delimited by spaces
     * and each newline indicates a new row of data.
     */
    class GridDataSource extends csComp.Services.GeoJsonSource {
        service: csComp.Services.LayerService;
        title: string;
        gridParams: IGridDataSourceParameters;
        constructor(service: csComp.Services.LayerService);
        addLayer(layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void): void;
        /**
         * Convert the ESRI ASCII GRID header to grid parameters.
         *
ESRI ASCII Raster format
The ESRI ASCII raster format can be used to transfer information to or from other cell-based or raster systems. When an existing raster is output to an ESRI ASCII format raster, the file will begin with header information that defines the properties of the raster such as the cell size, the number of rows and columns, and the coordinates of the origin of the raster. The header information is followed by cell value information specified in space-delimited row-major order, with each row seperated by a carraige return.
In order to convert an ASCII file to a raster, the data must be in this same format. The parameters in the header part of the file must match correctly with the structure of the data values.
The basic structure of the ESRI ASCII raster has the header information at the beginning of the file followed by the cell value data:
    NCOLS xxx
    NROWS xxx
    XLLCENTER xxx | XLLCORNER xxx
    YLLCENTER xxx | YLLCORNER xxx
    CELLSIZE xxx
    NODATA_VALUE xxx
    row 1
    row 2
    ...
    row n
*
Row 1 of the data is at the top of the raster, row 2 is just under row 1, and so on.
Header format
The syntax of the header information is a keyword paired with the value of that keyword. The definitions of the kewords are:
*
Parameter	Description	Requirements
NCOLS	Number of cell columns.	Integer greater than 0.
NROWS	Number of cell rows.	Integer greater than 0.
XLLCENTER or XLLCORNER	X coordinate of the origin (by center or lower left corner of the cell).	Match with Y coordinate type.
YLLCENTER or YLLCORNER	Y coordinate of the origin (by center or lower left corner of the cell).	Match with X coordinate type.
CELLSIZE	Cell size.	Greater than 0.
NODATA_VALUE	The input values to be NoData in the output raster.	Optional. Default is -9999.
Data format
The data component of the ESRI ASCII raster follows the header information.
Cell values should be delimited by spaces.
No carriage returns are necessary at the end of each row in the raster. The number of columns in the header determines when a new row begins.
Row 1 of the data is at the top of the raster, row 2 is just under row 1, and so on.
         */
        private convertEsriHeaderToGridParams(data);
        /**
         * Convert data to GeoJSON.
         */
        private convertDataToGeoJSON(data, gridParams);
    }
}

declare module csComp.Services {
    class HeatmapSource implements ILayerSource {
        service: LayerService;
        title: string;
        requiresLayer: boolean;
        heatmapModel: Heatmap.HeatmapModel;
        constructor(service: LayerService);
        refreshLayer(layer: ProjectLayer): void;
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
        addLayer(layer: ProjectLayer, callback: Function): void;
        removeLayer(layer: ProjectLayer): void;
        enableProjectLayer(layer: ProjectLayer): void;
        getRequiredLayers(layer: ProjectLayer): ProjectLayer[];
        getFeatureTypes(layer: ProjectLayer): string[];
        generateHeatmap(layer: ProjectLayer): void;
    }
}

declare module csComp.Services {
    class HierarchySource implements ILayerSource {
        service: LayerService;
        title: string;
        layer: ProjectLayer;
        requiresLayer: boolean;
        constructor(service: LayerService);
        refreshLayer(layer: ProjectLayer): void;
        addLayer(layer: ProjectLayer, callback: Function): void;
        fitMap(layer: ProjectLayer): void;
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
        getRequiredLayers(layer: ProjectLayer): ProjectLayer[];
        protected baseAddLayer(layer: ProjectLayer, callback: Function): void;
        removeLayer(layer: ProjectLayer): void;
    }
}

interface Date {
    getJulian(): number;
    getGMST(): number;
}
declare module L {
    class Terminator extends L.Polygon {
        constructor(options?: Object);
    }
}
declare module csComp.Services {
    interface INightDayDataSourceParameters extends IProperty {
        /**
         * Show the night (default) or day area.
         */
        showNight: boolean;
        /**
         * Set a property value for the area (default: intensity = 0)
         */
        value: number;
    }
    class NightDayDataSource extends csComp.Services.GeoJsonSource {
        service: csComp.Services.LayerService;
        title: string;
        constructor(service: csComp.Services.LayerService);
        addLayer(layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void): void;
    }
}

declare module csComp.Services {
    class TileLayerSource implements ILayerSource {
        service: LayerService;
        title: string;
        requiresLayer: boolean;
        constructor(service: LayerService);
        refreshLayer(layer: ProjectLayer): void;
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
        addLayer(layer: ProjectLayer, callback: Function): void;
        removeLayer(layer: ProjectLayer): void;
    }
}

declare module csComp.Services {
    class WmsSource implements ILayerSource {
        service: LayerService;
        title: string;
        requiresLayer: boolean;
        constructor(service: LayerService);
        refreshLayer(layer: ProjectLayer): void;
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
        addLayer(layer: ProjectLayer, callback: Function): void;
        removeLayer(layer: ProjectLayer): void;
    }
}

declare module csComp.Services {
    class CesiumRenderer implements IMapRenderer {
        title: string;
        service: LayerService;
        viewer: any;
        camera: any;
        scene: any;
        features: {
            [key: string]: any;
        };
        private popup;
        private popupShownFor;
        init(service: LayerService): void;
        enable(): void;
        getZoom(): number;
        fitBounds(bounds: L.LatLngBounds): void;
        setUpMouseHandlers(): void;
        disable(): void;
        changeBaseLayer(layer: BaseLayer): void;
        showFeatureTooltip(feature: IFeature, endPosition: any): void;
        addLayer(layer: ProjectLayer): JQueryPromise<{}>;
        removeLayer(layer: ProjectLayer): JQueryPromise<{}>;
        updateMapFilter(group: ProjectGroup): JQueryPromise<{}>;
        addGroup(group: ProjectGroup): void;
        removeGroup(group: ProjectGroup): void;
        removeFeature(feature: IFeature): void;
        removeFeatures(features: IFeature[]): JQueryPromise<{}>;
        updateFeature(feature: IFeature): void;
        private updateEntity(entity, feature);
        addFeature(feature: IFeature): void;
        createFeature(feature: IFeature): any;
        private createPolygon(coordinates);
        private createMultiPolygon(coordinates);
        private coordinatesArrayToCartesianArray(coordinates);
        private defaultCrsFunction(coordinates);
    }
}

declare module csComp.Services {
    class LeafletRenderer implements IMapRenderer {
        title: string;
        service: LayerService;
        $messageBusService: MessageBusService;
        private popup;
        init(service: LayerService): void;
        enable(): void;
        fitBounds(bounds: L.LatLngBounds): void;
        getZoom(): number;
        disable(): void;
        addGroup(group: ProjectGroup): void;
        removeLayer(layer: ProjectLayer): void;
        changeBaseLayer(layerObj: BaseLayer): void;
        private createBaseLayer(layerObj);
        private getLeafletStyle(style);
        addLayer(layer: ProjectLayer): void;
        /***
         * Update map markers in cluster after changing filter
         */
        updateMapFilter(group: ProjectGroup): void;
        removeGroup(group: ProjectGroup): void;
        removeFeature(feature: IFeature): void;
        updateFeature(feature: IFeature): void;
        addFeature(feature: IFeature): any;
        /**
         * add a feature
         */
        createFeature(feature: IFeature): any;
        /**
         * create icon based of feature style
         */
        getPointIcon(feature: IFeature): any;
        /***
         * Show tooltip with name, styles & filters.
         */
        showFeatureTooltip(e: any, group: ProjectGroup): void;
        hideFeatureTooltip(e: any): void;
        updateFeatureTooltip(e: any): void;
    }
}
