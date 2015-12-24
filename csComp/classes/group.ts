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
        id: string;
        title: string;
        description: string;
        layers: Array<ProjectLayer>;
        filters: Array<GroupFilter>;
        /* Including styles in (projectgroups in) project.json files is probably not a good idea, in case the layers
           in the group have properties (attributes), as for example in geojson files.
           This is because when selecting a property for styling, the call to setStyle leads to the creation of a new
           group and deletion of existing styles. */
        styles: Array<GroupStyle>;
        showTitle: boolean;
        _cluster: L.MarkerClusterGroup;
        _vectors: L.LayerGroup<L.ILayer>;
        /** Turn on the leaflet markercluster */
        clustering: boolean;
        /** If set, at this zoom level and below markers will not be clustered. This defaults to disabled */
        clusterLevel: number;
        /**  
         * The maximum radius that a cluster will cover from the central marker (in pixels). Default 80. 
         * Decreasing will make more smaller clusters. You can also use a function that accepts the current map 
         * zoom and returns the maximum cluster radius in pixels. */
        maxClusterRadius: number;
        clusterFunction: Function;
        /** Creates radio buttons instead of checkboxes in the level */
        oneLayerActive: boolean;
        ndx: any;
        filterResult: IFeature[];
        public markers: any;
        styleProperty: string;
        languages: ILanguageData;
        owsurl: string;
        owsgeojson: boolean;
        /**
         * gui is used for setting temp. properties for rendering
         */
        _gui: any = {};

        /**
         * Returns an object which contains all the data that must be serialized.
         */
        public static serializeableData(projectGroup: ProjectGroup): Object {
            return {
                id:               projectGroup.id,
                title:            projectGroup.title,
                description:      projectGroup.description,
                showTitle:        projectGroup.showTitle,
                clustering:       projectGroup.clustering,
                clusterLevel:     projectGroup.clusterLevel,
                maxClusterRadius: projectGroup.maxClusterRadius,
                oneLayerActive:   projectGroup.oneLayerActive,
                styleProperty:    projectGroup.styleProperty,
                languages:        projectGroup.languages,
                layers:           csComp.Helpers.serialize<ProjectLayer>(projectGroup.layers, ProjectLayer.serializeableData)
            };
        }

        public static deserialize(input: Object): ProjectGroup {
            var res = <ProjectGroup>$.extend(new ProjectGroup(), input);
            if (res.owsurl) {
                res.loadLayersFromOWS();
            }
            return res;
        }

        public loadLayersFromOWS($injector: ng.auto.IInjectorService = null): void {
            this.layers = [];   // add some layers here...

            if ($injector == null) {   // create an injector if not given
                $injector = angular.injector(['ng']);
            }
            $injector.invoke(($http) => {
                $http.get(this.owsurl)
                    .success((xml) => { this.parseXML(xml); })
                    .error((xml, status) => {
                    console.log('Unable to load OWSurl: ' + this.owsurl);
                    console.log('          HTTP status: ' + status);
                });
            });
        }

        private parseXML(xml: any): void {
            var theGroup = this;
            var baseurl = this.owsurl.split('?')[0];
            $(xml).find('Layer').each(function() {
                // DO NOT use arrow notation (=>) as it will break this !!!
                var layerName = $(this).children('Name').text();
                if (layerName != null && layerName !== '') {
                    var title = $(this).children('Title').text();
                    // TODO: should be using layerService.initLayer(theGroup, layer);
                    // But I don't know how to 'inject' layerService :(
                    var layer = theGroup.buildLayer(baseurl, title, layerName);
                    theGroup.layers.push(layer);
                }
            });
        }

        private buildLayer(baseurl: string, title: string, layerName: string): ProjectLayer {
            var extraInfo = {
                'id':        Helpers.getGuid(),
                'reference': layerName,
                'title':     title,
                'enabled':   false,
                'group':     this
            };
            // Image layers
            if (this.owsgeojson) {
                extraInfo['type'] = 'geojson';
                extraInfo['url'] = baseurl + '?service=wfs&request=getFeature' +
                '&outputFormat=application/json&typeName=' + layerName;
            } else {
                extraInfo['type'] = 'wms';
                extraInfo['wmsLayers'] = layerName;
                extraInfo['url'] = baseurl;
            }
            var layer = <ProjectLayer> jQuery.extend(new ProjectLayer(), extraInfo);
            return layer;
        }
    }

    /**
     * Filters are used to select a subset of features within a group.
     */
    export class GroupFilter {
        id:          string;
        title:       string;
        enabled:     boolean;
        filterType:  string;
        property:    string;
        property2:   string;
        criteria:    string;
        group:       ProjectGroup;
        dimension:   any;
        value:       any;
        stringValue: string;
        rangex:      number[];
        meta:        IPropertyType;
        to:          number;
        from:        number;
    }

    /**
     * Styles can determine how features are shown on the map
     */
    export class GroupStyle {
        id:               string;
        title:            string;
        enabled:          boolean;
        layers:           string[];
        visualAspect:     string;
        property:         string;
        colors:           string[];
        group:            ProjectGroup;
        availableAspects: string[];
        canSelectColor:   boolean;
        colorScales:      any;
        info:             PropertyInfo;
        meta:             IPropertyType;
        legends:          { [key: string]: Legend; };
        activeLegend:     Legend;
        fixedColorRange:  boolean;

        constructor($translate: ng.translate.ITranslateService) {
            this.availableAspects = ['strokeColor', 'fillColor', 'strokeWidth', 'height'];
            this.colorScales      = {};
            this.legends          = {};
            this.fixedColorRange  = false;

            $translate('WHITE_RED').then((translation) => {
                this.colorScales[translation] = ['white', 'red'];
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
                this.colorScales[translation] = ['white', '#FF5500'];
            });
            $translate('ORANGE_WHITE').then((translation) => {
                this.colorScales[translation] = ['#FF5500', 'white'];
            });
            $translate('RED_WHITE_BLUE').then((translation) => {
                this.colorScales[translation] = ['red', 'white', 'blue'];
            });
        }
    }

    /**
     * the Legend class provides a data structure that is used to map a value to a color
     * (see also the function getColor())
    */
    export class Legend {
        id:            string;
        description:   string;
        legendKind:    string;
        visualAspect:  string;
        legendEntries: LegendEntry[];
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
        stringValue: string;
        color: string;  // hex string; rgb
    }

}
