module csComp.Services {

    /** object describing a link to a dynamic sensor set from the server */
    export interface ISensorLink {
        /** name of the property that will used to lookup the feature */
        linkid? : string;
        /** url to fetch the sensor data */
        url? : string;
        /** url to fetch layer kpi data */
        kpiUrl? : string;
        /** interval for live link (15m, 1h, 24h, etc) */
        liveInterval? : string;
        /** specify different interval for live KPI data (15m, 1h, 24h, etc) */
        liveIntervalKPI? : string;
        /** maximum timeline zoom level */
        zoomMaxTimeline? : number;

        _outOfRange? : boolean;
    }

    /** Interface of a project layer
     *  Note that this is a copy of the similarly named class, but the advantage is that I can use the
     *  interface definition also on the server side.
     *  TODO Check whether we need to keep the class definition.
     */
    export interface IProjectLayer {
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
        /** link to url for dynamic sensor data */
        sensorLink? : ISensorLink;
        /** Type of layer, e.g. GeoJSON, TopoJSON, or WMS */
        type: string;
        /** render type */
        renderType?: string;
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
        /** indicates that this is a dynamic layer (dynamicgeojson) */
        isDynamic?: boolean;
        /** indicates that the contents layer of this layer can be changed */
        isEditable?: boolean;
        /** this layer contains sensor data, updated when focusTime changes */
        hasSensorData? : boolean;
        /**
         * indicates if a dynamic layer is connected
         */
        isConnected?: boolean;
        /**
         * When a log is used all property & geometry changes when saved are recorded in a log, this allows you to go back in time,
         * otherwise the complete feature with all its properties and geometry is overwritten
         */
        useLog?: boolean;
        /** indicates if features should be shown on timeline */
        showOnTimeline?: boolean;
        /** if the resourceType of the layer might change while the project is loaded, set dynamicResource to true to reload the
         * resourceType on every load */
        dynamicResource?: boolean;
        /** If true (default false), do not move the selected feature to the front of the SVG stack */
        disableMoveSelectionToFront: boolean;
        /** Default true, but if set to false, do not notify the timeline of changes. */
        timeAware: boolean;
        /** if true, use the current focustime to retrieve data from the server */
        timeDependent?: boolean;
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
        /** list of tags describing this layer */
        tags?: string;
        /** key name of default feature type */
        defaultFeatureType?: string;
        /** image for this layer */
        image?: string;
        /** last updated time */
        updated?: number;
        /** zoom to layer if it gets activated */
        fitToMap? : boolean;
        /** If true, specifies the properties to publish items on the timeline. */
        timelineConfig?: Timeline.ITimelineConfig;
    }

    /** Layer information. a layer is described in a project file and is always part of a group */
    export class ProjectLayer implements IProjectLayer {
        /** Key of the propertyTypeData entry that provides a legend for this layer **/
        defaultLegendProperty: string;
        /** Key of the legend entry (from resource -> legends) **/
        defaultLegend : string;
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
        /** Links to the the (feature & property) type definitions in a separate file */
        typeUrl: string;
        /** link to url for dynamic sensor data */
        sensorLink : ISensorLink;
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
        /** indicates if features should be shown on timeline */
        showOnTimeline: boolean;
        /** If true (default false), do not move the selected feature to the front of the SVG stack */
        disableMoveSelectionToFront: boolean;
        /** Default true, but if set to false, do not notify the timeline of changes. */
        timeAware: boolean = true;
        /** if true, use the current focustime to retrieve data from the server */
        timeDependent: boolean;
        /** time interval for unique time requests, in milliseconds */
        timeResolution: number;
        /** format timerequest e.g. YYYYmmDDHH */
        timeFormatString: string;

        /** if true, use the current bounding box to retreive data from the server */
        refreshBBOX: boolean;
        /** if the resourceType of the layer might change while the project is loaded, set dynamicResource to true to reload the resourceType on every load */
        dynamicResource: boolean;
        /** The current bounding box to retreive data from the server */
        BBOX: string;
        layerSource: ILayerSource;
        /**
         * Number of seconds between automatic layer refresh.
         * @type {number}
         */
        refreshTimeInterval: number;
        /**
         * When enabling the refresh timer, store the returned timer token so we can stop the timer later.
         * @type {number}
         */
        timerToken: any;
        // timerToken: number;
        /**
        * A list of UNIX timestamp, or the UTC time in milliseconds since 1/1/1970, which define the time a sensor value
        * was taken. So in case we have 10 timestamps, each feature's sensor (key) in the feature's sensors dictionary should
        * also have a lnegth of 10.
        * Note that this value is optional, and can be omitted if the sensor already contains a timestamp too. This is mainly intended
        * when all 'sensor measurements' are taken on the same moment. For example, the CENSUS date.
        * In Excel, you can use the formula =24*(A4-$B$1)*3600*1000 to convert a date to a UNIX time stamp.
        */
        timestamps: number[];
        kpiTimestamps: number[];
        /** Internal ID, e.g. for the Excel service */
        id: string;
        /** Reference for URL params: if the URL contains layers=REFERENCE1;REFERENCE2, the two layers will be turned on.  */
        reference: string;
        events: Event[];
        /** Language information that can be used to localize the title and description */
        languages: ILanguageData;

        /** layer specific sensors, can be used for kpis */
        sensors : {[id : string] : number[]}

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

        _lastSelectedFeature: IFeature;

        /** link to a parent feature, e.g. city layer references to a parent provence */
        parentFeature: IFeature;

