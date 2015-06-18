module csComp.Services {
    'use strict';

    /** describes a layer source, every layer has a layer source that is responsible for importing the data (e.g. geojson, wms, etc */
    export interface ILayerSource {
        title: string;
        service: ILayerService;
        addLayer(layer: ProjectLayer, callback: Function);
        removeLayer(layer: ProjectLayer): void;
        refreshLayer(layer: ProjectLayer): void;
        requiresLayer: boolean;
        getRequiredLayers?(layer: ProjectLayer): ProjectLayer[];
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
    }

    export interface ILayerService {
        title: string;
        accentColor: string;
        solution: Solution;
        project: Project;
        maxBounds: IBoundingBox;
        findLayer(id: string): ProjectLayer;
        findLoadedLayer(id: string): ProjectLayer;
        //selectFeature(feature: Services.IFeature);
        currentLocale: string;
        activeMapRenderer: IMapRenderer;                    // active map renderer
        mb: Services.MessageBusService;
        map: Services.MapService;
        //layerGroup: L.LayerGroup<L.ILayer>;
        featureTypes: { [key: string]: Services.IFeatureType; };
        propertyTypeData: { [key: string]: Services.IPropertyType; };
        timeline: any;
    }

    /** layer service is responsible for reading and managing all project, layer and sensor related data */
    export class LayerService implements ILayerService {
        maxBounds: IBoundingBox;
        title: string;
        accentColor: string;
        mb: Services.MessageBusService;
        map: Services.MapService;
        featureTypes: { [key: string]: IFeatureType; };
        propertyTypeData: { [key: string]: IPropertyType; };
        project: Project;
        projectUrl: SolutionProject; // URL of the current project
        solution: Solution;
        dimension: any;
        lastSelectedFeature: IFeature;
        selectedLayerId: string;
        timeline: any;

        currentLocale: string;
        /** layers that are currently active */
        loadedLayers = new csComp.Helpers.Dictionary<ProjectLayer>();
        /** list of available layer sources */
        layerSources: { [key: string]: ILayerSource };
        /** list of available map renderers */
        mapRenderers: { [key: string]: IMapRenderer };
        /** map render currently in use */
        activeMapRenderer: IMapRenderer;                 // active map renderer
        /** list of all loaded types resources */
        typesResources: { [key: string]: ITypesResource };

        public visual: VisualState = new VisualState();

        static $inject = [
            '$location',
            '$compile',
            '$translate',
            'messageBusService',
            'mapService',
            '$rootScope'
        ];

        constructor(
            private $location: ng.ILocationService,
            public $compile: any,
            private $translate: ng.translate.ITranslateService,
            public $messageBusService: Services.MessageBusService,
            public $mapService: Services.MapService,
            public $rootScope: any
            ) {
            //$translate('FILTER_INFO').then((translation) => console.log(translation));
            // NOTE EV: private props in constructor automatically become fields, so mb and map are superfluous.
            this.mb = $messageBusService;
            this.map = $mapService;

            this.accentColor = '';
            this.title = '';
            //this.layerGroup       = new L.LayerGroup<L.ILayer>();
            this.typesResources = {};
            this.featureTypes = {};
            this.propertyTypeData = {};
            //this.map.map.addLayer(this.layerGroup);
            //this.noStyles = true;
            this.currentLocale = $translate.preferredLanguage();
            // init map renderers
            this.mapRenderers = {};
            this.visual = new VisualState();

            // add renderers
            this.mapRenderers["leaflet"] = new LeafletRenderer();
            this.mapRenderers["leaflet"].init(this);

            this.mapRenderers["cesium"] = new CesiumRenderer();
            this.mapRenderers["cesium"].init(this);

            this.selectRenderer("leaflet");
            //this.mapRenderers["leaflet"].enable();

            this.initLayerSources();

            //this.$dashboardService.init();

            $messageBusService.subscribe('timeline', (trigger: string) => {
                switch (trigger) {
                    case 'focusChange':
                        this.updateSensorData();
                        break;
                }
            });

            $messageBusService.subscribe('language', (title: string, language: string) => {
                switch (title) {
                    case 'newLanguage':
                        this.currentLocale = language;
                        $messageBusService.notifyWithTranslation('LAYER_SERVICE.RELOAD_PROJECT_TITLE', 'LAYER_SERVICE.RELOAD_PROJECT_MSG');
                        this.openProject(this.projectUrl);
                        break;
                }
            });

            $messageBusService.subscribe('mapbbox', (title: string, bbox: string) => {
                if (title === "update") {
                    for (var l in this.loadedLayers) {
                        var layer = <ProjectLayer>this.loadedLayers[l];
                        if (layer.refreshBBOX) {
                            layer.BBOX = bbox;
                            layer.layerSource.refreshLayer(layer);
                        }
                    }
                }

            });
        }

        /**
         * Initialize the available layer sources
         */
        private initLayerSources() {
            // init layer sources
            this.layerSources = {};

            // add a topo/geojson source
            var geojsonsource = new GeoJsonSource(this);

            this.layerSources["geojson"] = geojsonsource;
            this.layerSources["topojson"] = geojsonsource;
            this.layerSources["dynamicgeojson"] = new DynamicGeoJsonSource(this);

            // add wms source
            this.layerSources["wms"] = new WmsSource(this);

            //add tile layer
            this.layerSources["tilelayer"] = new TileLayerSource(this);

            //add heatmap layer
            this.layerSources["heatmap"] = new HeatmapSource(this);

            //add hierarchy layer
            this.layerSources["hierarchy"] = new HierarchySource(this);

            //add grid layer
            this.layerSources["grid"] = new GridDataSource(this);

            //add day or night data source
            this.layerSources["daynight"] = new NightDayDataSource(this);

            // add RSS data source
            this.layerSources["rss"] = new RssDataSource(this);

            // check for every feature (de)select if layers should automatically be activated
            this.checkFeatureSubLayers();
        }

        private removeSubLayers(feature: IFeature) {
            if (!feature || !feature.fType) return;
            var props = csComp.Helpers.getPropertyTypes(feature.fType, this.propertyTypeData);

            props.forEach((prop: IPropertyType) => {
                if (prop.type === "layer" && feature.properties.hasOwnProperty(prop.label)) {
                    var l = feature.properties[prop.label];

                    if (this.loadedLayers.containsKey(l)) {
                        var layer = this.loadedLayers[l];
                        this.removeLayer(this.loadedLayers[l], true);
                    }
                }
            });

        }

        /**
        check for every feature (de)select if layers should automatically be activated
        */
        private checkFeatureSubLayers() {
            this.$messageBusService.subscribe('feature', (action: string, feature: IFeature) => {
                if (!feature || !feature.fType) return;
                var props = csComp.Helpers.getPropertyTypes(feature.fType, this.propertyTypeData);
                switch (action) {
                    case 'onFeatureDeselect':
                        // check sub-layers

                        break;
                    case 'onFeatureSelect':
                        // check sub-layers
                        props.forEach((prop: IPropertyType) => {
                            if (prop.type === "matrix" && prop.activation === "automatic" && feature.properties.hasOwnProperty(prop.label)) {
                                var matrix = feature.properties[prop.label];
                                this.project.features.forEach(f=> {
                                    if (f.layer == feature.layer && f.properties.hasOwnProperty(prop.targetid) && matrix.hasOwnProperty(f.properties[prop.targetid])) {
                                        var newValue = matrix[f.properties[prop.targetid]];
                                        for (var val in newValue) {
                                            f.properties[val] = newValue[val];
                                        }
                                    }
                                });
                                this.updateGroupFeatures(feature.layer.group);
                            }
                            if (prop.type === "layer" && prop.activation === "automatic" && feature.properties.hasOwnProperty(prop.label)) {
                                this.removeSubLayers(feature.layer.lastSelectedFeature);

                                feature.layer.lastSelectedFeature = feature;

                                var l = feature.properties[prop.label];

                                var pl = new ProjectLayer();
                                if (typeof l === 'string') {
                                    pl.url = l;
                                }
                                else {
                                    pl = l;
                                }

                                if (!pl.id) pl.id = l;
                                if (!pl.group) {
                                    pl.group = feature.layer.group;
                                }
                                else {
                                    if (typeof pl.group === 'string') {
                                        pl.group = this.findGroupById(<any>pl.group);
                                    }
                                }
                                if (!pl.type) pl.type = feature.layer.type;
                                if (!pl.title) pl.title = feature.properties["Name"] + " " + prop.title;
                                if (!pl.defaultFeatureType) pl.defaultFeatureType = "link";
                                //pl.parentFeature = feature;
                                pl.group.layers.push(pl);
                                this.addLayer(pl);
                            }
                        });
                        break;
                }

            });
        }

        public loadRequiredLayers(layer: ProjectLayer) {
            // find layer source, and activate layer
            var layerSource = layer.type.toLowerCase();
            // if a layer is depends on other layers, load those first
            if (this.layerSources.hasOwnProperty(layerSource)) {
                if (this.layerSources[layerSource].requiresLayer) {
                    var requiredLayers: ProjectLayer[] = this.layerSources[layerSource].getRequiredLayers(layer) || [];
                    requiredLayers.forEach((l) => {
                        this.addLayer(l);
                    });
                }
            }
        }

        public addLayer(layer: ProjectLayer, layerloaded?: Function) {
            if (this.loadedLayers.containsKey(layer.id) && (!layer.quickRefresh || layer.quickRefresh == false)) return;
            this.$messageBusService.publish('layer', 'loading', layer);
            this.$messageBusService.publish('updatelegend', 'title', layer.defaultLegendProperty);
            var disableLayers = [];
            async.series([
                (callback) => {
                    // check if in this group only one layer can be active
                    // make sure all existising active layers are disabled
                    if (layer.group.oneLayerActive) {
                        layer.group.layers.forEach((l: ProjectLayer) => {
                            if (l !== layer && l.enabled) {
                                disableLayers.push(l);
                            }
                        });
                    }
                    callback(null, null);
                },
                (callback) => {
                    console.log('loading types : ' + layer.typeUrl);
                    if (layer.typeUrl) { this.loadTypeResources(layer.typeUrl, () => callback(null, null)); } else { callback(null, null); }
                },
                (callback) => {
                    // load required feature layers, if applicable
                    this.loadRequiredLayers(layer);

                    // load type resources

                    // find layer source, and activate layer
                    var layerSource = layer.type.toLowerCase();
                    if (this.layerSources.hasOwnProperty(layerSource)) {
                        layer.layerSource = this.layerSources[layerSource];
                        // load layer from source
                        layer.layerSource.addLayer(layer, (l) => {
                            l.enabled = true;
                            this.loadedLayers[layer.id] = l;
                            this.updateSensorData();
                            this.activeMapRenderer.addLayer(layer);
                            if (layer.defaultLegendProperty) this.checkLayerLegend(layer, layer.defaultLegendProperty);
                            this.checkLayerTimer(layer);
                            this.$messageBusService.publish('layer', 'activated', layer);
                            if (layerloaded) layerloaded(layer);
                        });
                    }
                    callback(null, null);
                },
                (callback) => {
                    // now remove the layers that need to be disabled
                    disableLayers.forEach((l) => {
                        this.removeLayer(l);
                        l.enabled = false;
                    });
                    callback(null, null);
                }
            ]);
        }

        /** load external type resource for a project or layer */
        public loadTypeResources(url: any, callback: Function) {
            if (url != 'undefined') {
                // todo check for list of type resources
                if (typeof url === 'string') {
                    if (!this.typesResources.hasOwnProperty(url)) {
                        $.getJSON(url, (resource: TypeResource) => {
                            resource.url = url;
                            this.initTypeResources(resource);
                            callback();
                        });
                    } else { callback(); }
                }
                else {
                    callback();
                }
            }
        }

        /** add a types resource (project, resource file or layer) */
        public initTypeResources(source: any) { //reset
            this.typesResources[source.url] = source;
            var featureTypes = source.featureTypes;
            if (featureTypes) {
                for (var typeName in featureTypes) {
                    if (!featureTypes.hasOwnProperty(typeName)) continue;
                    var featureType: IFeatureType = featureTypes[typeName];
                    featureType.id = typeName;
                    this.initFeatureType(featureType);
                    this.featureTypes[typeName] = featureType;
                }
            }
            if (source.propertyTypeData) {
                for (var key in source.propertyTypeData) {
                    var propertyType: IPropertyType = source.propertyTypeData[key];
                    this.initPropertyType(propertyType);
                    if (!propertyType.label) propertyType.label = key;
                    this.propertyTypeData[key] = propertyType;
                }
            }
        }

        checkLayerLegend(layer: ProjectLayer, property: string) {
            var ptd = this.propertyTypeData[property];
            if (ptd && ptd.legend) {
                var gs: GroupStyle;
                if (layer.group.styles && (layer.group.styles.length > 0)) {
                    gs = layer.group.styles[0];  // TODO: when do we need a different one than the first?
                } else {
                    gs = new GroupStyle(this.$translate);
                    layer.group.styles.push(gs);
                }
                gs.title = ptd.title;
                gs.id = Helpers.getGuid();
                gs.activeLegend = ptd.legend;
                gs.group = layer.group;
                gs.property = ptd.label;
                gs.legends[ptd.title] = ptd.legend;
                gs.colorScales[ptd.title] = ['purple', 'purple'];
                gs.enabled = true;
                gs.visualAspect = (ptd.legend.visualAspect)
                    ? ptd.legend.visualAspect
                    : 'strokeColor';  // TODO: let this be read from the propertyTypeData

                this.saveStyle(layer.group, gs);
                this.project.features.forEach((fe: IFeature) => {
                    if (fe.layer.group == layer.group) {
                        this.calculateFeatureStyle(fe);
                        this.activeMapRenderer.updateFeature(fe);
                    }
                });

                // upon deactivation of the layer? (but other layers can also have active styles)
                this.mb.publish('updatelegend', 'title', property);
            }
        }

        /**
         * Check whether we need to enable the timer to refresh the layer.
         */
        private checkLayerTimer(layer: ProjectLayer) {
            if (!layer.refreshTimer) return;
            if (layer.enabled) {
                if (!layer.timerToken) {
                    layer.timerToken = setInterval(() => {
                        layer.layerSource.refreshLayer(layer);
                    }, layer.refreshTimer * 1000);
                    console.log(`Timer started for ${layer.title}: ${layer.timerToken}`);
                }
            } else if (layer.timerToken) {
                clearInterval(layer.timerToken);
                layer.timerToken = null;
            }
        }

        removeStyle(style: GroupStyle) {
            var g = style.group;
            g.styles = g.styles.filter((s: GroupStyle) => s.id !== style.id);

            this.updateGroupFeatures(g);
        }

        updatePropertyStyle(k: string, v: any, parent: any) {
            // method of class LayerService
            /* k, v is key-value pair of style.colorScales => key is a string */
            /* value is in most cases a list of two strings. actually it is not used in this function */
            /* parent is a ??which class??  ($parent in stylelist.tpl.html) */
            //alert('key = ' + k + '; value = ' + v);
            var l: Legend;
            l = parent.style.legends[k];
            if (l && (l.legendEntries.length > 0)) {
                var e1: LegendEntry = l.legendEntries[0];
                var e2: LegendEntry = l.legendEntries[l.legendEntries.length - 1];
                parent.style.colors = [e1.color, e2.color];
            }
            parent.style.activeLegend = l;
        }

        updateStyle(style: GroupStyle) {
            //console.log('update style ' + style.title);
            if (style == null) return;
            if (style.group != null && style.group.styles[0] != null) {
                if (style.group.styles[0].fixedColorRange) {
                    style.info = style.group.styles[0].info;
                } else {
                    style.info = this.calculatePropertyInfo(style.group, style.property);
                }
                style.canSelectColor = style.visualAspect.toLowerCase().indexOf('color') > -1;
                this.updateGroupFeatures(style.group);
            }
        }

        private updateGroupFeatures(group: ProjectGroup) {
            this.project.features.forEach((f: IFeature) => {
                if (f.layer.group == group) {
                    this.calculateFeatureStyle(f);
                    this.activeMapRenderer.updateFeature(f);
                }
            });
        }

        public updateFeatureTypes(featureType: IFeatureType) {
            this.project.features.forEach((f: IFeature) => {
                if (f.featureTypeName === featureType.id) {
                    this.calculateFeatureStyle(f);
                    this.activeMapRenderer.updateFeature(f);
                }
            });
        }

        public selectRenderer(renderer: string) {
            if (this.activeMapRenderer && this.activeMapRenderer.title === renderer) return;

            if (this.activeMapRenderer) this.activeMapRenderer.disable();

            if (this.mapRenderers.hasOwnProperty(renderer)) {
                this.activeMapRenderer = this.mapRenderers[renderer];
                this.activeMapRenderer.enable();
            }
        }


        public selectFeature(feature: IFeature) {
            feature.isSelected = !feature.isSelected;

            this.calculateFeatureStyle(feature);
            this.activeMapRenderer.updateFeature(feature);


            // deselect last feature and also update
            if (this.lastSelectedFeature != null && this.lastSelectedFeature !== feature) {
                this.lastSelectedFeature.isSelected = false;
                this.calculateFeatureStyle(this.lastSelectedFeature);
                this.activeMapRenderer.updateFeature(this.lastSelectedFeature);
                this.$messageBusService.publish('feature', 'onFeatureDeselect', this.lastSelectedFeature);
            }
            this.lastSelectedFeature = feature;


            if (!feature.isSelected) {
                this.$messageBusService.publish('feature', 'onFeatureDeselect', feature);

                var rpt = new RightPanelTab();
                rpt.container = 'featureprops';
                this.$messageBusService.publish('rightpanel', 'deactivate', rpt);
            } else {
                // var rpt = csComp.Helpers.createRightPanelTab('featurerelations', 'featurerelations', feature, 'Related features', '{{"RELATED_FEATURES" | translate}}', 'link');
                // this.$messageBusService.publish('rightpanel', 'activate', rpt);
                var rpt = csComp.Helpers.createRightPanelTab('featureprops', 'featureprops', feature, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'info');
                this.$messageBusService.publish('rightpanel', 'activate', rpt);
                this.$messageBusService.publish('feature', 'onFeatureSelect', feature);
            }
        }

        /** update for all features the active sensor data values and update styles */
        public updateSensorData() {
            if (this.project == null || this.project.timeLine == null || this.project.features == null) return;

            var date = this.project.timeLine.focus;
            var timepos = {};

            this.project.datasources.forEach((ds:DataSource)=>{
              for (var sensorTitle in ds.sensors){
                var sensor = <SensorSet>ds.sensors[sensorTitle];
                if (sensor.timestamps){
                  for (var i = 1; i < sensor.timestamps.length; i++) {
                    if (sensor.timestamps[i] > date) {
                      sensor.activeValue = sensor.values[i];
                      console.log('updateSensor: sensor.activeValue = ' + sensor.activeValue + " - " + i);
                      break;
                    }
                  }
                }

              };
            });


            this.project.features.forEach((f: IFeature) => {
                var l = this.findLayer(f.layerId);

                if (l != null) {
                    if (f.sensors || f.coordinates) {
                        var getIndex = (d: Number, timestamps: Number[]) => {
                            for (var i = 1; i < timestamps.length; i++) {
                                if (timestamps[i] > d) {
                                    return i;
                                }
                            }
                            return timestamps.length - 1;
                        }
                        var pos = 0;
                        if (f.timestamps) // check if feature contains timestamps
                        {
                            pos = getIndex(date, f.timestamps);
                        } else if (l.timestamps) {
                            if (timepos.hasOwnProperty(f.layerId)) {
                                pos = timepos[f.layerId];
                            }
                            else {
                                pos = getIndex(date, l.timestamps);
                                timepos[f.layerId] = pos;
                            }
                        }

                        // check if a new coordinate is avaiable
                        if (f.coordinates && f.geometry && f.coordinates.length > pos && f.coordinates[pos] != f.geometry.coordinates) {
                            f.geometry.coordinates = f.coordinates[pos];
                            // get marker
                            if (l.group.markers.hasOwnProperty(f.id)) {
                                var m = l.group.markers[f.id]
                                // update position
                                m.setLatLng(new L.LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]));
                            }
                        }
                        if (f.sensors) {
                            for (var sensorTitle in f.sensors) {
                                var sensor = f.sensors[sensorTitle];
                                var value = sensor[pos];
                                f.properties[sensorTitle] = value;
                            }
                            this.calculateFeatureStyle(f);
                            this.activeMapRenderer.updateFeature(f);

                            if (f.isSelected) this.$messageBusService.publish("feature", "onFeatureUpdated", f);
                        }
                    }
                }
            });
        }

        /***
         * get list of properties that are part of the filter collection
         */
        private filterProperties(group: ProjectGroup): string[] {
            var result = [];
            if (group.filters != null && group.filters.length > 0) {
                group.filters.forEach((f: GroupFilter) => {
                    result.push(f.property);
                });
            };
            return result;
        }

        /**
         * init feature (add to feature list, crossfilter)
         */
        public initFeature(feature: IFeature, layer: ProjectLayer): IFeatureType {
            if (!feature.isInitialized) {
                feature.isInitialized = true;
                if (feature.properties == null) feature.properties = {};
                feature.index = layer.count++;
                // make sure it has an id
                if (feature.id == null) feature.id = Helpers.getGuid();
                feature.layerId = layer.id;
                feature.layer = layer;

                // add feature to global list of features
                this.project.features.push(feature);

                // add to crossfilter
                layer.group.ndx.add([feature]);

                // resolve feature type
                feature.fType = this.getFeatureType(feature);
                this.initFeatureType(feature.fType);

                // add missing properties
                if (feature.fType.showAllProperties) csComp.Helpers.addPropertyTypes(feature, feature.fType);

                // Do we have a name?
                if (!feature.properties.hasOwnProperty('Name'))
                    Helpers.setFeatureName(feature);

                this.calculateFeatureStyle(feature);
            }
            return feature.type;
        }

        /** remove feature */
        public removeFeature(feature: IFeature) {
            this.project.features = this.project.features.filter((f: IFeature) => { return f != feature; });
            feature.layer.group.ndx.remove([feature]);
            this.activeMapRenderer.removeFeature(feature);
        }

        /**
        * Calculate the effective feature style.
        */
        public calculateFeatureStyle(feature: IFeature) {
            var s: csComp.Services.IFeatureTypeStyle = {};
            //TODO: check compatibility for both heatmaps and other features
            //s.fillColor = 'red';
            //s.strokeWidth = 1;
            //s.stroke        = false;
            s.strokeWidth = 1;
            s.strokeColor = 'black';
            s.fillOpacity = 0.75;
            s.opacity = 1;
            s.rotate = 0;
            //s.strokeColor = 'black';
            //s.iconHeight = 32;
            //s.iconWidth = 32;
            //s.cornerRadius = 20;

            var ft = this.getFeatureType(feature);
            if (ft.style) {
                if (ft.style.fillOpacity !== null) s.fillOpacity = ft.style.fillOpacity;
                if (ft.style.opacity !== null) s.opacity = ft.style.opacity;
                if (ft.style.fillColor !== null) s.fillColor = csComp.Helpers.getColorString(ft.style.fillColor);
                if (ft.style.stroke !== null) s.stroke = ft.style.stroke;
                if (ft.style.strokeColor !== null) s.strokeColor = csComp.Helpers.getColorString(ft.style.strokeColor, '#fff');
                if (ft.style.strokeWidth !== null) s.strokeWidth = ft.style.strokeWidth;
                if (ft.style.selectedStrokeColor != null) s.selectedStrokeColor = csComp.Helpers.getColorString(ft.style.selectedStrokeColor, '#000');
                if (ft.style.selectedFillColor != null) s.selectedFillColor = csComp.Helpers.getColorString(ft.style.selectedFillColor);
                if (ft.style.selectedStrokeWidth != null) s.selectedStrokeWidth = ft.style.selectedStrokeWidth;
                if (ft.style.iconWidth !== null) s.iconWidth = ft.style.iconWidth;
                if (ft.style.iconHeight !== null) s.iconHeight = ft.style.iconHeight;
                if (ft.style.modelUri !== null) s.modelUri = ft.style.modelUri;
                if (ft.style.modelScale !== null) s.modelScale = ft.style.modelScale;
                if (ft.style.modelMinimumPixelSize !== null) s.modelMinimumPixelSize = ft.style.modelMinimumPixelSize;
                if (ft.style.innerTextProperty !== null) s.innerTextProperty = ft.style.innerTextProperty;
                if (ft.style.innerTextSize !== null) s.innerTextSize = ft.style.innerTextSize;
                if (ft.style.cornerRadius !== null) s.cornerRadius = ft.style.cornerRadius;
                if (ft.style.rotateProperty && feature.properties.hasOwnProperty(ft.style.rotateProperty)) {
                    s.rotate = Number(feature.properties[ft.style.rotateProperty]);
                }
            }

            feature.layer.group.styles.forEach((gs: GroupStyle) => {
                if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
                    var v = Number(feature.properties[gs.property]);
                    if (!isNaN(v)) {
                        switch (gs.visualAspect) {
                            case 'strokeColor':
                                s.strokeColor = csComp.Helpers.getColor(v, gs);
                                break;
                            case 'fillColor':
                                s.fillColor = csComp.Helpers.getColor(v, gs);
                                break;
                            case 'strokeWidth':
                                s.strokeWidth = ((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin) * 10) + 1;
                                break;
                            case 'height':
                                s.height = ((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin) * 25000);
                                break;
                        }
                    } else {
                        var ss = feature.properties[gs.property];
                        switch (gs.visualAspect) {
                            case 'strokeColor':
                                s.strokeColor = csComp.Helpers.getColorFromStringValue(ss, gs);
                                break;
                            case 'fillColor':
                                s.fillColor = csComp.Helpers.getColorFromStringValue(ss, gs);
                                break;
                        }
                    }
                    //s.fillColor = this.getColor(feature.properties[layer.group.styleProperty], null);
                }
            });

            if (feature.isSelected) {
                s.strokeWidth = s.selectedStrokeWidth || 5;
                s.strokeColor = s.selectedStrokeColor || 'black';
                if (s.selectedFillColor) s.fillColor = s.selectedFillColor;
            }
            feature.effectiveStyle = s;
        }

        /**
        * Initialize the feature type and its property types by setting default property values, and by localizing it.
        */
        private initFeatureType(ft: IFeatureType) {
            if (ft.languages != null && this.currentLocale in ft.languages) {
                var locale = ft.languages[this.currentLocale];
                if (locale.name) ft.name = locale.name;
            }
            if (ft.propertyTypeData == null || ft.propertyTypeData.length == 0) return;
            ft.propertyTypeData.forEach((pt) => {
                this.initPropertyType(pt);
            });
        }

        /**
        * Initialize the property type with default values, and, if applicable, localize it.
        */
        private initPropertyType(pt: IPropertyType) {
            this.setDefaultPropertyType(pt);
            if (pt.languages != null) this.localizePropertyType(pt);
        }

        /**
        * Set default PropertyType's properties:
        * type              = text
        * visibleInCallout  = true
        * canEdit           = false
        * isSearchable      = true
        */
        private setDefaultPropertyType(pt: IPropertyType) {
            if (!pt.type) pt.type = "text";
            if (typeof pt.title == 'undefined') pt.title = pt.label;
            if (typeof pt.canEdit == 'undefined') pt.canEdit = false;
            if (typeof pt.visibleInCallOut == 'undefined') pt.visibleInCallOut = true;
            if (typeof pt.isSearchable == 'undefined' && pt.type === 'text') pt.isSearchable = true;
        }

        private localizePropertyType(pt: IPropertyType) {
            if (pt.languages != null && this.currentLocale in pt.languages) {
                var locale = pt.languages[this.currentLocale];
                if (locale.title) pt.title = locale.title;
                if (locale.description) pt.description = locale.description;
                if (locale.section) pt.section = locale.section;
                if (locale.options != null) pt.options = locale.options;
            };
        }

        /**
         * find a filter for a specific group/property combination
         */
        private findFilter(group: ProjectGroup, property: string): GroupFilter {
            if (group.filters == null) group.filters = [];
            var r = group.filters.filter((f: GroupFilter) => f.property === property);
            if (r.length > 0) return r[0];
            return null;
        }

        /**
         * Find a feature by layerId and FeatureId.
         * @layerId {string}
         * @featureIndex {number}
         */
        findFeatureById(layerId: string, featureIndex: number): IFeature {
            for (var i = 0; i < this.project.features.length; i++) {
                var feature = this.project.features[i];
                if (featureIndex === feature.index && layerId === feature.layerId)
                    return feature;
            }
        }

        /**
         * Find a group by id
         */
        findGroupById(id: string): ProjectGroup {
            for (var i = 0; i < this.project.groups.length; i++) {
                if (this.project.groups[i].id === id) return this.project.groups[i];
            }
            return null;
        }

        /**
         * Find the feature by name.
         */
        findFeatureByName(name: string): IFeature {
            for (var i = 0; i < this.project.features.length; i++) {
                var feature = this.project.features[i];
                if (feature.hasOwnProperty("Name") && name === feature.properties["Name"])
                    return feature;
            }
        }

        /**
        * Find a loaded layer with a specific id.
        */
        findLoadedLayer(id: string): ProjectLayer {
            if (this.loadedLayers.containsKey(id)) return this.loadedLayers[id];
            return null;
        }

        /**
         * Find a layer with a specific id.
         */
        findLayer(id: string): ProjectLayer {
            if (this.loadedLayers.containsKey(id)) return this.loadedLayers[id];
            //return null;
            var r: ProjectLayer;
            this.project.groups.forEach(g => {
                g.layers.forEach(l => {
                    if (l.id === id) {
                        r = l;
                    }
                });
            });
            return r;
        }

        /**
         * Creates a GroupStyle based on a property and adds it to a group.
         * If the group already has a style which contains legends, those legends are copied into the newly created group.
         * Already existing groups (for the same visualAspect) are replaced by the new group
         */
        public setStyle(property: any, openStyleTab = false, customStyleInfo?: PropertyInfo) {
            // parameter property is of the type ICallOutProperty. explicit declaration gives the red squigglies
            var f: IFeature = property.feature;
            if (f != null) {
                var ft = this.getFeatureType(f);

                // for debugging: what do these properties contain?
                var layer = f.layer;
                var lg = layer.group;

                var gs = new GroupStyle(this.$translate);
                gs.id = Helpers.getGuid();
                gs.title = property.key;
                gs.meta = property.meta;
                gs.visualAspect = (ft.style && ft.style.drawingMode && ft.style.drawingMode.toLowerCase() == 'line') ? 'strokeColor' : 'fillColor';
                gs.canSelectColor = gs.visualAspect.toLowerCase().indexOf('color') > -1;

                gs.property = property.property;
                if (customStyleInfo) {
                    gs.info = customStyleInfo;
                    gs.fixedColorRange = true;
                } else {
                    if (gs.info == null) gs.info = this.calculatePropertyInfo(layer.group, property.property);
                }

                gs.enabled = true;
                gs.group = layer.group;
                gs.meta = property.meta;

                var ptd = this.propertyTypeData[property.property];
                if (ptd && ptd.legend) {
                    gs.activeLegend = ptd.legend;
                    gs.legends[ptd.title] = ptd.legend;
                    gs.colorScales[ptd.title] = ['purple', 'purple'];
                }
                if (ft.style && ft.style.fillColor) {
                    gs.colors = ['white', 'orange'];
                } else {
                    gs.colors = ['red', 'white', 'blue'];
                }
                this.saveStyle(layer.group, gs);
                this.project.features.forEach((fe: IFeature) => {
                    if (fe.layer.group == layer.group) {
                        this.calculateFeatureStyle(fe);
                        this.activeMapRenderer.updateFeature(fe);
                    }
                });
                if (openStyleTab) (<any>$('#leftPanelTab a[href="#styles"]')).tab('show'); // Select tab by name
                return gs;
            }
            return null;
        }

        /**
         * checks if there are other styles that affect the same visual aspect, removes them (it)
         * and then adds the style to the group's styles
         */
        private saveStyle(group: ProjectGroup, style: GroupStyle) {
            var oldStyles = group.styles.filter((s: GroupStyle) => s.visualAspect === style.visualAspect);
            if (oldStyles.length > 0) {
                var pos = group.styles.indexOf(oldStyles[0]);
                group.styles.splice(pos, 1);   // RS, 2015-04-04: why delete only one style? (what if oldStyles.length > 1)
            }
            group.styles.push(style);
        }

        addFilter(group: ProjectGroup, prop: string) {
            var filter = this.findFilter(group, prop);
            if (filter == null) {

                var gf = new GroupFilter();
                gf.property = prop;
                //gf.filterType = "row";
                gf.title = prop;
                gf.rangex = [0, 1];
                group.filters.push(gf);
                // add filter
            } else {
                var pos = group.filters.indexOf(filter);
                if (pos !== -1) group.filters.slice(pos, 1);

            }
            (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
        }

        /**
         * enable a filter for a specific property
         */
        setFilter(filter: GroupFilter, group: csComp.Services.ProjectGroup) {
            filter.group = group;
            group.filters.push(filter);
            (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
            this.mb.publish("filters", "updated");
        }

        /**
        * enable a filter for a specific property
        */
        setPropertyFilter(property: FeatureProps.CallOutProperty) {
            var prop = property.property;
            var f = property.feature;
            if (f != null) {
                var layer = f.layer;
                if (layer != null) {
                    var filter = this.findFilter(layer.group, prop);
                    if (filter == null) {
                        var gf = new GroupFilter();
                        gf.property = prop;
                        gf.id = Helpers.getGuid();
                        gf.group = layer.group;
                        gf.meta = property.meta;
                        gf.filterType = 'bar';
                        if (gf.meta != null) {
                            if (gf.meta.filterType != null) {
                                gf.filterType = gf.meta.filterType;
                            } else {
                                switch (gf.meta.type) {
                                    case "date":
                                        gf.filterType = 'date';
                                        break;
                                    case 'number':
                                    case 'options':
                                        gf.filterType = 'bar';
                                        break;
                                    //case 'rank':
                                    //    gf.filterType  = 'bar';
                                    //    gf.value = property.value.split(',')[0];
                                    //    break;
                                    default:
                                        gf.filterType = 'text';
                                        gf.stringValue = property.value;
                                        gf.value = property.value;
                                        break;
                                }
                            }
                        }

                        gf.title = property.key;
                        gf.rangex = [0, 1];

                        if (gf.filterType === 'text') {
                            var old = layer.group.filters.filter((flt: GroupFilter) => flt.filterType === 'text');
                            old.forEach((groupFilter: GroupFilter) => {
                                groupFilter.dimension.filterAll();
                                groupFilter.dimension.dispose();
                            });
                            layer.group.filters = layer.group.filters.filter((groupFilter: GroupFilter) => groupFilter.filterType !== 'text');
                        }
                        // add filter
                        layer.group.filters.push(gf);
                    } else {
                        var pos = layer.group.filters.indexOf(filter);
                        if (pos !== -1)
                            layer.group.filters.slice(pos, 1);
                    }
                }
                (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
            }
            this.mb.publish("filters", "updated");
        }

        /** remove filter from group */
        public removeFilter(filter: GroupFilter) {
            // dispose crossfilter dimension
            filter.dimension.dispose();
            filter.group.filters = filter.group.filters.filter(f=> { return f != filter; });
            this.resetMapFilter(filter.group);
            this.mb.publish("filters", "updated");
        }

        /**
         * Return the feature style for a specific feature.
         * First, look for a layer specific feature type, otherwise, look for a project-specific feature type.
         * In case both fail, create a default feature type at the layer level.
         */
        getFeatureType(feature: IFeature): IFeatureType {
            if (feature.fType) return feature.fType;
            var projectFeatureTypeName = feature.properties['FeatureTypeId'] || feature.layer.defaultFeatureType || 'Default';
            var featureTypeName = feature.layerId + '_' + projectFeatureTypeName;
            if (!(this.featureTypes.hasOwnProperty(featureTypeName))) {
                if (this.featureTypes.hasOwnProperty(projectFeatureTypeName))
                    featureTypeName = projectFeatureTypeName;
                else
                    this.featureTypes[featureTypeName] = csComp.Helpers.createDefaultType(feature);
            }
            feature.featureTypeName = featureTypeName;
            return this.featureTypes[featureTypeName];
        }



        resetFilters() {
            dc.filterAll();
            dc.redrawAll();
        }

        private getGroupFeatures(g: ProjectGroup): Array<IFeature> {
            // find active layers
            var ls = [];
            g.layers.forEach((l: ProjectLayer) => { if (l.enabled) ls.push(l.id); });

            // add active features
            var r = this.project.features.filter((k: IFeature) => ls.indexOf(k.layerId) > -1);
            return r;
        }

        rebuildFilters(g: ProjectGroup) {
            // remove all data from crossfilter group
            g.ndx = crossfilter([]);

            var features = this.getGroupFeatures(g);

            g.ndx.add(features);
        }

        /**
         * deactivate layer
         */
        removeLayer(layer: ProjectLayer, removeFromGroup: boolean = false) {
            var m: any;
            var g = layer.group;

            layer.enabled = false;
            //if (layer.refreshTimer) layer.stop();

            // make sure the timers are disabled
            this.checkLayerTimer(layer);

            this.loadedLayers.remove(layer.id);

            // find layer source, and remove layer
            if (!layer.layerSource) layer.layerSource = this.layerSources[layer.type.toLowerCase()];
            layer.layerSource.removeLayer(layer);


            if (this.lastSelectedFeature != null && this.lastSelectedFeature.layerId === layer.id) {
                this.lastSelectedFeature = null;
                var rpt = new RightPanelTab();
                rpt.container = "featureprops";
                this.$messageBusService.publish('rightpanel', 'deactivate', rpt);
                this.$messageBusService.publish('feature', 'onFeatureDeselect');

            }

            //m = layer.group.vectors;
            this.activeMapRenderer.removeLayer(layer);
            // if (g.clustering) {
            //     m = g.cluster;
            //     this.project.features.forEach((feature: IFeature) => {
            //         if (feature.layerId === layer.id) {
            //             try {
            //                 m.removeLayer(layer.group.markers[feature.id]);
            //                 delete layer.group.markers[feature.id];
            //             } catch (error) {
            //
            //             }
            //         }
            //     });
            // } else {
            //
            //     if (layer.mapLayer) this.map.map.removeLayer(layer.mapLayer);
            // }

            this.project.features = this.project.features.filter((k: IFeature) => k.layerId !== layer.id);
            var layerName = layer.id + '_';
            var featureTypes = this.featureTypes;
            for (var poiTypeName in featureTypes) {
                if (!featureTypes.hasOwnProperty(poiTypeName)) continue;
                //if (poiTypeName.lastIndexOf(layerName, 0) === 0) delete featureTypes[poiTypeName];
            }

            // check if there are no more active layers in group and remove filters/styles
            if (g.layers.filter((l: ProjectLayer) => { return (l.enabled); }).length === 0) {
                g.filters.forEach((f: GroupFilter) => { if (f.dimension != null) f.dimension.dispose(); });
                g.filters = [];
                g.styles = [];
            }

            this.rebuildFilters(g);
            layer.enabled = false;
            if (removeFromGroup) layer.group.layers = layer.group.layers.filter((pl: ProjectLayer) => pl != layer);
            if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
            this.$messageBusService.publish('layer', 'deactivate', layer);
            this.$messageBusService.publish('rightpanel', 'deactiveContainer', 'edit');
        }

        /***
         * Open solution file with references to available baselayers and projects
         * @params url: URL of the solution
         * @params layers: Optionally provide a semi-colon separated list of layer IDs that should be opened.
         * @params initialProject: Optionally provide a project name that should be loaded, if omitted the first project in the definition will be loaded
         */
        openSolution(url: string, layers?: string, initialProject?: string): void {
            //console.log('layers (openSolution): ' + JSON.stringify(layers));
            this.loadedLayers.clear();

            $.getJSON(url, (solution: Solution) => {
                //var projects = data;
                if (solution.maxBounds) {
                    this.maxBounds = solution.maxBounds;
                    this.$mapService.map.setMaxBounds(new L.LatLngBounds(solution.maxBounds.southWest, solution.maxBounds.northEast));
                }
                if (solution.viewBounds)
                    this.activeMapRenderer.fitBounds(new L.LatLngBounds(solution.viewBounds.southWest, solution.viewBounds.northEast));

                solution.baselayers.forEach(b => {
                    var baselayer: BaseLayer = new BaseLayer();

                    if (b.subdomains != null) baselayer.subdomains = b.subdomains;
                    if (b.maxZoom != null) baselayer.maxZoom = b.maxZoom;
                    if (b.minZoom != null) baselayer.minZoom = b.minZoom;
                    if (b.attribution != null) baselayer.attribution = b.attribution;
                    if (b.id != null) baselayer.id = b.id;
                    if (b.title != null) baselayer.title = b.title;
                    if (b.subtitle != null) baselayer.subtitle = b.subtitle;
                    if (b.preview != null) baselayer.preview = b.preview;
                    if (b.url != null) baselayer.url = b.url;
                    if (b.cesium_url != null) baselayer.cesium_url = b.cesium_url;
                    if (b.cesium_maptype != null) baselayer.cesium_maptype = b.cesium_maptype;

                    this.$mapService.baseLayers[b.title] = baselayer;
                    if (b.isDefault) {
                        this.activeMapRenderer.changeBaseLayer(baselayer);
                        this.$mapService.changeBaseLayer(b.title);
                    }
                });
                //$scope.projects = projects.projects;
                if (solution.projects.length > 0) {
                    var p = solution.projects.filter((aProject: SolutionProject) => { return aProject.title === initialProject; })[0];
                    if (p != null) {
                        this.openProject(p, layers);
                    } else {
                        this.openProject(solution.projects[0], layers);
                    }
                }

                this.solution = solution;
            });
        }

        /**
        * Clear all layers.
        */
        private clearLayers() {
            if (this.project == null || this.project.groups == null) return;
            this.project.groups.forEach((group) => {
                group.layers.forEach((layer: ProjectLayer) => {
                    if (layer.enabled) {
                        this.removeLayer(layer);
                        layer.enabled = false;
                    }
                });
            });
        }

        /**
         * Open project
         * @params url: URL of the project
         * @params layers: Optionally provide a semi-colon separated list of layer IDs that should be opened.
         */
        public openProject(solutionProject: csComp.Services.SolutionProject, layers?: string): void {
            this.projectUrl = solutionProject;
            //console.log('layers (openProject): ' + JSON.stringify(layers));
            var layerIds: Array<string> = [];
            if (layers) {
                layers.split(';').forEach((layerId) => { layerIds.push(layerId.toLowerCase()); });
            }
            //console.log('layerIds (openProject): ' + JSON.stringify(layerIds));
            this.clearLayers();
            this.featureTypes = {};
            //typesResources

            $.getJSON(solutionProject.url, (prj: Project) => {
                this.project = new Project().deserialize(prj);

                if (!this.project.timeLine) {
                    this.project.timeLine = new DateRange();
                }
                else {
                    // Set range
                    this.$messageBusService.publish('timeline', 'updateTimerange', this.project.timeLine);
                }

                if (this.project.viewBounds) {
                    this.activeMapRenderer.fitBounds(new L.LatLngBounds(this.project.viewBounds.southWest, this.project.viewBounds.northEast));
                }

                this.initTypeResources(this.project);

                if (!this.project.dashboards) {
                    this.project.dashboards = [];
                    var d = new Services.Dashboard();
                    d.id = "map";
                    d.name = "Home";
                    d.showMap = true;
                    d.showLeftmenu = true;
                    d.widgets = [];
                    this.project.dashboards.push(d);
                } else {

                    this.project.dashboards.forEach((d) => {
                        if (!d.id) d.id = Helpers.getGuid();
                        if (d.widgets && d.widgets.length > 0)
                            d.widgets.forEach((w) => {
                                if (!w.id) w.id = Helpers.getGuid();
                                if (!w.enabled) w.enabled = true;
                            });
                    });
                }
                async.series([
                    (callback) => {
                        if (this.project.typeUrls && this.project.typeUrls.length > 0) {
                            async.eachSeries(this.project.typeUrls, (item, cb) => {
                                this.loadTypeResources(item, () => cb(null, null));

                            }, () => {
                                    callback(null, null);
                                })


                        }
                        else {
                            callback(null, null);
                        }
                    },
                    (callback) => {
                        if (this.project.datasources) {
                            this.project.datasources.forEach((ds: DataSource) => {
                                if (ds.url) {
                                    DataSource.LoadData(ds, () => {
                                        console.log('datasource loaded');
                                        if (ds.type === "dynamic") this.checkDataSourceSubscriptions(ds);

                                        for (var s in ds.sensors) {
                                            var ss: SensorSet = ds.sensors[s];
                                            /// check if there is an propertytype available for this sensor
                                            if (ss.propertyTypeKey != null && this.propertyTypeData.hasOwnProperty(ss.propertyTypeKey)) {
                                                ss.propertyType = this.propertyTypeData[ss.propertyTypeKey];
                                            }
                                            else // else create a new one and store in project
                                            {
                                                var id = "sensor-" + Helpers.getGuid();
                                                var pt: IPropertyType = {};
                                                pt.title = s;
                                                ss.propertyTypeKey = id;
                                                this.project.propertyTypeData[id] = pt;
                                                ss.propertyType = pt;
                                            }
                                            if (ss.values && ss.values.length > 0) ss.activeValue = ss.values[ss.values.length - 1];
                                        }
                                    });
                                }
                            });
                        }
                    }
                ]);



                if (!this.project.dataSets)
                    this.project.dataSets = [];

                this.project.features = [];

                if (this.project.groups && this.project.groups.length > 0) {
                    this.project.groups.forEach((group: ProjectGroup) => {

                        this.initGroup(group, layerIds);

                        if (prj.startposition)
                            this.$mapService.zoomToLocation(new L.LatLng(prj.startposition.latitude, prj.startposition.longitude));


                    });
                }
                if (this.project.connected) {
                    // check connection
                    this.$messageBusService.initConnection("", "", () => {
                    });
                }

                // check if project is dynamic
                if (solutionProject.dynamic) {
                    this.$messageBusService.serverSubscribe(this.project.id, "project", (sub: string, msg: any) => {
                        if (msg.action === "layer-update") {
                            msg.data.layer.forEach((l: ProjectLayer) => {
                                var g: ProjectGroup;
                                // find group
                                if (l.groupId) { g = this.findGroupById(l.groupId); } else { l.groupId = "main"; }
                                if (!g) {
                                    g = new ProjectGroup();
                                    g.id = l.groupId;
                                    g.title = l.title;
                                    g.clustering = msg.data.group.clustering;
                                    g.clusterLevel = msg.data.group.clusterLevel;
                                    this.project.groups.push(g);
                                    this.initGroup(g);
                                } else {
                                    g.clustering = msg.data.group.clustering;
                                    g.clusterLevel = msg.data.group.clusterLevel;
                                }
                                var layerExists = false;
                                var layerIndex;
                                g.layers.forEach((gl, index) => {
                                    if (gl.id === l.id) {
                                        layerExists = true;
                                        layerIndex = index;
                                    }
                                })
                                if (!layerExists) {
                                    g.layers.push(l);
                                    this.initLayer(g, l);
                                } else {
                                    if (this.lastSelectedFeature && this.lastSelectedFeature.isSelected) this.selectFeature(this.lastSelectedFeature);
                                    if (!l.layerSource) l.layerSource = this.layerSources[l.type.toLowerCase()];
                                    l.layerSource.refreshLayer(g.layers[layerIndex]);
                                }
                                if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }

                            });

                            // init group
                            // add layer

                        }
                        if (msg.action === "layer-remove") {
                            msg.data.forEach((l: ProjectLayer) => {
                                var g: ProjectGroup;
                                // find group
                                if (l.groupId) { g = this.findGroupById(l.groupId); } else { l.groupId = "main"; }
                                if (g != null) {
                                    g.layers.forEach((layer: ProjectLayer) => {
                                        if (layer.id == l.id) {
                                            this.removeLayer(layer, true);
                                            //console.log('remove layer'+layer.id);
                                        }
                                    });

                                    if (g.layers.length == 0) {
                                        this.removeGroup(g);
                                    }
                                }
                            });
                            // find group
                            // find layer
                            // remove layer

                        }
                    });
                }

                this.$messageBusService.publish('project', 'loaded', this.project);
                if (this.project.dashboards && this.project.dashboards.length > 0)
                    this.$messageBusService.publish('dashboard-main', 'activated', this.project.dashboards[Object.keys(this.project.dashboards)[0]]);
            });
        }

        public removeGroup(group: ProjectGroup) {
            if (group.layers) {
                group.layers.forEach((l: ProjectLayer) => {
                    if (l.enabled) this.removeLayer(l, true);
                })
            }
            group.ndx = null;
            this.project.groups = this.project.groups.filter((g: ProjectGroup) => g != group);
            if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
        }

        /** initializes project group (create crossfilter index, clustering, initializes layers) */
        public initGroup(group: ProjectGroup, layerIds?: string[]) {
            if (group.id == null) group.id = Helpers.getGuid();

            group.ndx = crossfilter([]);
            if ((group.styles) && (group.styles.length > 0)) {
                var styleId: string = group.styles[0].id;
                //var legend: Legend;
                //var url: string = "dummylegend.json";
                //$.getJSON(url,(data: Legend) => {
                //    legend = new Legend().deserialize(data);
                //}
            };
            if (group.styles == null) group.styles = [];
            if (group.filters == null) group.filters = [];
            group.markers = {};
            if (group.languages != null && this.currentLocale in group.languages) {
                var locale = group.languages[this.currentLocale];
                if (locale.title) group.title = locale.title;
                if (locale.description) group.description = locale.description;
            }
            if (group.clustering) {
                group.cluster = new L.MarkerClusterGroup({
                    maxClusterRadius: group.maxClusterRadius || 80,
                    disableClusteringAtZoom: group.clusterLevel || 0
                });

                this.map.map.addLayer(group.cluster);
            } else {
                group.vectors = new L.LayerGroup<L.ILayer>();
                this.map.map.addLayer(group.vectors);
            }
            if (!group.layers) group.layers = [];
            group.layers.forEach((layer: ProjectLayer) => {
                this.initLayer(group, layer, layerIds);
            });

            group.styles.forEach((style: GroupStyle) => {
                if (style.id != null) style.id = Helpers.getGuid();
            });

            group.filters.forEach((filter: GroupFilter) => {
                if (filter.id != null) filter.id = Helpers.getGuid();
            });


        }

        /** initializes a layer (check for id, language, references group, add to active map renderer) */
        public initLayer(group: ProjectGroup, layer: ProjectLayer, layerIds?: string[]) {
            if (layer.id == null) layer.id = Helpers.getGuid();
            layer.type = (layer.type) ? layer.type.toLowerCase() : "geojson";
            layer.renderType = (layer.renderType) ? layer.renderType.toLowerCase() : layer.type;
            if (layer.reference == null) layer.reference = layer.id; //Helpers.getGuid();
            if (layer.title == null) layer.title = layer.id;
            if (layer.languages != null && this.currentLocale in layer.languages) {
                var locale = layer.languages[this.currentLocale];
                if (locale.title) layer.title = locale.title;
                if (locale.description) layer.description = locale.description;
            }

            layer.group = group;
            if (!layer.groupId) layer.groupId = group.id;
            if (layer.enabled || (layerIds && layerIds.indexOf(layer.reference.toLowerCase()) >= 0)) {
                layer.enabled = true;
                this.activeMapRenderer.addLayer(layer);
            }
        }

        checkDataSourceSubscriptions(ds: DataSource) {
            for (var s in ds.sensors) {
                this.$messageBusService.serverSubscribe(s, "sensor", (sub: string, msg: any) => {
                    if (msg.action === "sensor-update") {
                        var d = msg.data[0];
                        var ss: SensorSet = ds.sensors[d.sensor];
                        if (ss != null) {
                            ss.timestamps.push(d.date);
                            ss.values.push(d.value);
                            while (ss.timestamps.length > 30) {
                                ss.timestamps.shift();
                                ss.values.shift();
                            }
                            ss.activeValue = d.value;
                            this.$messageBusService.publish("sensor-" + ds.id + "/" + d.sensor, "update", ss.activeValue);
                            this.$rootScope.$apply();
                        }
                    }
                });
            }
        }

        checkSubscriptions() {
            this.project.datasources.forEach((ds: DataSource) => {
                if (ds.url && ds.type === "dynamic") { this.checkDataSourceSubscriptions(ds); }
            });
        }

        closeProject() {
            if (this.project == null) return;
            this.project.groups.forEach((group: ProjectGroup) => {
                group.layers.forEach((layer: ProjectLayer) => {
                    if (layer.enabled) {
                        this.removeLayer(layer);
                    }
                });
            });
        }

        public findSensorSet(key: string, callback: Function) {
            var kk = key.split('/');
            if (kk.length == 2) {
                var source = kk[0];
                var sensorset = kk[1];
                if (!this.project.datasources || this.project.datasources.length === 0) return null;
                this.project.datasources.forEach((ds: DataSource) => {
                    if (ds.id === source) {
                        if (ds.sensors.hasOwnProperty(sensorset)) {
                            callback(ds.sensors[sensorset]);
                        }
                    }
                });
            }
            return null;
        }

        //private zoom(data: any) {
        //    //var a = data;
        //}

        /**
         * Calculate min/max/count for a specific property in a group
         */
        public calculatePropertyInfo(group: ProjectGroup, property: string): PropertyInfo {
            var r = new PropertyInfo();
            r.count = 0;
            var sum = 0;   // stores sum of elements
            var sumsq = 0; // stores sum of squares

            group.layers.forEach((l: ProjectLayer) => {
                if (l.enabled) {
                    this.project.features.forEach((f: IFeature) => {
                        if (f.layerId === l.id && f.properties.hasOwnProperty(property)) {
                            var s = f.properties[property];
                            var v = Number(s);
                            if (!isNaN(v)) {
                                r.count += 1;
                                sum = sum + v;
                                sumsq = sumsq + v * v;
                                if (r.max == null || v > r.max) r.max = v;
                                if (r.min == null || v < r.min) r.min = v;
                            }
                        }
                    });
                }
            });
            if (isNaN(sum) || r.count == 0) {
                r.sdMax = r.max;
                r.sdMin = r.min;
            } else {
                r.mean = sum / r.count;
                r.varience = sumsq / r.count - r.mean * r.mean;
                r.sd = Math.sqrt(r.varience);
                r.sdMax = r.mean + 3 * r.sd;
                r.sdMin = r.mean - 3 * r.sd;
                if (r.min > r.sdMin) r.sdMin = r.min;
                if (r.max < r.sdMax) r.sdMax = r.max;
                if (r.sdMin === NaN) r.sdMin = r.min;
                if (r.sdMax === NaN) r.sdMax = r.max;
            }
            if (this.propertyTypeData.hasOwnProperty(property)) {
                var mid = this.propertyTypeData[property];
                if (mid.maxValue != null) r.sdMax = mid.maxValue;
                if (mid.minValue != null) r.sdMin = mid.minValue;
            }
            return r;
        }



        public updateFilterGroupCount(group: ProjectGroup) {
            if (group.filterResult != null)
                $('#filtergroupcount_' + group.id).text(group.filterResult.length + ' objecten geselecteerd');
        }




        private addScatterFilter(group: ProjectGroup, filter: GroupFilter) {


            var info = this.calculatePropertyInfo(group, filter.property);
            var info2 = this.calculatePropertyInfo(group, filter.property2);


            var divid = 'filter_' + filter.id;
            //$("<h4>" + filter.title + "</h4><div id='" + divid + "'></div><a class='btn' id='remove" + filter.id + "'>remove</a>").appendTo("#filters_" + group.id);
            //$("<h4>" + filter.title + "</h4><div id='" + divid + "'></div><div style='display:none' id='fdrange_" + filter.id + "'>from <input type='text' style='width:75px' id='fsfrom_" + filter.id + "'> to <input type='text' style='width:75px' id='fsto_" + filter.id + "'></div><a class='btn' id='remove" + filter.id + "'>remove</a>").appendTo("#filterChart");
            $('<h4>' + filter.title + '</h4><div id=\'' + divid + '\'></div><div style=\'display:none\' id=\'fdrange_' + filter.id + '\'>from <span id=\'fsfrom_' + filter.id + '\'/> to <span id=\'fsto_' + filter.id + '\'/></div><a class=\'btn\' id=\'remove' + filter.id + '\'>remove</a>').appendTo('#filterChart');

            $('#remove' + filter.id).on('click', () => {
                var pos = group.filters.indexOf(filter);
                if (pos !== -1) group.filters.splice(pos, 1);
                filter.dimension.dispose();

                this.resetMapFilter(group);
            });

            var dcChart = <any>dc.scatterPlot('#' + divid);

            var prop1 = group.ndx.dimension(d => {
                if (!d.properties.hasOwnProperty(filter.property)) return null;
                else {
                    if (d.properties[filter.property] != null) {

                        var a = parseInt(d.properties[filter.property]);
                        var b = parseInt(d.properties[filter.property2]);
                        if (a >= info.sdMin && a <= info.sdMax) {
                            return [a, b];
                            //return Math.floor(a / binWidth) * binWidth;
                        } else {
                            //return null;
                        }
                    }
                    return [0, 0];

                    //return a;
                }
            });



            filter.dimension = prop1;
            var dcGroup1 = prop1.group();

            //var scale =
            dcChart.width(275)
                .height(190)
                .dimension(prop1)
                .group(dcGroup1)
                .x(d3.scale.linear().domain([info.sdMin, info.sdMax]))
                .yAxisLabel(filter.property2)
                .xAxisLabel(filter.property)
                .on('filtered', (e) => {
                var fil = e.hasFilter();
                dc.events.trigger(() => {
                    group.filterResult = prop1.top(Infinity);
                    this.updateFilterGroupCount(group);
                }, 0);
                dc.events.trigger(() => {
                    this.updateMapFilter(group);
                }, 100);
            });


            dcChart.xUnits(() => { return 13; });



            //if (filter.meta != null && filter.meta.minValue != null) {
            //    dcChart.x(d3.scale.linear().domain([filter.meta.minValue, filter.meta.maxValue]));
            //} else {
            //    var propInfo = this.calculatePropertyInfo(group, filter.property);
            //    var dif = (propInfo.max - propInfo.min) / 100;
            //    dcChart.x(d3.scale.linear().domain([propInfo.min - dif, propInfo.max + dif]));
            //}

            dcChart.yAxis().ticks(15);
            dcChart.xAxis().ticks(15);
            //this.updateChartRange(dcChart, filter);
            //.x(d3.scale.quantile().domain(dcGroup.all().map(function (d) {
            //return d.key;
            //   }))
            //.range([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
        }



        /***
         * Update map markers in cluster after changing filter
         */
        public updateMapFilter(group: ProjectGroup) {
            this.activeMapRenderer.updateMapFilter(group);
        }

        public resetMapFilter(group: ProjectGroup) {
            $.each(group.markers, (key, marker) => {
                if (group.clustering) {
                    var incluster = group.cluster.hasLayer(marker);
                    if (!incluster) group.cluster.addLayer(marker);
                } else {
                    var onmap = group.vectors.hasLayer(marker);
                    if (!onmap) group.vectors.addLayer(marker);
                }
            });
        }
    }

    /**
      * Register service
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    myModule.service('layerService', csComp.Services.LayerService)
}
