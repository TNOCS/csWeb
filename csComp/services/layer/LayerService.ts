module csComp.Services {
    'use strict';

    export enum ActionType {
        Context = 0,
        Hover = 1
    }

    export interface IActionOption {
        title: string;
        icon: string;
        feature: IFeature;
        callback: Function;
    }

    export interface IActionService {
        id: string;
        init(ls: LayerService);
        stop();
        addFeature(feature: IFeature);
        removeFeature(feature: IFeature);
        selectFeature(feature: IFeature);
        getFeatureActions(feature: IFeature): IActionOption[];
        getFeatureHoverActions(feature: IFeature): IActionOption[];
        deselectFeature(feature: IFeature);
        updateFeature(feuture: IFeature);
    }

    /** describes a layer source, every layer has a layer source that is responsible for importing the data (e.g. geojson, wms, etc */
    export interface ILayerSource {
        title: string;
        service: LayerService;
        addLayer(layer: ProjectLayer, callback: Function);
        removeLayer(layer: ProjectLayer): void;
        refreshLayer(layer: ProjectLayer): void;
        requiresLayer: boolean;
        getRequiredLayers?(layer: ProjectLayer): ProjectLayer[];
        layerMenuOptions(layer: ProjectLayer): [[string, Function]];
    }

    /** layer service is responsible for reading and managing all project, layer and sensor related data */
    export class LayerService {
        maxBounds: IBoundingBox;
        title: string;
        accentColor: string;
        mb: Services.MessageBusService;
        map: Services.MapService;
        _featureTypes: { [key: string]: IFeatureType; };
        propertyTypeData: { [key: string]: IPropertyType; };

        project: Project;
        projectUrl: SolutionProject; // URL of the current project
        solution: Solution;
        openSingleProject: boolean; // True if the solution should only contain one project
        emptySolutionUrl: string;
        dimension: any;
        lastSelectedFeature: IFeature;
        selectedFeatures: IFeature[];
        selectedLayerId: string;
        timeline: any;
        _activeContextMenu: IActionOption[];
        editing: boolean;
        directoryHandle: MessageBusHandle;

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

        actionServices: IActionService[] = [];

        currentContour: L.GeoJSON;

        startDashboardId: string;

        public visual: VisualState = new VisualState();
        throttleTimelineUpdate: Function;

        static $inject = [
            '$location',
            '$compile',
            '$translate',
            'messageBusService',
            'mapService',
            '$rootScope',
            'geoService',
            '$http'
        ];

        constructor(
            private $location: ng.ILocationService,
            public $compile: any,
            private $translate: ng.translate.ITranslateService,
            public $messageBusService: Services.MessageBusService,
            public $mapService: Services.MapService,
            public $rootScope: any,
            public geoService: GeoService,
            public $http: ng.IHttpService
            ) {
            //$translate('FILTER_INFO').then((translation) => console.log(translation));
            // NOTE EV: private props in constructor automatically become fields, so mb and map are superfluous.
            this.mb = $messageBusService;
            this.map = $mapService;

            this.openSingleProject = false;
            this.emptySolutionUrl = 'data/api/defaultSolution.json';
            this.accentColor = '';
            this.title = '';
            this.typesResources = {};
            this._featureTypes = {};
            this.propertyTypeData = {};
            this.selectedFeatures = [];
            this.currentLocale = $translate.preferredLanguage();
            // init map renderers
            this.mapRenderers = {};
            this.visual = new VisualState();

            // add renderers
            this.mapRenderers["leaflet"] = new LeafletRenderer();
            this.mapRenderers["leaflet"].init(this);

            this.mapRenderers["cesium"] = new CesiumRenderer();
            this.mapRenderers["cesium"].init(this);

            this.initLayerSources();
            this.throttleTimelineUpdate = _.throttle(this.updateAllLogs, 500);

            $messageBusService.subscribe('timeline', (trigger: string) => {
                switch (trigger) {
                    case 'focusChange':
                        this.updateSensorData();
                        this.throttleTimelineUpdate();
                        //this.updateAllLogs();
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

            $messageBusService.subscribe("geo", (action, loc: csComp.Services.Geoposition) => {
                switch (action) {
                    case "pos":
                        //alert(loc.coords.latitude + " - " + loc.coords.longitude);
                        break;
                }
            });

            //this.geoService.start();

            this.addActionService(new LayerActions());

            var delayFocusChange = _.throttle((date) => {
                for (var l in this.loadedLayers) {
                    var layer = <ProjectLayer>this.loadedLayers[l];
                    if (layer.timeDependent) {
                        layer.layerSource.refreshLayer(layer);
                    }
                }
            }, 1000);

            $messageBusService.subscribe("timeline", (action: string, date: Date) => {
                if (action === "focusChange") { delayFocusChange(date); }
            });
        }

        public getActions(feature: IFeature, type: ActionType): IActionOption[] {
            if (!feature || typeof type !== 'number') return;
            var options = [];
            if (type === ActionType.Context) {
                this.actionServices.forEach((as: csComp.Services.IActionService) => {
                    var asOptions = as.getFeatureActions(feature);
                    if (asOptions) options = options.concat(asOptions);
                });
                options.forEach((a: IActionOption) => {
                    a.feature = feature;
                })
            } else if (type === ActionType.Hover) {
                this.actionServices.forEach((as: csComp.Services.IActionService) => {
                    var asOptions = as.getFeatureHoverActions(feature);
                    if (asOptions) options = options.concat(asOptions);
                });
                options.forEach((a: IActionOption) => {
                    a.feature = feature;
                })
            }
            return options;
        }

        public addActionService(as: IActionService) {
            var asAlreadyExists = false;
            this.actionServices.some((actServ) => {
                if (actServ.id === as.id) {
                    asAlreadyExists = true;
                    return true;
                }
                return false;
            });
            if (asAlreadyExists) {
                console.log('Actionservice ' + as.id + ' already exists.')
            } else {
                this.actionServices.push(as);
                as.init(this);
            }
        }

        public removeActionService(as: IActionService) {
            as.stop();
        }

        /** Find a dashboard by ID */
        public findDashboardById(dashboardId: string) {
            var dashboard: csComp.Services.Dashboard;
            this.project.dashboards.some(d => {
                if (d.id !== dashboardId) return false;
                dashboard = d;
                return true;
            });
            return dashboard;
        }

        /** Find a widget by ID, optionally supplying its parent dashboard id. */
        public findWidgetById(widgetId: string, dashboardId?: string) {
            var dashboard: csComp.Services.Dashboard;
            var widget: csComp.Services.IWidget;
            if (dashboardId) {
                dashboard = this.findDashboardById(dashboardId);
                if (!dashboard) return null;
                dashboard.widgets.some(w => {
                    if (w.id !== widgetId) return false;
                    widget = w;
                    return true;
                });
            } else {
                this.project.dashboards.some(d => {
                    d.widgets.some(w => {
                        if (w.id !== widgetId) return false;
                        widget = w;
                        return true;
                    });
                    if (!widget) return false;
                    return true;
                });
            }
            return widget;
        }

        /**
         * Initialize the available layer sources
         */
        private initLayerSources() {
            // init layer sources
            this.layerSources = {};

            // add a topo/geojson source
            var geojsonsource = new GeoJsonSource(this, this.$http);

            this.layerSources["geojson"] = geojsonsource;
            this.layerSources["topojson"] = geojsonsource;
            this.layerSources["dynamicgeojson"] = new DynamicGeoJsonSource(this, this.$http);
            this.layerSources["esrijson"] = new EsriJsonSource(this, this.$http);

            // add kml source
            var kmlDataSource = new KmlDataSource(this, this.$http);
            this.layerSources["kml"] = kmlDataSource;
            this.layerSources["gpx"] = kmlDataSource;

            // add wms source
            this.layerSources["wms"] = new WmsSource(this);

            //add tile layer
            this.layerSources["tilelayer"] = new TileLayerSource(this);

            //add heatmap layer
            this.layerSources["heatmap"] = new HeatmapSource(this);

            //add hierarchy layer
            this.layerSources["hierarchy"] = new HierarchySource(this, this.$http);

            //add grid layer
            this.layerSources["grid"] = new GridDataSource(this, this.$http);

            //add day or night data source
            this.layerSources["daynight"] = new NightDayDataSource(this, this.$http);

            // add RSS data source
            this.layerSources["rss"] = new RssDataSource(this, this.$http);

            // add Database data source
            this.layerSources["database"] = new DatabaseSource(this);

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
                            if (prop.type === "layer" && feature.properties.hasOwnProperty(prop.label)) {
                                if (prop.activation === "automatic") this.removeSubLayers(feature.layer.lastSelectedFeature);

                                feature.layer.lastSelectedFeature = feature;

                                var l = feature.properties[prop.label];
                                var pl = this.findLayer(l);
                                if (pl) {
                                    this.addLayer(pl);
                                }
                                else {
                                    if (typeof l === 'string') {
                                        pl = new ProjectLayer();
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
                                }
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
            if (layer.isLoading) return;
            layer.isLoading = true;
            this.$messageBusService.publish('layer', 'loading', layer);
            var disableLayers = [];
            async.series([
                (callback) => {
                    // check if in this group only one layer can be active
                    // make sure all existising active layers are disabled
                    if (layer.group.oneLayerActive) {
                        layer.group.layers.forEach((l: ProjectLayer) => {
                            if (l.id !== layer.id && l.enabled) {
                                disableLayers.push(l);
                            }
                        });
                    }
                    callback(null, null);
                },
                (callback) => {
                    console.log('loading types : ' + layer.typeUrl);
                    if (layer.typeUrl) {
                        this.loadTypeResources(layer.typeUrl, layer.dynamicResource || false, () => callback(null, null));
                    } else {
                        callback(null, null);
                    }
                },
                (callback) => {
                    // load required feature layers, if applicable
                    this.loadRequiredLayers(layer);

                    // load type resources

                    // find layer source, and activate layer
                    var layerSource = layer.type.toLowerCase();
                    if (!this.layerSources.hasOwnProperty(layerSource)) {
                        // We don't know how to deal with an unknown layer source, so stop here.
                        layer.isLoading = false;
                        callback(null, null);
                        // TODO Stop spinner
                        return;
                    }
                    layer.layerSource = this.layerSources[layerSource];
                    // load layer from source
                    if (layer.type === 'database') {
                        this.$messageBusService.serverSubscribe(layer.id, "layer", (sub: string, msg: any) => {
                            console.log(msg);
                            if (msg.action === "layer-update") {
                                if (!msg.data.group) {
                                    msg.data.group = this.findGroupByLayerId(msg.data);
                                }
                                this.addLayer(msg.data, () => { });
                            }
                        });
                    }
                    layer.layerSource.addLayer(layer, (l) => {
                        if (layerloaded) layerloaded(layer);
                        this.$messageBusService.publish('layer', 'activated', layer);

                        if (l.enabled) {
                            this.loadedLayers[layer.id] = l;
                            this.updateSensorData();
                            this.updateAllLogs();
                            this.activeMapRenderer.addLayer(layer);
                            if (layer.defaultLegendProperty) this.checkLayerLegend(layer, layer.defaultLegendProperty);
                            this.checkLayerTimer(layer);
                            //this.$messageBusService.publish('layer', 'activated', layer);
                            this.$messageBusService.publish('updatelegend', 'updatedstyle');
                            //if (layerloaded) layerloaded(layer);
                        }
                    });
                    this.$messageBusService.publish("timeline", "updateFeatures");
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

        public expandGroup(layer: ProjectLayer) {
            // expand the group in the layerlist if it is collapsed
            if (!layer || !layer.group) return;
            var id = "#layergroup_" + layer.group.id;
            (<any>$(id)).collapse("show");
            $('*[data-target="' + id + '"]').removeClass('collapsed');
            //(<any>$('div#layergroupStyle')).removeClass('collapsed');
            //
            if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
        }

        public collapseAll() {
            this.project.groups.forEach((g) => {
                var layerEnabled = false;
                g.layers.some((l) => {
                    if (l.enabled) layerEnabled = true;
                    return l.enabled;
                });
                if (!layerEnabled) {
                    var id = "#layergroup_" + g.id;
                    (<any>$(id)).collapse("hide");
                    $('*[data-target="' + id + '"]').addClass('collapsed');
                }
            });
        }

        public expandAll() {
            this.project.groups.forEach((g) => {
                var id = "#layergroup_" + g.id;
                if (!(<any>$(id)).hasClass("in")) {
                    (<any>$(id)).collapse("show");
                    $('*[data-target="' + id + '"]').removeClass('collapsed');
                }
            });
        }

        /** load external type resource for a project or layer */
        public loadTypeResources(url: any, requestReload: boolean, callback: Function) {
            if (url) {
                // todo check for list of type resources
                if (typeof url === 'string') {
                    if (!this.typesResources.hasOwnProperty(url) || requestReload) {
                        var success = false;
                        this.$http.get(url)
                            .success((resource: TypeResource) => {
                            success = true;
                            resource.url = url;
                            this.initTypeResources(resource);
                            this.$messageBusService.publish("typesource", url, resource);
                            callback();
                        })
                            .error((err) => {
                            this.$messageBusService.notify('ERROR loading TypeResources', 'While loading: ' + url);
                            console.log(err)
                        });
                        setTimeout(() => {
                            if (!success) {
                                callback();
                            }
                        }, 3000);
                    } else {
                        //make sure featureTypes in typeResources are initialized,
                        //which is not the case when switching projects
                        this.initTypeResources(this.typesResources[url]);
                        callback();
                    }
                } else {
                    callback();
                }
            }
        }

        /**
         * returns a list of all project layers in all groups
         */
        public allLayers(): ProjectLayer[] {
            var res: ProjectLayer[] = [];
            if (this.project == null || this.project.groups == null) return [];
            this.project.groups.forEach((p: ProjectGroup) => {
                if (p.layers) res = res.concat(p.layers);
            });
            return res;
        }

        /** add a types resource (project, resource file or layer) */
        public initTypeResources(source: any) { //reset
            this.typesResources[source.url] = source;
            if (!source.title) source.title = source.url;
            var featureTypes = source.featureTypes;
            if (featureTypes) {
                for (var typeName in featureTypes) {
                    var tn = source.url + "#" + typeName;
                    //if (!this._featureTypes.hasOwnProperty(tn)) continue;
                    var featureType: IFeatureType = featureTypes[typeName];
                    featureType.id = tn;
                    this.initFeatureType(featureType);
                    this._featureTypes[tn] = featureType;
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
                    if (fe.layer === layer) {
                        this.calculateFeatureStyle(fe);
                        this.activeMapRenderer.updateFeature(fe);
                    }
                });
                // upon deactivation of the layer? (but other layers can also have active styles)
                this.mb.publish('updatelegend', 'title', property);
            } else {
                //when no layer is defined, set the given propertytype as styled property (and trigger creating a dynamic legend subsequently)
                this.project.features.some((f) => {
                    if (f.properties.hasOwnProperty(property)) {
                        var pt = this.getPropertyType(f, property);
                        this.setStyle({ feature: f, property: property, key: pt.title || property });
                        return true;
                    }
                    return false;
                });
            }
        }

        /**
         * Check whether we need to enable the timer to refresh the layer.
         */
        private checkLayerTimer(layer: ProjectLayer) {
            if (!layer.refreshTimeInterval) return;
            if (layer.enabled) {
                if (!layer.timerToken) {
                    layer.timerToken = setInterval(() => {
                        layer.layerSource.refreshLayer(layer);
                    }, layer.refreshTimeInterval * 1000);
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
            this.$messageBusService.publish('updatelegend', 'updatedstyle');
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
            } else {
                parent.style.colors = v;
            }
            parent.style.activeLegend = l;
            this.$messageBusService.publish('updatelegend', 'updatedstyle');
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
            if (!group) return;
            this.project.features.forEach((f: IFeature) => {
                if (f.layer.group == group) {
                    this.calculateFeatureStyle(f);
                    this.activeMapRenderer.updateFeature(f);
                }
            });
        }

        public updateLayerFeatures(layer: ProjectLayer) {
            if (!layer) return;
            this.project.features.forEach((f: IFeature) => {
                if (f.layer.id === layer.id) {
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

        public editFeature(feature: IFeature) {
            feature.gui["editMode"] = true;
            this.selectFeature(feature);
        }

        private deselectFeature(feature: IFeature) {
            feature.isSelected = false;
            this.calculateFeatureStyle(feature);
            this.activeMapRenderer.updateFeature(feature);
        }

        public selectFeature(feature: IFeature, multi = false) {
            feature.isSelected = !feature.isSelected;
            this.actionServices.forEach((as: IActionService) => {
                if (feature.isSelected) { as.selectFeature(feature); } else { as.deselectFeature(feature); }
            })

            // deselect last feature and also update
            if (this.lastSelectedFeature != null && this.lastSelectedFeature !== feature && !multi) {
                this.deselectFeature(this.lastSelectedFeature);

                this.$messageBusService.publish('feature', 'onFeatureDeselect', this.lastSelectedFeature);
            }
            if (feature.isSelected) this.lastSelectedFeature = feature;

            // select new feature, set selected style and bring to front
            this.calculateFeatureStyle(feature);
            this.activeMapRenderer.updateFeature(feature);

            if (multi) {
                if (feature.isSelected) {
                    if (this.selectedFeatures.indexOf(feature) === -1) {
                        this.selectedFeatures.push(feature);
                    }
                }
                else {
                    if (this.selectedFeatures.indexOf(feature) >= 0) {
                        this.selectedFeatures = this.selectedFeatures.filter((f) => { return f.id !== feature.id; });
                    }
                }
            }
            else {
                this.selectedFeatures.forEach((f) => this.deselectFeature(f));
                this.selectedFeatures = (feature.isSelected) ? [feature] : [];
            }

            if (!feature.isSelected) {
                this.$messageBusService.publish('feature', 'onFeatureDeselect', feature);

                // var rpt = new RightPanelTab();
                // rpt.container = 'featureprops';
                // this.$messageBusService.publish('rightpanel', 'deactivate', rpt);
                // rpt.container = 'featurerelations';
                // this.$messageBusService.publish('rightpanel', 'deactivate', rpt);
            } else {
                // var rpt = csComp.Helpers.createRightPanelTab('featurerelations', 'featurerelations', feature, 'Related features', '{{"RELATED_FEATURES" | translate}}', 'link');
                // this.$messageBusService.publish('rightpanel', 'activate', rpt);
                // var rpt = csComp.Helpers.createRightPanelTab('featureprops', 'featureprops', feature, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'info');
                // this.$messageBusService.publish('rightpanel', 'activate', rpt);
                this.$messageBusService.publish('feature', 'onFeatureSelect', feature);
            }
        }

        public updateAllLogs() {
            if (this.project == null || this.project.timeLine == null || this.project.features == null) return;
            this.project.features.forEach((f: IFeature) => {
                if (f.layer.isDynamic && f.layer.useLog) {
                    //if (f.gui.hasOwnProperty("lastUpdate") && this.project.timeLine.focusDate < f.gui["lastUpdate"])
                    this.updateLog(f);
                }
            });
        }

        private lookupLog(logs: Log[], timestamp: number): Log {
            if (!logs || logs.length == 0) return <Log>{};
            var d = logs; //_.sortBy(logs, 'ts');

            if (timestamp <= d[0].ts) return d[0];
            if (timestamp >= d[logs.length - 1].ts) return d[d.length - 1];
            var res = <Log>{};
            for (var i = 0; i < d.length; i++) {
                if (d[i].ts > timestamp) {
                    res = d[i];
                    break;
                }
            }

            return res;
        }

        public updateLog(f: IFeature) {
            var date = this.project.timeLine.focus;
            var changed = false;
            if (f.logs && !this.isLocked(f)) {
                // find all keys
                for (var key in f.logs) {
                    // lookup value
                    var l = this.lookupLog(f.logs[key], date);
                    if (key === "~geometry") {
                        if (l.value != f.geometry) {
                            f.geometry = <IGeoJsonGeometry>l.value;
                            changed = true;
                        }
                    } else {
                        if (!f.properties.hasOwnProperty(key)) {
                            f.properties[key] = l.value;
                            changed = true;
                        } else {
                            if (f.properties[key] != l.value) {
                                f.properties[key] = l.value;
                                changed = true;
                            }
                        }
                    }
                }

                if (changed) {
                    this.calculateFeatureStyle(f);
                    this.updateFeature(f);
                }
            }
        }

        public updateFeature(feature: IFeature) {
            this.activeMapRenderer.updateFeature(feature);
            if (feature === this.lastSelectedFeature) {
                this.$messageBusService.publish("feature", "onFeatureUpdated");
            }
        }

        /** update for all features the active sensor data values and update styles */
        public updateSensorData() {
            if (this.project == null || this.project.timeLine == null || this.project.features == null) return;

            var date = this.project.timeLine.focus;
            var timepos = {};

            if (this.project.datasources) {
                this.project.datasources.forEach((ds: DataSource) => {
                    for (var sensorTitle in ds.sensors) {
                        var sensor = <SensorSet>ds.sensors[sensorTitle];

                        if (sensor.timestamps) {
                            if (sensor.timestamps.length == 1) {
                                sensor.activeValue = sensor.values[0];
                            } else for (var i = 1; i < sensor.timestamps.length; i++) {
                                if (sensor.timestamps[i] < date) {
                                    sensor.activeValue = sensor.values[i];
                                    //console.log('updateSensor: sensor.activeValue = ' + sensor.activeValue + " - " + i);
                                    break;
                                }
                            }
                        }
                    }
                })
            };

            this.project.features.forEach((f: IFeature) => {
                var l = f.layer;

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

                            if (f.isSelected)
                                this.$messageBusService.publish("feature", "onFeatureUpdated", f);
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
        public initFeature(feature: IFeature, layer: ProjectLayer, applyDigest: boolean = false, publishToTimeline: boolean = true): IFeatureType {
            if (!feature.isInitialized) {
                feature.isInitialized = true;
                feature.gui = {};

                if (!feature.logs) feature.logs = {};
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
                    Helpers.setFeatureName(feature, this.propertyTypeData);

                this.calculateFeatureStyle(feature);
                feature.propertiesOld = {};
                this.trackFeature(feature);

                if (applyDigest && this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
                if (publishToTimeline) this.$messageBusService.publish("timeline", "updateFeatures");
            }
            return feature.type;
        }

        /** remove feature */
        public removeFeature(feature: IFeature, dynamic: boolean = false) {

            this.project.features = this.project.features.filter((f: IFeature) => { return f != feature; });
            feature.layer.data.features = feature.layer.data.features.filter((f: IFeature) => { return f != feature; });
            if (feature.layer.group.filterResult)
                feature.layer.group.filterResult = feature.layer.group.filterResult.filter((f: IFeature) => { return f != feature; });
            feature.layer.group.ndx.remove([feature]);
            this.activeMapRenderer.removeFeature(feature);

            if (dynamic) {
                var s = new LayerUpdate();
                s.layerId = feature.layerId;
                s.action = LayerUpdateAction.deleteFeature;
                s.item = feature.id;
                this.$messageBusService.serverSendMessageAction("layer", s);
            }
        }

        /**
        * Calculate the effective feature style.
        */
        public calculateFeatureStyle(feature: IFeature) {
            var s = csComp.Helpers.getDefaultFeatureStyle();

            var ft = this.getFeatureType(feature);
            if (ft.style) {
                if (ft.style.nameLabel) s.nameLabel = ft.style.nameLabel;
                if (ft.style.iconUri) s.iconUri = ft.style.iconUri;
                if (ft.style.fillOpacity) s.fillOpacity = ft.style.fillOpacity;
                if (ft.style.opacity) s.opacity = ft.style.opacity;
                if (ft.style.fillColor) s.fillColor = csComp.Helpers.getColorString(ft.style.fillColor);
                // Stroke is a boolean property, so you have to check whether it is undefined.
                if (typeof ft.style.stroke !== 'undefined') s.stroke = ft.style.stroke;
                if (ft.style.strokeColor) s.strokeColor = csComp.Helpers.getColorString(ft.style.strokeColor, '#fff');
                // StrokeWidth can be 0 (interpreted as false), so you have to check whether it is undefined.
                if (typeof ft.style.strokeWidth !== 'undefined') s.strokeWidth = ft.style.strokeWidth;
                if (ft.style.selectedStrokeColor) s.selectedStrokeColor = csComp.Helpers.getColorString(ft.style.selectedStrokeColor, '#000');
                if (ft.style.selectedFillColor) s.selectedFillColor = csComp.Helpers.getColorString(ft.style.selectedFillColor);
                if (ft.style.selectedStrokeWidth) s.selectedStrokeWidth = ft.style.selectedStrokeWidth;
                if (ft.style.iconWidth) s.iconWidth = ft.style.iconWidth;
                if (ft.style.iconHeight) s.iconHeight = ft.style.iconHeight;
                if (ft.style.modelUri) s.modelUri = ft.style.modelUri;
                if (ft.style.modelScale) s.modelScale = ft.style.modelScale;
                if (ft.style.modelMinimumPixelSize) s.modelMinimumPixelSize = ft.style.modelMinimumPixelSize;
                if (ft.style.innerTextProperty) s.innerTextProperty = ft.style.innerTextProperty;
                if (ft.style.innerTextSize) s.innerTextSize = ft.style.innerTextSize;
                if (ft.style.cornerRadius) s.cornerRadius = ft.style.cornerRadius;
                if (ft.style.rotateProperty && feature.properties.hasOwnProperty(ft.style.rotateProperty)) {
                    s.rotate = Number(feature.properties[ft.style.rotateProperty]);
                }
            }

            feature.gui['style'] = {};
            s.opacity = s.opacity * (feature.layer.opacity / 100);
            s.fillOpacity = s.fillOpacity * (feature.layer.opacity / 100);
            feature.layer.group.styles.forEach((gs: GroupStyle) => {
                if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
                    //delete feature.gui[gs.property];
                    var v = Number(feature.properties[gs.property]);
                    if (!isNaN(v)) {
                        switch (gs.visualAspect) {
                            case 'strokeColor':
                                s.strokeColor = csComp.Helpers.getColor(v, gs);
                                feature.gui['style'][gs.property] = s.strokeColor;
                                break;
                            case 'fillColor':
                                s.fillColor = csComp.Helpers.getColor(v, gs);
                                feature.gui['style'][gs.property] = s.fillColor;
                                break;
                            case 'strokeWidth':
                                s.strokeWidth = ((v - gs.info.min) / (gs.info.max - gs.info.min) * 10) + 1;

                                break;
                            case 'height':
                                s.height = ((v - gs.info.min) / (gs.info.max - gs.info.min) * 25000);
                                break;
                        }
                    } else {
                        var ss = feature.properties[gs.property];
                        switch (gs.visualAspect) {
                            case 'strokeColor':
                                s.strokeColor = csComp.Helpers.getColorFromStringValue(ss, gs);
                                feature.gui['style'][gs.property] = s.strokeColor;
                                break;
                            case 'fillColor':
                                s.fillColor = csComp.Helpers.getColorFromStringValue(ss, gs);
                                feature.gui['style'][gs.property] = s.fillColor;
                                break;
                        }
                    }
                    //s.fillColor = this.getColor(feature.properties[layer.group.styleProperty], null);
                }
            });

            if (feature.isSelected) {
                s.strokeWidth = s.selectedStrokeWidth || 3;
                s.strokeColor = s.selectedStrokeColor || 'black';
                if (s.selectedFillColor) s.fillColor = s.selectedFillColor;
            }
            feature.effectiveStyle = s;
        }

        /**
        * Initialize the feature type and its property types by setting default property values, and by localizing it.
        */
        private initFeatureType(ft: IFeatureType) {
            if (ft.isInitialized) return;
            ft.isInitialized = true;
            if (ft.languages != null && this.currentLocale in ft.languages) {
                var locale = ft.languages[this.currentLocale];
                if (locale.name) ft.name = locale.name;
            }
            if (ft.propertyTypeData == null || ft.propertyTypeData.length == 0) return;
            if (ft.propertyTypeData.forEach) {
                ft.propertyTypeData.forEach((pt) => {
                    this.initPropertyType(pt);
                });
            } else {
                for (var ptlabel in ft.propertyTypeData) {
                    if (ft.propertyTypeData.hasOwnProperty(ptlabel)) {
                        this.initPropertyType(ft.propertyTypeData[ptlabel]);
                    }
                }
            }
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
        findFeatureByIndex(layerId: string, featureIndex: number): IFeature {
            for (var i = 0; i < this.project.features.length; i++) {
                var feature = this.project.features[i];
                if (featureIndex === feature.index && layerId === feature.layerId)
                    return feature;
            }
        }

        /**
         * Find a feature by layerId and FeatureId.
         * @layerId {string}
         * @featureIndex {number}
         */
        findFeatureById(featureId: string): IFeature {
            return _.find(this.project.features, (f: IFeature) => { return f.id === featureId })
        }

        /**
         * Find a feature by layerId and FeatureId.
         * @layer {ProjectLayer}
         * @featureId {number}
         */
        findFeature(layer: ProjectLayer, featureId: string): IFeature {
            return _.find(layer.data.features, (f: IFeature) => { return f.id === featureId })
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
         * Find a group by id
         */
        findGroupByLayerId(layer: ProjectLayer): ProjectGroup {
            if (!layer.id) return null;
            var matchedGroup;
            this.project.groups.some((group) => {
                if (group.layers) {
                    group.layers.some((l) => {
                        if (l.id === layer.id) {
                            matchedGroup = group;
                            return true;
                        }
                        return false;
                    });
                }
                if (matchedGroup) return true;
                return false;
            });
            return matchedGroup;
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
         * Restoring a previously used groupstyle is possible by sending that GroupStyle object
         */
        public setStyle(property: any, openStyleTab = false, customStyleInfo?: PropertyInfo, groupStyle?: GroupStyle) {
            // parameter property is of the type ICallOutProperty. explicit declaration gives the red squigglies
            var f: IFeature = property.feature;
            if (f != null) {
                var ft = this.getFeatureType(f);

                // use the groupstyle that was passed along, or create a new groupstyle if none is present
                var gs;
                if (groupStyle) {
                    gs = groupStyle;
                    gs.info = this.calculatePropertyInfo(f.layer.group, property.property);
                } else {
                    gs = new GroupStyle(this.$translate);
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
                        if (gs.info == null) gs.info = this.calculatePropertyInfo(f.layer.group, property.property);
                    }

                    gs.enabled = true;
                    gs.group = f.layer.group;
                    gs.meta = property.meta;

                    var ptd = this.propertyTypeData[property.property];
                    if (ptd && ptd.legend) {
                        gs.activeLegend = ptd.legend;
                        gs.legends[ptd.title] = ptd.legend;
                        gs.colorScales[ptd.title] = ['purple', 'purple'];
                    }

                    if (ft.style && ft.style.fillColor) {
                        gs.colors = ['white', '#FF5500'];
                    } else {
                        gs.colors = ['red', 'white', 'blue'];
                    }
                }
                this.saveStyle(f.layer.group, gs);
                this.project.features.forEach((fe: IFeature) => {
                    if (fe.layer.group == f.layer.group) {
                        this.calculateFeatureStyle(fe);
                        this.activeMapRenderer.updateFeature(fe);
                    }
                });

                if (openStyleTab) (<any>$('#leftPanelTab a[href="#styles"]')).tab('show'); // Select tab by name
                return gs;
            }
            return null;
        }

        public toggleStyle(property: any, group: ProjectGroup, openStyleTab = false, customStyleInfo?: PropertyInfo) {
            var s = property.feature.layer.group.styles;
            if (!s.some((s: GroupStyle) => s.property === property.property)) {
                this.setStyle(property, openStyleTab, customStyleInfo);
            }
            else {
                s.filter((s: GroupStyle) => s.property === property.property).forEach((st: GroupStyle) => this.removeStyle(st));
            }
            this.$messageBusService.publish('updatelegend', 'updatedstyle');
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
            this.triggerUpdateFilter(group.id);
        }

        setLocationFilter(group: ProjectGroup) {
            if (group.filters.some((f) => { return f.filterType === 'location' })) return;
            var gf = new GroupFilter();
            gf.id = Helpers.getGuid();
            gf.group = group;
            gf.filterType = 'location';
            gf.title = 'Location';
            gf.rangex = [0, 1];
            group.filters.push(gf);
            (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
            this.triggerUpdateFilter(group.id);
        }

        setFeatureAreaFilter(f: IFeature) {
            this.project.groups.forEach(g => {
                if (g.id === f.layer.group.id) return;
                if (!g.filters.some((f) => { return f.filterType === 'area' })) {
                    var gf = new GroupFilter();
                    gf.id = Helpers.getGuid();
                    gf.group = g;
                    gf.filterType = 'area';
                    gf.title = 'Area';
                    gf.rangex = [0, 1];
                    gf.value = f;
                    g.filters.push(gf);
                    g.filterResult = g.filterResult || [];
                }
            });
            // if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
            this.triggerUpdateFilter(f.layer.group.id);
        }

        resetFeatureAreaFilter() {
            this.project.groups.forEach(g => {
                g.filters.some(f => {
                    if (f.filterType === 'area') {
                        this.removeFilter(f);
                        return true;
                    }
                    return false;
                });
            });
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
                        gf.meta = property.propertyType;
                        gf.filterType = 'bar';
                        if (gf.meta != null) {
                            if (gf.meta.filterType != null) {
                                gf.filterType = gf.meta.filterType;
                            } else {
                                switch (gf.meta.type) {
                                    case 'boolean': gf.filterType = 'boolean'; break;
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

                        // if (gf.filterType === 'text') {
                        //     var old = layer.group.filters.filter((flt: GroupFilter) => flt.filterType === 'text');
                        //     old.forEach((groupFilter: GroupFilter) => {
                        //         groupFilter.dimension.filterAll();
                        //         groupFilter.dimension.dispose();
                        //     });
                        //     layer.group.filters = layer.group.filters.filter((groupFilter: GroupFilter) => groupFilter.filterType !== 'text');
                        // }
                        // add filter
                        layer.group.filters.push(gf);
                    } else {
                        this.removeFilter(filter);
                        //layer.group.filters = layer.group.filters.filter((f: GroupFilter) => f.property != property.property);
                        // var pos = layer.group.filters.indexOf(filter);
                        // if (pos !== -1)
                        //     layer.group.filters.slice(pos, 1);
                    }
                }
                (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
            }
            this.triggerUpdateFilter(layer.group.id);
        }

        public createScatterFilter(group: ProjectGroup, prop1: string, prop2: string) {
            console.log("create scatter " + prop1 + "-" + prop2);

            var gf = new GroupFilter();
            gf.property = prop1;
            gf.property2 = prop2
            gf.id = Helpers.getGuid();
            gf.group = group;
            //gf.meta = property.meta;
            gf.filterType = 'scatter';
            // if (gf.meta != null) {
            //     if (gf.meta.filterType != null) {
            //         gf.filterType = gf.meta.filterType;
            //     } else {
            //         switch (gf.meta.type) {
            //             case "date":
            //                 gf.filterType = 'date';
            //                 break;
            //             case 'number':
            //             case 'options':
            //                 gf.filterType = 'bar';
            //                 break;
            //             //case 'rank':
            //             //    gf.filterType  = 'bar';
            //             //    gf.value = property.value.split(',')[0];
            //             //    break;
            //             default:
            //                 gf.filterType = 'text';
            //                 gf.stringValue = property.value;
            //                 gf.value = property.value;
            //                 break;
            //         }
            //     }
            // }
            gf.title = "Scatter";
            gf.rangex = [0, 1];

            // add filter
            group.filters.push(gf);

            (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
            this.triggerUpdateFilter(group.id);
        }

        public triggerUpdateFilter(groupId: string) {
            this.mb.publish("filters", "updated", groupId);
        }

        /** remove filter from group */
        public removeFilter(filter: GroupFilter) {
            // dispose crossfilter dimension
            filter.group.filterResult = filter.dimension.filterAll().top(Infinity);
            filter.dimension.dispose();
            filter.group.filters = filter.group.filters.filter(f=> { return f != filter; });
            this.resetMapFilter(filter.group);
            this.updateMapFilter(filter.group);
            this.triggerUpdateFilter(filter.group.id);
        }

        /**
         * Returs propertytype for a specific property in a feature
         */
        public getPropertyType(feature: IFeature, property: string): IPropertyType {
            var res: IPropertyType;
            // search for local propertytypes in featuretype
            if (feature.fType && feature.fType.propertyTypeData) {
                res = _.find(feature.fType.propertyTypeData, (pt: IPropertyType) => { return pt.label === property });
            }

            if (!res && feature.fType.propertyTypeKeys && feature.layer.typeUrl && this.typesResources.hasOwnProperty(feature.layer.typeUrl)) {
                var rt = this.typesResources[feature.layer.typeUrl];
                feature.fType.propertyTypeKeys.split(';').forEach((key: string) => {
                    if (rt.propertyTypeData.hasOwnProperty(key) && rt.propertyTypeData[key].label === property) res = rt.propertyTypeData[key];
                });
            }

            return res;
        }

        /**
        Returns the featureTypeId for specific feature.
        It looks for the FeatureTypeId property, defaultFeatureType of his layer
        and checks if it should be found in a resource file or within his own layer
        */
        public getFeatureTypeId(feature: IFeature): string {
            if (!feature.hasOwnProperty('layer')) feature['layer'] = new ProjectLayer();
            var name = feature.properties['FeatureTypeId'] || feature.properties['featureTypeId'] || feature.layer.defaultFeatureType || 'Default';

            // if (name.toLowerCase().startsWith("http://")) return name;
            // if (csComp.Helpers.startsWith(name.toLowerCase(), "http://")) return name;
            if (/^http:\/\//.test(name.toLowerCase())) return name;
            if (feature.layer.typeUrl) return feature.layer.typeUrl + "#" + name;
            return feature.layer.url
                ? feature.layer.url + "#" + name
                : this.project.url + "#" + name;
        }

        /**
         * Find a feature type by its ID (of the format "featuretypeurl + # + featuretypename").
         * If it does not exist, return null.
         */
        getFeatureTypeById(featureTypeId: string): IFeatureType {
            if (this._featureTypes.hasOwnProperty(featureTypeId)){
                return this._featureTypes[featureTypeId];
            } else {
                return;
            }
        }

        /**
         * Return the feature style for a specific feature.
         * First, look for a layer specific feature type, otherwise, look for a project-specific feature type.
         * In case both fail, create a default feature type at the layer level.
         */
        getFeatureType(feature: IFeature): IFeatureType {
            if (feature.fType) return feature.fType;
            if (!feature.featureTypeName) {
                feature.featureTypeName = this.getFeatureTypeId(feature);
            }

            var ftKeys = Object.getOwnPropertyNames(this._featureTypes);
            var featureTypes = ftKeys.map(key=> this._featureTypes[key]).filter(ft=> ft.name == feature.featureTypeName);
            if (featureTypes.length > 0) {
                this._featureTypes[feature.featureTypeName] = featureTypes[0];
            }

            if (!this._featureTypes.hasOwnProperty(feature.featureTypeName)) {
                this._featureTypes[feature.featureTypeName] = csComp.Helpers.createDefaultType(feature);
                //this._featureTypes[feature.featureTypeName] = this.typesResources[feature.layer.typeUrl].featureTypes[feature.featureTypeName];
            }
            feature.fType = this._featureTypes[feature.featureTypeName];
            return feature.fType;
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
            layer.isLoading = false;
            //if (layer.refreshTimer) layer.stop();

            // make sure the timers are disabled
            this.checkLayerTimer(layer);

            this.loadedLayers.remove(layer.id);

            // find layer source, and remove layer
            if (!layer.layerSource) layer.layerSource = this.layerSources[layer.type.toLowerCase()];
            layer.layerSource.removeLayer(layer);


            if (this.lastSelectedFeature != null && this.lastSelectedFeature.layerId === layer.id) {
                this.lastSelectedFeature = null;
                this.visual.rightPanelVisible = false;
                this.$messageBusService.publish('feature', 'onFeatureDeselect');

            }

            this.activeMapRenderer.removeLayer(layer);

            this.project.features = this.project.features.filter((k: IFeature) => k.layerId !== layer.id);
            var layerName = layer.id + '_';
            var featureTypes = this._featureTypes;
            for (var poiTypeName in featureTypes) {
                if (!featureTypes.hasOwnProperty(poiTypeName)) continue;
            }

            // check if there are no more active layers in group and remove filters/styles
            if (g.layers.filter((l: ProjectLayer) => { return (l.enabled); }).length === 0 || g.oneLayerActive === true) {
                g.filters.forEach((f: GroupFilter) => { if (f.dimension != null) f.dimension.dispose(); });
                g.filters = [];
                g.styles.forEach(s => { this.removeStyle(s); });
                g.styles = [];
            }

            this.rebuildFilters(g);
            layer.enabled = false;
            if (removeFromGroup) layer.group.layers = layer.group.layers.filter((pl: ProjectLayer) => pl != layer);
            if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
            this.$messageBusService.publish('layer', 'deactivate', layer);
            this.$messageBusService.publish('rightpanel', 'deactiveContainer', 'edit');
            this.$messageBusService.publish("timeline", "updateFeatures");
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

            var searchParams = this.$location.search();
            if (searchParams.hasOwnProperty('project')) {
                url = this.emptySolutionUrl;
                this.openSingleProject = true;
            }

            this.$http.get(url)
                .success((solution: Solution) => {
                if (solution.maxBounds) {
                    this.maxBounds = solution.maxBounds;
                    this.$mapService.map.setMaxBounds(new L.LatLngBounds(
                        L.latLng(solution.maxBounds.southWest[0], solution.maxBounds.southWest[1]),
                        L.latLng(solution.maxBounds.northEast[0], solution.maxBounds.northEast[1])));
                }
                if (solution.viewBounds) {
                    this.activeMapRenderer.fitBounds(solution.viewBounds);
                }

                if (solution.baselayers) {
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
                }

                if (this.openSingleProject) {
                    var u = 'api/projects/' + searchParams['project'];
                    this.$http.get(u)
                        .success(<Project>(data) => {
                        if (data) {
                            this.parseProject(data, <SolutionProject>{ title: data.title, url: data.url, dynamic: true }, []);
                        }
                    })
                        .error((data) => {
                        this.$messageBusService.notify('ERROR loading project', 'while loading: ' + u);
                    })
                }

                if (solution.projects && solution.projects.length > 0) {
                    var p = solution.projects.filter((aProject: SolutionProject) => { return aProject.title === initialProject; })[0];
                    if (p != null) {
                        this.openProject(p, layers);
                    } else {
                        this.openProject(solution.projects[0], layers);
                    }
                }
                // make sure a default WidgetStyle exists
                if (!solution.widgetStyles) solution.widgetStyles = {};
                if (!solution.widgetStyles.hasOwnProperty('default')) {
                    var defaultStyle = new WidgetStyle();
                    defaultStyle.background = "red";
                    solution.widgetStyles["default"] = defaultStyle;
                }

                this.solution = solution;
            })
                .error(() => {
                this.$messageBusService.notify('ERROR loading solution', 'while loading: ' + url);
            });
        }

        /**
        * Clear all layers.
        */
        public clearLayers() {
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
         * @params project: Optionally provide the project that should be parsed. If not provided, it will be requested using the solution url.
         */
        public openProject(solutionProject: csComp.Services.SolutionProject, layers?: string, project?: Project): void {
            this.projectUrl = solutionProject;

            var layerIds: Array<string> = [];
            if (layers) {
                layers.split(';').forEach((layerId) => { layerIds.push(layerId.toLowerCase()); });
            }

            this.clearLayers();
            this._featureTypes = {};
            this.propertyTypeData = {};

            //typesResources
            var s = this.$location.search();
            if (s.hasOwnProperty('dashboard')) {
                this.startDashboardId = s['dashboard'];
            }

            if (!project) {
                this.$http.get(solutionProject.url)
                    .success((prj: Project) => {
                    this.parseProject(prj, solutionProject, layerIds);
                    //alert('project open ' + this.$location.absUrl());
                })
                    .error(() => {
                    this.$messageBusService.notify('ERROR loading project', 'while loading: ' + solutionProject.url);
                });
            } else {
                this.parseProject(project, solutionProject, layerIds);
            }
        }

        private parseProject(prj: Project, solutionProject: csComp.Services.SolutionProject, layerIds: Array<string>) {
            prj.solution = this.solution;
            this.project = new Project().deserialize(prj);


            if (!this.project.timeLine) {
                this.project.timeLine = new DateRange();
            } else {
                // Set range
                this.$messageBusService.publish('timeline', 'updateTimerange', this.project.timeLine);
            }

            if (this.project.viewBounds) {
                this.activeMapRenderer.fitBounds(this.project.viewBounds);
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
                var d2 = new Services.Dashboard();
                d2.id = "datatable";
                d2.name = "Table";
                d2.showMap = false;
                d2.showLeftmenu = false;
                d2.showRightmenu = false;
                d2.showTimeline = false;
                d2.widgets = [{
                    id: "datatable_id",
                    directive: "datatable",
                    elementId: "widget-datatable_id",
                    enabled: true,
                    width: "100%",
                    height: "100%"
                }];
                this.project.dashboards.push(d2);
            } else {
                this.project.dashboards.forEach((d) => {
                    if (!d.id) { d.id = Helpers.getGuid(); }
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
                            this.loadTypeResources(item, false, () => cb(null, null));

                        }, () => {
                                callback(null, null);
                            })


                    } else {
                        callback(null, null);
                    }
                },
                (callback) => {
                    if (!this.project.datasources) this.project.datasources = [];

                    this.project.datasources.forEach((ds: DataSource) => {
                        if (ds.url) {
                            DataSource.LoadData(this.$http, ds, () => {
                                if (ds.type === "dynamic") { this.checkDataSourceSubscriptions(ds); }

                                for (var s in ds.sensors) {
                                    var ss: SensorSet = ds.sensors[s];
                                    /// check if there is an propertytype available for this sensor
                                    if (ss.propertyTypeKey != null && this.propertyTypeData.hasOwnProperty(ss.propertyTypeKey)) {
                                        ss.propertyType = this.propertyTypeData[ss.propertyTypeKey];
                                    } else { // else create a new one and store in project
                                        var id = "sensor-" + Helpers.getGuid();
                                        var pt: IPropertyType = {};
                                        pt.title = s;
                                        ss.propertyTypeKey = id;
                                        this.project.propertyTypeData[id] = pt;
                                        ss.propertyType = pt;
                                    }
                                    if (ss.values && ss.values.length > 0) {
                                        ss.activeValue = ss.values[ss.values.length - 1];
                                    }
                                }
                            });
                        }
                    });
                }
            ]);

            if (!this.project.dataSets) {
                this.project.dataSets = [];
            }

            this.project.features = [];

            if (this.project.groups && this.project.groups.length > 0) {
                this.project.groups.forEach((group: ProjectGroup) => {
                    this.initGroup(group, layerIds);

                    if (prj.startposition) {
                        this.$mapService.zoomToLocation(new L.LatLng(prj.startposition.latitude, prj.startposition.longitude));
                    }
                });
            }
            if (this.project.connected) {
                // check connection
                this.$messageBusService.initConnection("", "", () => {
                    var handle = this.$messageBusService.subscribe("keyupdate", (key: any, msg: ClientMessage) => {
                        if (msg.action === "key") {
                            var id = "keys/" + msg.data.keyId;
                            this.findSensorSet(id, (ss: SensorSet) => {
                                var time = new Date().getTime();
                                if (msg.data.item.hasOwnProperty('time')) {
                                    time = msg.data.item['time'];
                                }
                                else {
                                    ss.timestamps = [];
                                    ss.values = [];
                                }
                                ss.addValue(new Date().getTime(), msg.data.item);
                                ss.activeValue = msg.data.item;
                            });
                        }
                        // console.log('got it');
                        // console.log(msg);
                    });
                    //     if (msg.action !== "subscribed") {
                    //         if (msg.data) {
                    //             var id = "keys/" + msg.data.keyId;
                    //             this.findSensorSet(id, (ss: SensorSet) => {
                    //                 var time = new Date().getTime();
                    //                 if (msg.data.item.hasOwnProperty('time')) {
                    //                     time = msg.data.item['time'];
                    //                 }
                    //                 else {
                    //                     ss.timestamps = [];
                    //                     ss.values = [];
                    //                 }
                    //                 ss.addValue(new Date().getTime(), msg.data.item);
                    //                 ss.activeValue = msg.data.item;
                    //             });
                    //             this.$messageBusService.publish(id, "update", msg.data.item);
                    //         }
                    //         //this.project.dataSets
                    //     }
                    //
                    // });

                    // setTimeout(() => {
                    //     for (var ll in this.loadedLayers) {
                    //         var layer = <ProjectLayer>this.loadedLayers[ll];
                    //         if (layer && layer.layerSource && layer.layerSource.title.toLowerCase() === "dynamicgeojson") {
                    //             layer.layerSource.refreshLayer(layer);
                    //         }
                    //     }
                    // }, 5000);
                });
            }

            // check if project is dynamic
            if (solutionProject.dynamic) {
                // listen to directory updates
                //
                if (!this.directoryHandle) {
                    this.directoryHandle = this.$messageBusService.serverSubscribe("", "directory", (sub: string, msg: any) => {
                        if (msg.action === "subscribed") return;
                        if (msg.action === 'layer' && msg.data && msg.data.item) {
                            // Disabled for single-project-solutions, as layers from excel2map get updated twice: on layer update and on project update
                            if (this.openSingleProject === false) {
                                var layer = <ProjectLayer>msg.data.item;
                                if (layer) {
                                    var l = this.findLayer(layer.id);
                                    if (!l) {
                                        //this.$messageBusService.notify('New layer available', layer.title);
                                    }
                                    else {
                                        this.$messageBusService.notify('New update available for layer ', layer.title);
                                        if (l.enabled) {
                                            l.layerSource.refreshLayer(l);
                                        }
                                    }
                                }
                            }
                        }
                        if (msg.action === 'project' && msg.data && msg.data.item) {
                            var project = <Project>msg.data.item;
                            if (project) {
                                var p = (this.project.id === project.id);
                                if (!p && !this.openSingleProject) {
                                    this.$messageBusService.notify('New project available', project.title);
                                    if (project.url.substring(project.url.length - 4) !== 'json') project.url = '/data' + project.url + '.json';
                                    if (!this.solution.projects.some(sp => { return (sp.title === project.title) })) {
                                        this.solution.projects.push(<SolutionProject>{ title: project.title, url: project.url, dynamic: true });
                                    } else {
                                        console.log('Project already exists (' + project.title + ')');
                                    }
                                }
                                else {
                                    this.$messageBusService.notify('New update available for project ', project.title);
                                    //var solProj = this.solution.projects.filter(sp => { return (sp.title === project.title) }).pop();
                                    this.openProject(solutionProject, null, project);
                                }
                            }
                        }
                    });
                }

                if (!this.$messageBusService.getConnection(this.project.id)) {
                    this.$messageBusService.serverSubscribe(this.project.id, "project", (sub: string, msg: any) => {
                        if (msg.action === "layer-update") {
                            msg.data.layer.forEach((l: ProjectLayer) => {
                                var g: ProjectGroup;
                                // find group
                                if (l.groupId) { g = this.findGroupById(l.groupId); } else { l.groupId = "main"; }
                                if (!g) {
                                    g = new ProjectGroup();
                                    g.id = l.groupId;
                                    g.title = msg.data.group.title;
                                    g.clustering = msg.data.group.clustering;
                                    g.clusterLevel = msg.data.group.clusterLevel;
                                    this.project.groups.push(g);
                                    this.initGroup(g);
                                } else {
                                    g.clustering = msg.data.group.clustering;
                                    g.clusterLevel = msg.data.group.clusterLevel;
                                }
                                var layerExists = false;
                                var layerIndex = 0;
                                g.layers.forEach((gl, index) => {
                                    if (gl.id === l.id) {
                                        layerExists = true;
                                        layerIndex = index;
                                    }
                                })
                                if (!layerExists) {
                                    g.layers.push(l);
                                    this.initLayer(g, l);
                                    if (!l.layerSource) { l.layerSource = this.layerSources[l.type.toLowerCase()]; }
                                    l.layerSource.refreshLayer(g.layers[g.layers.length - 1]);
                                } else {
                                    var currentStyle = g.styles;
                                    if (this.lastSelectedFeature && this.lastSelectedFeature.isSelected) this.selectFeature(this.lastSelectedFeature);
                                    if (!l.layerSource) l.layerSource = this.layerSources[l.type.toLowerCase()];
                                    l.group = g;
                                    //l.layerSource.refreshLayer(g.layers[layerIndex]);
                                    this.removeLayer(g.layers[layerIndex]);
                                    this.addLayer(g.layers[layerIndex], () => {
                                        if (currentStyle && currentStyle.length > 0)
                                            this.setStyle({ feature: { featureTypeName: l.url + "#" + l.defaultFeatureType, layer: l }, property: currentStyle[0].property, key: currentStyle[0].title, meta: currentStyle[0].meta }, false, null, currentStyle[0]);
                                    });
                                }
                                if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') {
                                    this.$rootScope.$apply();
                                }
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
            }

            if (prj.hasOwnProperty('collapseAllLayers') && prj.collapseAllLayers === true) {
                if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
                this.collapseAll();
            }

            this.$messageBusService.publish('project', 'loaded', this.project);
            if (this.project.dashboards && this.project.dashboards.length > 0) {
                var startd = this.project.dashboards[Object.keys(this.project.dashboards)[0]];
                // find dashboard from url
                if (this.startDashboardId && this.findDashboardById(this.startDashboardId)) {
                    startd = this.findDashboardById(this.startDashboardId);
                }
                this.$messageBusService.publish('dashboard-main', 'activated', startd);
            }
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
                    maxClusterRadius: (zoom) => { if (zoom > 18) { return 2; } else { return group.maxClusterRadius || 80 } },
                    disableClusteringAtZoom: group.clusterLevel || 0
                });
                group.cluster.on('clustermouseover', (a) => {
                    if (a.layer._childClusters.length === 0) {
                        var childs = a.layer.getAllChildMarkers();
                        if (childs[0] && childs[0].hasOwnProperty('feature')) {
                            var f = childs[0].feature;
                            var actions = this.getActions(f, ActionType.Hover);
                            actions.forEach((fa) => {
                                if (fa.title.toLowerCase() === 'show') {
                                    fa.callback(f, this);
                                }
                            });
                        }
                    }
                });
                group.cluster.on('clustermouseout', (a) => {
                    if (a.layer._childClusters.length === 0) {
                        var childs = a.layer.getAllChildMarkers();
                        if (childs[0] && childs[0].hasOwnProperty('feature')) {
                            var f = childs[0].feature;
                            var actions = this.getActions(f, ActionType.Hover);
                            actions.forEach((fa) => {
                                if (fa.title.toLowerCase() === 'hide') {
                                    fa.callback(f, this);
                                }
                            });
                        }
                    }
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
            layer.gui = {};
            layer.renderType = (layer.renderType) ? layer.renderType.toLowerCase() : layer.type;
            if (layer.type === "dynamicgeojson") layer.isDynamic = true;
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
                this.addLayer(layer);
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
                            if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
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

        /** Find a sensor set for a specific source/sensor combination. Key should be something like datasource/sensorid */
        public findSensorSet(key: string, callback: Function) {
            var kk = key.split('/');
            if (kk.length == 2) {
                var dataSourceId = kk[0];
                var sensorId = kk[1];

                var dss = this.project.datasources.filter((ds: DataSource) => { return ds.id === dataSourceId });
                if (dss.length === 0) {
                    var ds = new DataSource();
                    ds.id = dataSourceId;
                    ds.type = "dynamic";
                    ds.sensors = {};
                    dss.push(ds);
                    this.project.datasources.push(ds);
                }
                ds = dss[0];
                if (ds.sensors.hasOwnProperty(sensorId)) {
                    callback(ds.sensors[sensorId]);
                }
                else {
                    var ss = new SensorSet();
                    ss.id = sensorId;
                    ss.title = sensorId;
                    ss.timestamps = [];
                    ss.values = [];
                    ds.sensors[sensorId] = ss;

                    callback(ss);
                }
            }
            return null;
        }

        //private zoom(data: any) {
        //    //var a = data;
        //}

        public getPropertyValues(layer: ProjectLayer, property: string): Object[] {
            var r = [];
            var features = [];
            if (this.selectedFeatures.length > 1) {
                features = this.selectedFeatures;
            }
            else {
                features = (layer.group.filterResult) ? layer.group.filterResult : layer.data.features;
            }
            if (features) features.forEach((f: IFeature) => { if (f.layerId === layer.id) r.push(f.properties); });
            if (r.length === 0) r = layer.data.features;

            return r;
        }

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

            } else {
                r.mean = sum / r.count;
                r.varience = sumsq / r.count - r.mean * r.mean;
                r.sd = Math.sqrt(r.varience);
            }
            if (this.propertyTypeData.hasOwnProperty(property)) {
                var mid = this.propertyTypeData[property];
            }
            return r;
        }



        public updateFilterGroupCount(group: ProjectGroup) {
            if (group.filterResult != null)
                $('#filtergroupcount_' + group.id).text(group.filterResult.length + ' objecten geselecteerd');
        }

        private trackGeometry(f: IFeature, result: {}) {
            var key = "~geometry";
            var log = <Log>{
                ts: new Date().getTime(), prop: key, value: f.geometry
            };
            f.propertiesOld[key] = JSON.parse(JSON.stringify(f.geometry));
            if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
            if (!result.hasOwnProperty(key)) result[key] = [];
            f.logs[key].push(log);
            result[key].push(log);
            f.gui["lastUpdate"] = log.ts;
        }

        /**
         * Check for property changes inside a feature, return a set of logs in result
         */
        private trackPropertyLog(f: IFeature, key: string, result: {}) {
            var log = <Log>{
                ts: new Date().getTime(), prop: key, value: f.properties[key]
            };
            f.propertiesOld[key] = JSON.parse(JSON.stringify(f.properties[key]));
            if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
            if (!result.hasOwnProperty(key)) result[key] = [];
            f.logs[key].push(log);
            result[key].push(log);
            f.gui["lastUpdate"] = log.ts;
        }

        private trackFeature(feature: IFeature): {} {
            var result = {};
            for (var key in feature.properties) {
                if (!feature.propertiesOld.hasOwnProperty(key)) {
                    this.trackPropertyLog(feature, key, result);
                }
                else if (JSON.stringify(feature.propertiesOld[key]) != JSON.stringify(feature.properties[key])) {
                    this.trackPropertyLog(feature, key, result);
                }
            }
            if (JSON.stringify(feature.propertiesOld["~geometry"]) != JSON.stringify(feature.geometry))
                this.trackGeometry(feature, result);
            return result;
        }

        public isLocked(f: IFeature): boolean {
            return f.gui.hasOwnProperty('lock') || (f.gui.hasOwnProperty('editMode') && f.gui['editMode']);
        }

        /**
         * Set a lock property on the feature to signal others prevent feature updates
         */
        public lockFeature(f: IFeature): boolean {
            if (f.gui.hasOwnProperty('lock')) {
                return false;
            }
            else {
                f.gui["lock"] = true;
                return true;
            }
        }

        public unlockFeature(f: IFeature) {
            delete f.gui['lock'];
        }



        public saveFeature(f: IFeature, logs: boolean = false) {
            f.properties["updated"] = new Date().getTime();
            // check if feature is in dynamic layer
            if (f.layer.isDynamic) {
                var l = this.trackFeature(f);

                if (f.layer.useLog) {
                    var s = new LayerUpdate();
                    s.layerId = f.layerId;
                    s.action = LayerUpdateAction.updateLog;
                    s.item = { featureId: f.id, logs: l };
                    //this.$messageBusService.serverPublish("layer", s);
                    this.$messageBusService.serverSendMessageAction("layer", s);
                }
                else {
                    var s = new LayerUpdate();
                    s.layerId = f.layerId;
                    s.action = LayerUpdateAction.updateFeature;
                    s.item = Feature.serialize(f);
                    this.$messageBusService.serverSendMessageAction("layer", s);
                }
            }
        }

        /***
         * Update map markers in cluster after changing filter
         */
        public updateMapFilter(group: ProjectGroup) {
            this.activeMapRenderer.updateMapFilter(group);
            // update timeline list
            this.$messageBusService.publish("timeline", "updateFeatures", group.id);

        }

        public resetMapFilter(group: ProjectGroup) {
            $.each(group.markers, (key, marker) => {
                if (group.clustering) {
                    var incluster = group.cluster.hasLayer(marker);
                    if (!incluster) group.cluster.addLayer(marker);
                } else {
                    var onmap = this.map.map.hasLayer(marker);
                    if (!onmap) this.map.map.addLayer(marker);
                }
            });
        }
    }

    /**
     * object for sending layer messages over socket.io channel
     */
    export class LayerUpdate {
        public layerId: string;
        public action: LayerUpdateAction;
        public item: any;
        public featureId: string;
    }

    /**
     * List of available action for sending/receiving layer actions over socket.io channel
     */
    export enum LayerUpdateAction {
        updateFeature,
        updateLog,
        deleteFeature
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