        /** key name of default feature type */
        defaultFeatureType: string;

        /**  dynamic projects have a realtime connection with the server. This connection allows you to make changes to the feature & property types and
        feature geometry and property values. changes are distributed to all active clients in realtime */
        isDynamic: boolean;

        /** indicates that the contents layer of this layer can be changed */
        isEditable: boolean;

        /**
         * Logging mechanism allows you to specify specific property values and geometries in time,
         * it works the same way as sensor data but is optimized for smaller amounts of data and allows not only numbers
         * but also text, geometries, etc., where sensors are optimized for many different values, but only numbers
        */
        useLog: boolean;
        isConnected: boolean;

        /** this layer contains sensor data, updated when focusTime changes */
        hasSensorData : boolean;

        /**
         * gui is used for setting temp. values for rendering
         */
        _gui: any = {};

        /** image for this layer */
        image: string;

        /** list of tags describing this layer */
        tags: string;

        /** last updated time */
        updated: number;

        /** show notification on new feature */
        showFeatureNotifications: boolean = true;

        /** Change the map extent to fit the contents of the layer
         *  when it is activated
         */
        fitToMap: boolean;

        /**
         * Select a min and max zoom for the layer to be shown.
         * When the zoomlevel is out of range, hide all features using the opacity.
         */
        minZoom: number;
        maxZoom: number;

        /** handle for receiving zoom events */
        zoomHandle: MessageBusHandle;

        /** True when the layer features are transparent, e.g. when outside zoom range */
        isTransparent: boolean;

        /** Get the features from the layer's original source, if present. */
        public static getFeatures(layer: ProjectLayer) {
            return (layer.data && layer.data.features)
                ? layer.data.features
                : null;
        }

        /**
         * Returns an object which contains all the data that must be serialized.
         */
        public static serializeableData(pl: ProjectLayer): Object {
            return {
                id:                    pl.id,
                title:                 pl.title,
                description:           pl.description,
                type:                  pl.type,
                renderType:            pl.renderType,
                heatmapSettings:       pl.heatmapSettings,
                heatmapItems:          csComp.Helpers.serialize(pl.heatmapItems, Heatmap.HeatmapItem.serializeableData),
                url:                   pl.url,
                typeUrl:               pl.typeUrl,
                sensors:               pl.sensors,
                sensorLink :           pl.sensorLink,
                wmsLayers:             pl.wmsLayers,
                opacity:               pl.opacity,
                isSublayer:            pl.isSublayer,
                BBOX:                  pl.BBOX,
                refreshBBOX:           pl.refreshBBOX,
                refreshTimeInterval:   pl.refreshTimeInterval,
                quickRefresh:          pl.quickRefresh,
                languages:             pl.languages,
                events:                pl.events,
                dataSourceParameters:  pl.dataSourceParameters,
                defaultFeatureType:    pl.defaultFeatureType,
                defaultLegendProperty: pl.defaultLegendProperty,
                defaultLegend:         pl.defaultLegend,
                useProxy:              pl.useProxy,
                isDynamic:             pl.isDynamic,
                isEditable:            pl.isEditable,
                useLog:                pl.useLog,
                tags:                  pl.tags,
                hasSensorData:         pl.hasSensorData,
                timeAware:             pl.timeAware,
                fitToMap:              pl.fitToMap,
                minZoom:               pl.minZoom,
                maxZoom:               pl.maxZoom
            };
        }
    }

    /**
     * Baselayers are background maps (e.g. openstreetmap, nokia here, etc).
     * They are described in the project file
     */
    export interface IBaseLayer {
        id:              string;
        title:           string;
        isDefault:       boolean;
        subtitle:        string;
        preview:         string;
        /** URL pointing to the basemap source. */
        url:             string;
        /** Maximum zoom level */
        maxZoom:         number;
        /** Minimum zoom level */
        minZoom:         number;
        /**
         * Max native zoom level:
         * Maximum zoom number the tiles source has available.
         * If it is specified, the tiles on all zoom levels higher than maxNativeZoom will be loaded from maxZoom level and auto-scaled.
         */
        maxNativeZoom:   number;
        /** URL pointing to an error-tile that should be shown when the actual tile cannot be loaded */
        errorTileUrl?:   string;
        subdomains:      string[];
        /** String that is shown on the map, attributing the source of the basemap */
        attribution:     string;
        test:            string;
        cesium_url?:     string;
        cesium_tileUrl?: string;
        cesium_maptype?: string;
    }

    export class BaseLayer implements IBaseLayer {
        id:        string;
        title:     string;
        isDefault: boolean;
        subtitle:  string;
        preview:   string;
        /** URL pointing to the basemap source. */
        url:            string;
        /** Maximum zoom level */
        maxZoom:        number;
        /** Minimum zoom level */
        minZoom:        number;
        /**
         * Max native zoom level:
         * Maximum zoom number the tiles source has available.
         * If it is specified, the tiles on all zoom levels higher than maxNativeZoom will be loaded from maxZoom level and auto-scaled.
         */
        maxNativeZoom = 19;
        /** URL pointing to an error-tile that should be shown when the actual tile cannot be loaded */
        errorTileUrl:   string;
        subdomains:     string[];
        /** String that is shown on the map, attributing the source of the basemap */
        attribution:    string;
        test:           string;
        /** Cesium specific URLs to retreive the tiles */
        cesium_url:     string;
        cesium_maptype: string;
        /** Height tiles */
        cesium_tileUrl: string;
    }
}
