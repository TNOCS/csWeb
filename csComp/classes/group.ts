module csComp.Services {

    export enum LayerType {
        GeoJson,
        Kml
    }


    /** a project group contains a list of layers that can be grouped together. 
     * Filters, styles can clustering is always defined on the group level. 
     * If a filter is selected (e.g. show only the features within a certain property range)
     * this filter is applied to all layers within this group.
     * If clustering is enabled all features in all layers are grouped together
     */
    export class ProjectGroup {
        id              : string;
        title           : string;
        description     : string;
        layers          : Array<ProjectLayer>;
        filters         : Array<GroupFilter>;
        styles          : Array<GroupStyle>;
        showTitle       : boolean;
        cluster         : L.MarkerClusterGroup;
        vectors         : L.LayerGroup<L.ILayer>;
        /** Turn on the leaflet markercluster */
        clustering      : boolean;
        /** If set, at this zoom level and below markers will not be clustered. This defaults to disabled */
        clusterLevel    : number;
        /**  The maximum radius that a cluster will cover from the central marker (in pixels). Default 80. Decreasing will make more smaller clusters. You can also use a function that accepts the current map zoom and returns the maximum cluster radius in pixels. */
        maxClusterRadius: number;
        clusterFunction : Function;
        /** Creates radio buttons instead of checkboxes in the level */
        oneLayerActive  : boolean;
        ndx             : any;
        filterResult    : IFeature[];
        public markers  : any;
        styleProperty   : string;
        languages       : ILanguageData;
    }

    /**
     * Filters are used to select a subset of features within a group. 
     */
    export class GroupFilter {
        id         : string;
        title      : string;
        enabled    : boolean;
        filterType : string;
        property   : string;
        property2  : string;
        criteria   : string;
        dimension  : any;
        value      : any;
        stringValue: string;
        rangex     : number[];
        meta       : IPropertyType;
    }

  
    /**
     * Styles can determine how features are shown on the map
     */
    export class GroupStyle {
        id              : string;
        title           : string;
        enabled         : boolean;
        layers          : string[];
        visualAspect    : string;
        property        : string;
        colors          : string[];
        group           : ProjectGroup;
        availableAspects: string[];
        canSelectColor  : boolean;
        colorScales     : any;
        info            : PropertyInfo;
        meta            : IPropertyType;
        legend          : Legend; 

        constructor($translate: ng.translate.ITranslateService) {

            this.availableAspects = ['strokeColor', 'fillColor', 'strokeWidth'];
            this.colorScales = {};

            $translate('SPEEDS_TAOUFIK').then((translation) => {
                this.colorScales[translation] = ['black', '#DEEBFA'];
                this.legend = {
                    "legendkind": "interpolated",
                    "legendentries": [{
                        "label": "0",
                        "interval": { "min": 0, "max": 0 },
                        "value": 0,
                        "color": "#FFFFFF"
                    },
                    {
                        "label": "1",
                        "interval": { "min": 0, "max": 0 },
                        "value": 1,
                        "color": "#000000"
                    },
                    {
                        "label": "19",
                        "interval": { "min": 0, "max": 0 },
                        "value": 19,
                        "color": "#FF0000"
                    },
                    {
                        "label": "81",
                        "interval": { "min": 0, "max": 0 },
                        "value": 81,
                        "color": "#FFFF00"
                    },
                    {
                        "label": "120",
                        "interval": { "min": 0, "max": 0 },
                        "value": 120,
                        "color": "#00FF00"
                    },
                    {
                        "label": "150",
                        "interval": { "min": 0, "max": 0 },
                        "value": 150,
                        "color": "#DEEBFA"
                    }]
                }
            });

            $translate('SPEEDS_GOOGLEMAPS').then((translation) => {
                this.colorScales[translation] = ['#800000', 'red', 'orange', 'green'];
                this.legend = {
                    "legendkind": "discrete",
                    "legendentries": [{
                        "label": "0 - 30",
                        "interval": { "min": 0, "max": 20 },
                        "value": 10,
                        "color": "#800000"
                    },
                    {
                        "label": "30 - 60",
                        "interval": { "min": 20, "max": 40 },
                        "value": 30,
                        "color": "red"
                    },
                    {
                        "label": "10 - 20",
                        "interval": { "min": 40, "max": 70 },
                        "value": 60,
                        "color": "orange"
                    },
                    {
                        "label": "20 - 100",
                        "interval": { "min": 70, "max": 150 },
                        "value": 120,
                        "color": "#00AA00"
                    }]
                }
            });

            //$translate('PERCENTAGES_V1').then((translation) => {
            //    this.colorScales[translation] = ['black', 'white', 'red'];
            //    this.legend = {
            //        "legendkind": "discrete",
            //        "legendentries": [{
            //            "label": "0 - 10",
            //            "interval": { "min": 0, "max": 10 },
            //            "value": 0,
            //            "color": "#00FF00"
            //        },
            //        {
            //            "label": "10 - 20",
            //            "interval": { "min": 10, "max": 20 },
            //            "value": 0,
            //            "color": "#FFff00"
            //        },
            //        {
            //            "label": "20 - 100",
            //            "interval": { "min": 20, "max": 100 },
            //            "value": 100,
            //            "color": "#FF0000"
            //        }]
            //    }
            //});

            $translate('ORANGE_RED').then((translation) => {
                this.colorScales[translation] = ['orange', 'pink'];
            });
            $translate('WHITE_RED').then((translation) => {
                this.colorScales[translation] = ['white', 'red'];
            });
            $translate('RED_WHITE').then((translation) => {
                this.colorScales[translation] = ['red', 'white'];
            });
            $translate('GREEN_RED').then((translation) => {
                this.colorScales[translation] = ['green', 'red'];
            });
            $translate('RED_GREEN').then((translation) => {
                this.colorScales[translation] = ['red', 'green'];
            });
            $translate('BLUE_RED').then((translation) => {
                this.colorScales[translation] = ['#F04030', '#3040F0'];
            });
            $translate('RED_BLUE').then((translation) => {
                this.colorScales[translation] = ['#3040F0', '#F04030'];
            });
            $translate('WHITE_BLUE').then((translation) => {
                this.colorScales[translation] = ['white', 'blue'];
            });
            $translate('BLUE_WHITE').then((translation) => {
                this.colorScales[translation] = ['blue', 'white'];
            });
            $translate('WHITE_GREEN').then((translation) => {
                this.colorScales[translation] = ['white', 'green'];
            });
            $translate('GREEN_WHITE').then((translation) => {
                this.colorScales[translation] = ['green', 'white'];
            });
            $translate('WHITE_ORANGE').then((translation) => {
                this.colorScales[translation] = ['white', 'orange'];
            });
            $translate('ORANGE_WHITE').then((translation) => {
                this.colorScales[translation] = ['orange', 'white'];
            });
        }
    }

    /**
     * the Legend class provides a data structure that is used to map a value to a color
     * (see also the function getColor())
    */
    export class Legend {
        legendkind: string;
        legendentries: LegendEntry[];
        // it is assumed that the legendentries have their values and/or intervals
        // sorted in ascending order
    }

    export class LegendEntry {
        label: string;
        interval: {
            min: number;
            max: number;
        };                 // either interval or value is used, depending on legendtype (discrete or interpolated)
        value: number;
        color: string;  // hex string; rgb (first shot at it)
    }


   

} 