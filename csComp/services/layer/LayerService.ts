module csComp.Services {
    /** describes a layer source, every layer has a layer source that is responsible for importing the data (e.g. geojson, wms, etc */
    export interface ILayerSource {
        title: string;
        service: LayerService;
        addLayer(layer: ProjectLayer, callback: Function, data: Object);
        removeLayer(layer: ProjectLayer): void;
        refreshLayer(layer: ProjectLayer, oldLayer?: ProjectLayer): void;
        fitMap?(layer: ProjectLayer): void;
        fitTimeline?(layer: ProjectLayer): void;
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

        /** true if no filters are active */
        noFilters = true;

        /** uses RD projection */
        isRD: boolean;

        /** indicator true for mobile devices */
        isMobile: boolean;

        currentLocale: string;
        /** layers that are currently active */
        loadedLayers: { [key: string]: ProjectLayer } = {};
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
        throttleSensorDataUpdate: Function = () => { };

        throttleBBOXUpdate = _.debounce(this.updateBBOX, 1000);

        static $inject = [
            '$location',
            '$compile',
            '$translate',
            'messageBusService',
            'mapService',
            '$rootScope',
            'geoService',
            '$http',
            'expressionService',
            'actionService',
            'localStorageService'
        ];

        constructor(
            private $location: ng.ILocationService,
            public $compile: any,
            public $translate: ng.translate.ITranslateService,
            public $messageBusService: Services.MessageBusService,
            public $mapService: Services.MapService,
            public $rootScope: any,
            public geoService: GeoService,
            public $http: ng.IHttpService,
            private expressionService: ExpressionService,
            public actionService: ActionService,
            public $storage: ng.localStorage.ILocalStorageService
        ) {
            this.actionService.init(this);

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
            // init map renderers
            this.mapRenderers = {};
            this.visual = new VisualState();
            this.setLanguage();

            // add renderers
            this.mapRenderers['leaflet'] = new LeafletRenderer();
            this.mapRenderers['leaflet'].init(this);

            this.mapRenderers['cesium'] = new CesiumRenderer();
            this.mapRenderers['cesium'].init(this);

            this.initLayerSources();



            $('body').keyup(e => {
                if (e.keyCode === 46 && e.target.localName !== 'input') {
                    if (this.selectedFeatures.length > 1) {
                        this.$messageBusService.confirm('Delete objects', 'Do you want to remove all (' + this.selectedFeatures.length + ') selected objects ?', r => {
                            this.selectedFeatures.forEach(f => {
                                this.removeFeature(f, true);
                            });
                        });
                    } else {
                        if (this.selectedFeatures.length === 1) {
                            this.$messageBusService.confirm('Delete object', 'Are you sure', r => {
                                this.removeFeature(this.selectedFeatures[0], true);
                            });
                        }
                    }
                }
            });

            $messageBusService.subscribe('timeline', (trigger: string, date: Date) => {
                switch (trigger) {
                    case 'focusChange':
                        this.throttleSensorDataUpdate();
                        break;
                    case 'timeSpanUpdated':
                        this.updateSensorLinks();
                        break;
                    // case 'focusChange':
                    //     delayFocusChange(date);
                    //     break;
                }
            });

            $messageBusService.subscribe('language', (title: string, language: string) => {
                if (title !== 'newLanguage') return;
                this.currentLocale = language;
                $messageBusService.notifyWithTranslation('LAYER_SERVICE.RELOAD_PROJECT_TITLE', 'LAYER_SERVICE.RELOAD_PROJECT_MSG');
                this.openProject(this.projectUrl);
            });


            $messageBusService.subscribe('mapbbox', (title: string, bbox: string) => {
                if (title !== 'update') return;
                let a = [];
                bbox.split(',').forEach(s => a.push(parseFloat(s)));
                this.throttleBBOXUpdate(bbox, [[a[0], a[1]], [a[2], a[1]], [a[2], a[3]], [a[0], a[3]]]);

            });

            $messageBusService.subscribe('menu', (title, data) => {
                if (title === 'show' && typeof data === 'boolean') this.visual.leftPanelVisible = data;
            });

            this.addActionService(new LayerActions());
            this.addActionService(new MatrixAction.MatrixActionModel());
            this.addActionService(new RelationAction.RelationActionModel());

            // var delayFocusChange = _.debounce((date) => {
            //     this.refreshActiveLayers();
            // }, 500);

            // $messageBusService.subscribe('timeline', (action: string, date: Date) => {
            //     if (action === 'focusChange') {
            //         delayFocusChange(date);
            //         //this.refreshActiveLayers();
            //     }
            // });

            this.checkMobile();
        }

        private setLanguage(project?: Project) {
            let params = this.$location.search();
            if (params && params.hasOwnProperty('language')) {
                this.currentLocale = params['language'];
            } else if (project && project.preferedLanguage) {
                this.currentLocale = project.preferedLanguage;
            } else {
                this.currentLocale = this.$translate.preferredLanguage();
            }
        }

        public refreshActiveLayers() {
            for (var l in this.loadedLayers) {
                var layer = <ProjectLayer>this.loadedLayers[l];
                if (layer.timeDependent) {
                    layer.layerSource.refreshLayer(layer);
                }
            }
        }

        public updateBBOX(bbox: string, bboxarray: number[][]) {
            for (var l in this.loadedLayers) {
                var layer = this.loadedLayers[l];
                layer.BBOX = bbox;
                if (layer.refreshBBOX) {
                    // When any groupstyle(s) present, store and re-apply after refreshing the layer
                    // var oldStyles;
                    // if (layer.group && layer.group.styles && layer.group.styles.length > 0) {
                    //     oldStyles = layer.group.styles;
                    // }

                    layer.layerSource.refreshLayer(layer);
                    // if (layer.group && oldStyles) {
                    //     oldStyles.forEach((gs) => {
                    //         this.saveStyle(layer.group, gs);
                    //     });
                    //     this.updateGroupFeatures(layer.group);
                    // }
                }
                if (layer.partialBoundingBoxUpdates) {
                    let changed = false;
                    layer.data.features.forEach(f => {
                        let inside = csComp.Helpers.GeoExtensions.featureInsideBoundingBox(f, bboxarray);
                        if (f._gui.insideBBOX !== inside) {
                            f._gui.insideBBOX = inside;
                            changed = true;
                        }
                    });
                    if (changed) this.updateLayerSensorData(layer);
                }
            }
        }

        public updateLayerKpiLink(layer: ProjectLayer) {
            if (layer.sensorLink && layer.sensorLink.kpiUrl) {
                // create sensorlink
                if (!_.isUndefined(layer._gui['loadingKpiLink']) && layer._gui['loadingKpiLink']) return;

                var t = this.project.timeLine;
                if (this.project.activeDashboard.timeline) t = this.project.activeDashboard.timeline;
                var range = (this.timeline.range.end - this.timeline.range.start);


                var link = layer.sensorLink.kpiUrl;
                if (!this.project.activeDashboard.isLive) {
                    link += '?tbox=' + t.start + ',' + t.end;
                }
                else {
                    var interval = '1h';
                    if (!_.isUndefined(layer.sensorLink.liveIntervalKPI)) {
                        interval = layer.sensorLink.liveIntervalKPI;
                    }
                    else if (!_.isUndefined(layer.sensorLink.liveInterval)) {
                        interval = layer.sensorLink.liveInterval;
                    }
                    link += '?tbox=' + interval;
                }
                console.log('kpi:' + link);
                layer._gui['loadingKpiLink'] = true;
                this.$http.get(link)
                    .then((res: {data: ISensorLinkResult}) => {
                        let data = res.data;
                        layer._gui['loadingKpiLink'] = false;

                        layer.kpiTimestamps = data.timestamps;
                        if (typeof data.kpis !== 'undefined') {
                            layer.sensors = data.kpis;
                        }

                        this.$messageBusService.publish('timeline', 'sensorLinkUpdated');
                    }, (e) => {
                        layer._gui['loadingKpiLink'] = false;
                        console.log('error loading sensor data');
                    });
            }
        }

        /** update sensor data using an external sensor link */
        public updateLayerSensorLink(layer: ProjectLayer) {
            if (layer.sensorLink) {
                if (layer.sensorLink._requestReference) {
                    console.log('aborting request');
                    layer.sensorLink._requestReference.abort();
                    layer.sensorLink._requestReference = null;
                    layer._gui['loadingSensorLink'] = false;
                }
                // create sensorlink
                if (!_.isUndefined(layer._gui['loadingSensorLink']) && layer._gui['loadingSensorLink']) return;
                var range = (this.timeline.range.end - this.timeline.range.start);

                // check if timeline is within range
                layer.sensorLink._outOfRange = layer._gui.outOfRange = (!this.project.activeDashboard.isLive && range > layer.sensorLink.zoomMaxTimeline && range < layer.sensorLink.zoomMaxTimeline);
                if (layer.sensorLink._outOfRange) return;

                // get project timeline, or use dashboard timeline if avaiable
                var t = this.project.timeLine;
                if (this.project.activeDashboard.timeline) t = this.project.activeDashboard.timeline;

                // create link
                var link = layer.sensorLink.url;
                if (!this.project.activeDashboard.isLive) {
                    link += '?tbox=' + t.start + ',' + t.end;
                    //if (layer._gui.hasOwnProperty('lastSensorLink') && layer._gui['lastSensorLink'] === link) return;
                } else {
                    if (_.isUndefined(layer.sensorLink.liveInterval)) {
                        link += '?tbox=15m';
                    } else {
                        link += '?tbox=' + layer.sensorLink.liveInterval;
                    }
                }
                layer._gui['lastSensorLink'] = link;
                let timeStarted = new Date().getTime();
                console.log('downloading ' + link);
                layer._gui['loadingSensorLink'] = true;
                layer.sensorLink._requestReference = $.ajax({
                    type: 'GET',
                    url: link,
                    success: (d: string) => {
                        let data = <ISensorLinkResult>JSON.parse(d);
                        layer.sensorLink._requestReference = null;
                        let timeLoaded = new Date().getTime();
                        console.log('sensor data loaded ' + (timeLoaded - timeStarted).toString());
                        layer._gui['loadingSensorLink'] = false;
                        layer.sensorLink.actualInterval = data['timewindow'] * 1000 * 60;

                        layer.timestamps = data.timestamps;
                        layer.data.features.forEach((f: IFeature) => {
                            f.sensors = {};
                            if (data.features && data.features.hasOwnProperty(f.id)) {
                                f.sensors = data.features[f.id];
                                // for (var s in f.sensors) {
                                //     this.cleanSensorData(f, s);
                                // }
                            }
                        });

                        console.log('sensor data processed ' + (new Date().getTime() - timeLoaded).toString());

                        // check features
                        if (data.timestamps) {
                            layer.data.features.forEach((f: IFeature) => {
                                // check expressions
                                f.fType._expressions.forEach(ex => {
                                    if (ex.isSensor && ex.label) {
                                        f.sensors[ex.label] = [];
                                        for (var i = 0; i < data.timestamps.length; i++) {
                                            try {
                                                f.sensors[ex.label].push(this.expressionService.evalSensorExpression(ex.expression, f.layer.data.features, f, i));
                                            } catch (ec) {
                                                f.sensors[ex.label].push(null);
                                            }
                                        }
                                    }
                                });
                            });
                        }

                        this.throttleSensorDataUpdate();
                        this.$messageBusService.publish('timeline', 'sensorLinkUpdated');

                    },
                    error: (e) => {
                        layer._gui['loadingSensorLink'] = false;
                        console.log('error loading sensor data');
                    }

                });


                this.updateLayerKpiLink(layer);
            }

        }


        /**
         * Get external sensordata for loaded layers with sensor links enabled
         */
        public updateSensorLinks() {
            var updated = false;
            console.log('updating sensorlinks');
            for (var l in this.loadedLayers) {
                var layer = <ProjectLayer>this.loadedLayers[l];
                this.updateLayerSensorLink(layer);
                console.log(layer.title);
            };
        }

        public enableDrop() {
            var w = <any>window;
            if (w.File && w.FileList && w.FileReader) {
                var obj = $('body');
                obj.on('dragenter', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).css('border', '2px solid #0B85A1');
                });
                obj.on('dragover', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                });
                obj.on('drop', (e) => {
                    $(this).css('border', '2px dotted #0B85A1');
                    e.preventDefault();

                    var ev = <any>e.originalEvent;
                    var files = ev.dataTransfer.files;
                    if (files.length > 1) {
                        this.$messageBusService.notify('File upload', 'Only one file at a time permitted');
                    } else {
                        this.handleFileUpload(files, obj);
                    }
                    //We need to send dropped files to Server
                });
            }
        }

        public handleFileUpload(files, obj) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                console.log(file);
                var reader = new FileReader();
                reader.onload = (e: any) => {
                    // get file content
                    var text = e.target.result;
                    var obj = JSON.parse(text);
                    if (obj && obj.type && ['featurecollection', 'geojson', 'dynamicgeojson'].indexOf((<string>obj.type).toLowerCase()) >= 0) {
                        var newLayer = new csComp.Services.ProjectLayer();
                        var id = file.name.toLowerCase().replace('.json', '').replace('.geojson', '');
                        newLayer.id = id;
                        newLayer.title = id;
                        newLayer.type = 'dynamicgeojson';
                        newLayer.groupId = this.project.groups[0].id;
                        newLayer.group = this.project.groups[0];
                        newLayer.data = obj;
                        this.$messageBusService.publish('layerdrop', 'new', newLayer);
                    } else {
                        this.$messageBusService.notify('File upload', 'File format not recognized');
                    }
                };
                reader.readAsText(file);
            }
        }

        public checkMobile() {
            if (screen.width <= 719) {
                this.isMobile = true;
                //alert('is mobile');
            }
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
                });
            } else if (type === ActionType.Hover) {
                this.actionServices.forEach((as: csComp.Services.IActionService) => {
                    var asOptions = as.getFeatureHoverActions(feature);
                    if (asOptions) options = options.concat(asOptions);
                });
                options.forEach((a: IActionOption) => {
                    a.feature = feature;
                });
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
                console.log('Actionservice ' + as.id + ' already exists.');
            } else {
                this.actionServices.push(as);
                as.init(this);
            }
        }

        public removeActionService(as: IActionService) {
            as.stop();
        }

        public checkViewBounds() {
            if (this.project && this.project.activeDashboard && this.project.activeDashboard.viewBounds) {
                this.activeMapRenderer.fitBounds(this.project.activeDashboard.viewBounds);
            } else if (this.project && this.project.viewBounds) {
                this.activeMapRenderer.fitBounds(this.project.viewBounds);
            } else if (this.solution && this.solution.viewBounds) {
                this.activeMapRenderer.fitBounds(this.solution.viewBounds);
            }
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
            var geojsonsource = new GeoJsonSource(this, this.$http, this.$storage);

            this.layerSources['geojson'] = geojsonsource;
            this.layerSources['topojson'] = geojsonsource;
            this.layerSources['editablegeojson'] = new EditableGeoJsonSource(this, this.$http, this.$storage);
            this.layerSources['dynamicgeojson'] = new DynamicGeoJsonSource(this, this.$http, this.$storage);
            this.layerSources['esrijson'] = new EsriJsonSource(this, this.$http, this.$storage);

            // add kml source
            var kmlDataSource = new KmlDataSource(this, this.$http, this.$storage);
            this.layerSources['kml'] = kmlDataSource;
            this.layerSources['gpx'] = kmlDataSource;

            // add wms source
            this.layerSources['wms'] = new WmsSource(this);

            //add tile layer
            this.layerSources['tilelayer'] = new TileLayerSource(this);

            //add heatmap layer
            this.layerSources['heatmap'] = new HeatmapSource(this);

            //add hierarchy layer
            this.layerSources['hierarchy'] = new HierarchySource(this, this.$http);

            //add grid layer
            this.layerSources['grid'] = new GridDataSource(this, this.$http, this.$storage);

            //add day or night data source
            this.layerSources['daynight'] = new NightDayDataSource(this, this.$http, this.$storage);

            // add RSS data source
            this.layerSources['rss'] = new RssDataSource(this, this.$http, this.$storage);

            // add Database data source
            this.layerSources['database'] = new DatabaseSource(this);

            // add VectorTile data source
            this.layerSources['vectortile'] = new VectorTileSource(this, this.$http, this.$storage);

            // check for every feature (de)select if layers should automatically be activated
            this.checkFeatureSubLayers();
        }

        private removeSubLayers(feature: IFeature) {
            if (!feature || !feature.fType) return;
            var props = csComp.Helpers.getPropertyTypes(feature.fType, this.propertyTypeData);

            props.forEach((prop: IPropertyType) => {
                if (prop.type === 'layer' && feature.properties.hasOwnProperty(prop.label)) {
                    var l = feature.properties[prop.label];

                    if (this.loadedLayers.hasOwnProperty(l)) {
                        var layer = this.loadedLayers[l];
                        this.removeLayer(this.loadedLayers[l], true);
                    }
                }
            });
        }

        /**
        * Check for every feature (de)select if layers should automatically be activated
        */
        private checkFeatureSubLayers() {
            this.$messageBusService.subscribe('feature', (action: string, feature: IFeature) => {
                if (!feature || !feature.fType) return;
                switch (action) {
                    case 'onFeatureDeselect':
                        break;
                    case 'onFeatureSelect':
                        var props = csComp.Helpers.getPropertyTypes(feature.fType, this.propertyTypeData);
                        props.forEach((prop: IPropertyType) => {
                            if (prop.type === 'layer' && feature.properties.hasOwnProperty(prop.label)) {

                                if (prop.layerProps && prop.layerProps.activation === 'automatic') this.removeSubLayers(feature.layer._lastSelectedFeature);
                                if (typeof prop.layerProps.dashboard === 'undefined' || prop.layerProps.dashboard === this.project.activeDashboard.id) {

                                    feature.layer._lastSelectedFeature = feature;

                                    var l = feature.properties[prop.label];
                                    var pl = this.findLayer(l);
                                    if (pl) {
                                        this.addLayer(pl);
                                    } else {
                                        if (typeof l === 'string') {
                                            pl = new ProjectLayer();
                                            pl.url = l;
                                        } else {
                                            pl = l;
                                        }

                                        if (!pl.id) pl.id = l;
                                        pl.groupId = prop.layerProps.groupId;
                                        if (!pl.group) {
                                            if (pl.groupId) {
                                                pl.group = this.findGroupById(pl.groupId);
                                            } else {
                                                pl.group = feature.layer.group;
                                            }
                                        } else {
                                            if (typeof pl.group === 'string') {
                                                pl.group = this.findGroupById(<any>pl.group);
                                            }
                                        }
                                        if (!pl.type) pl.type = feature.layer.type;
                                        if (!pl.title) pl.title = feature.properties['Name'] + ' ' + prop.title;
                                        if (!pl.defaultFeatureType) pl.defaultFeatureType = prop.layerProps.defaultFeatureType;
                                        if (!pl.typeUrl) pl.typeUrl = prop.layerProps.typeUrl;
                                        if (!pl.defaultLegendProperty) pl.defaultLegendProperty = prop.layerProps.defaultLegendProperty;
                                        pl.hasSensorData = true;

                                        //pl.parentFeature = feature;
                                        pl.group.layers.push(pl);
                                    }
                                    this.addLayer(pl);
                                }
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

        public addLayer(layer: ProjectLayer, layerloaded?: Function, data = null) {
            if (this.loadedLayers.hasOwnProperty(layer.id) && !layer.quickRefresh) return;
            if (layer.isLoading) return;
            layer.isLoading = true;
            this.$messageBusService.publish('layer', 'loading', layer);
            async.series([
                (callback) => {
                    // check if in this group only one layer can be active
                    // make sure all existising active layers are disabled
                    if (layer.group.oneLayerActive) {
                        layer.group.layers.forEach((l: ProjectLayer) => {
                            if (l.id !== layer.id && l.enabled) {
                                this.removeLayer(l);
                                l.enabled = false;
                            }
                        });
                    }
                    callback(null, null);
                },
                (callback) => {
                    // console.log('loading types: ' + layer.typeUrl);
                    if (layer.typeUrl) {
                        // TODO Check if we haven't loaded it already
                        this.loadTypeResources(layer.typeUrl, layer.dynamicResource || false, () => callback(null, null));
                    } else {
                        callback(null, null);
                    }
                },
                (callback) => {
                    // load required feature layers, if applicable
                    this.loadRequiredLayers(layer);

                    // suport for loading default geojson
                    if (layer.type.toLowerCase() === 'featurecollection') layer.type = 'geojson';

                    // find layer source, and activate layer
                    var layerSource = layer.type.toLowerCase();

                    if (!this.layerSources.hasOwnProperty(layerSource)) {
                        // We don't know how to deal with an unknown layer source, so stop here.
                        layer.isLoading = false;
                        this.$messageBusService.publish('layer', 'error', layer);
                        callback(null, null);
                        // TODO Stop spinner
                        return;
                    }
                    layer.layerSource = this.layerSources[layerSource];
                    layer.layerSource.addLayer(layer, (l) => {
                        if (l.enabled) {
                            this.loadedLayers[layer.id] = l;
                            this.updateSensorData();
                            this.activeMapRenderer.addLayer(layer);
                            if (layer.defaultLegendProperty) this.checkLayerLegend(layer, layer.defaultLegendProperty);
                            this.checkLayerTimer(layer);

                            if (this.actionServices) this.actionServices.forEach(as => {
                                if (as.addLayer) as.addLayer(layer);
                            });

                            this.updateLayerSensorLink(layer);
                            this.updateLayerSensorDataWithDate(layer, this.project.timeLine.focusDate());

                            this.$messageBusService.publish('layer', 'activated', layer);
                            this.$messageBusService.publish('updatelegend', 'updatedstyle');
                            // if (layerloaded) layerloaded(layer);
                            this.expressionService.evalLayer(l, this._featureTypes);
                        }
                        if (layerloaded) layerloaded(layer);
                    }, data);
                    if (layer.timeAware) this.$messageBusService.publish('timeline', 'updateFeatures');
                    callback(null, null);
                }
            ]);
        }

        /// If a layer has a default legend defined it will lookup the resource and return the legend
        public getLayerLegend(l: ProjectLayer): Legend {
            var tr = this.findResourceByLayer(l);
            if (tr && tr.legends) {
                if (tr.legends.hasOwnProperty(l.defaultLegend)) return <csComp.Services.Legend>tr.legends[l.defaultLegend];
            }
            return null;

        }

        public evaluateLayerExpressions(l: ProjectLayer, fTypes: { [key: string]: IFeatureType }) {
            this.expressionService.evalLayer(l, fTypes);
        }

        public evaluateFeatureExpressions(f: Feature) {
            this.expressionService.evalResourceExpressions(this.findResourceByFeature(f), [f]);
        }

        /** save a resource back to the api */
        public saveResource(resource: TypeResource) {
            console.log('saving feature type');
            if (resource.url) {
                this.$http.put('/api/resources', csComp.Helpers.cloneWithoutUnderscore(resource))
                    .then((res: {data: Solution}) => {
                        let data = res.data;
                        console.log('resource saved');
                    }, (e) => {
                        console.log('error saving resource');
                    });
            }
        }

        public expandGroup(layer: ProjectLayer) {
            // expand the group in the layerlist if it is collapsed
            if (!layer || !layer.group) { return; }
            var id = '#layergroup_' + layer.group.id;
            (<any>$(id)).collapse('show');
            $('*[data-target="' + id + '"]').removeClass('collapsed');
            this.apply();
        }

        public collapseAll() {
            this.project.groups.forEach((g) => {
                var layerEnabled = false;
                g.layers.some((l) => {
                    if (l.enabled) layerEnabled = true;
                    return l.enabled;
                });
                if (!layerEnabled) {
                    var id = '#layergroup_' + g.id;
                    (<any>$(id)).collapse('hide');
                    $('*[data-target="' + id + '"]').addClass('collapsed');
                }
            });
        }

        public expandAll() {
            this.project.groups.forEach((g) => {
                var id = '#layergroup_' + g.id;
                if (!(<any>$(id)).hasClass('in')) {
                    (<any>$(id)).collapse('show');
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
                            .then((res: {data: TypeResource | string}) => {
                                let resource = res.data;
                                success = true;
                                if (!resource || (typeof resource === 'string' && resource !== 'null')) {
                                    this.$messageBusService.notifyError('Error loading resource type', url);
                                } else {
                                    var r = <TypeResource>resource;
                                    if (r) {
                                        r.url = url;
                                        this.initTypeResources(r);
                                        this.$messageBusService.publish('typesource', url, r);
                                    }
                                }
                                callback();
                            }, (err) => {
                                this.$messageBusService.notifyError('ERROR loading TypeResources', 'While loading: ' + url);
                                console.log(err);
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

            // if url starts with  'api/' this is a dynamic resource
            if (typeof (source.isDynamic) === 'undefined') {
                source.isDynamic = (source.url.indexOf('api/') === 0) || (source.url.indexOf('/api/') === 0);
            }

            var featureTypes = source.featureTypes;
            if (source.propertyTypeData) {
                for (var key in source.propertyTypeData) {
                    var propertyType: IPropertyType = source.propertyTypeData[key];
                    propertyType.id = source.url + '#' + key;
                    this.initPropertyType(propertyType, source.legends);
                    if (!propertyType.label) propertyType.label = key;
                    // EV Check that this doesn't cause errors when two different resource files define the same key. Shouldn't we use the id?
                    this.propertyTypeData[key] = propertyType;
                }
            }
            if (featureTypes) {
                for (var typeName in featureTypes) {
                    var tn = source.url + '#' + typeName;
                    //if (!this._featureTypes.hasOwnProperty(tn)) continue;
                    var featureType: IFeatureType = featureTypes[typeName];
                    featureType.id = tn;
                    this.initFeatureType(featureType, source);
                    this._featureTypes[tn] = featureType;
                }
            }
        }

        public getLayerPropertyTypes(layer: ProjectLayer): IPropertyType[] {
            var res: IPropertyType[] = [];
            // TODO Check this - doesn't seem to do anything
            // if (layer.typeUrl && layer.defaultFeatureType) {
            //     var t = this.getFeatureTypeById(layer.typeUrl + '#' + layer.defaultFeatureType);
            //     if (t.propertyTypeKeys) { }
            // }

            return res;
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
            if (style.property && style.property === 'gridlayer') {
                if (!style.group || !style.group.layers) return;
                style.group.layers.forEach((l: ProjectLayer) => {
                    if (l.mapLayer && l.enabled) {
                        var mapLayers = l.mapLayer.getLayers();
                        mapLayers.forEach((ml) => {
                            if ((<any>ml).redraw && typeof (<any>ml).redraw === 'function') {
                                (<any>ml).params({ minColor: style.colors[0], maxColor: style.colors[1], areColorsUpdated: true });
                                (<any>ml).redraw();
                            }
                        });
                    }
                });
            } else {
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
        }

        public updateGroupFeatures(group: ProjectGroup) {
            if (!group) return;
            this.project.features.forEach((f: IFeature) => {
                if (f.layer.group === group) {
                    this.calculateFeatureStyle(f);
                    this.activeMapRenderer.updateFeature(f);
                }
            });
        }

        /**
         * Recompute the style of the layer features, e.g. after changing the opacity or after
         * zooming to a level outside the layers' range.
         */
        public updateLayerFeatures(layer: ProjectLayer) {
            if (!layer) return;
            this.project.features.forEach((f: IFeature) => {
                if (f.layer.id === layer.id) {
                    this.calculateFeatureStyle(f);
                    this.activeMapRenderer.updateFeature(f);
                }
            });
        }

        public updateCanvasOverlay(layer: ProjectLayer) {
            if (!layer || !layer.mapLayer) return;
            var mapLayers = layer.mapLayer.getLayers();
            mapLayers.forEach((ml) => {
                if ((<any>ml).redraw && typeof (<any>ml).redraw === 'function') {
                    var layerOpacity: number = (+layer.opacity) / 100;
                    layerOpacity = Math.min(1, Math.max(0, layerOpacity)); //set bounds to 0 - 1
                    (<any>ml).params({ opacity: layerOpacity });
                    (<any>ml).redraw();
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
            if (!renderer) return;
            if (this.activeMapRenderer && this.activeMapRenderer.title === renderer) return;

            if (this.mapRenderers.hasOwnProperty(renderer)) {
                if (this.activeMapRenderer) this.activeMapRenderer.disable();
                this.activeMapRenderer = this.mapRenderers[renderer];
                this.activeMapRenderer.enable(this.$mapService.activeBaseLayer);
            }
        }

        public centerFeatureOnMap(selFeatures: IFeature[]) {
            if (!selFeatures || !_.isArray(selFeatures) || selFeatures.length === 0) return;
            var f: IFeature = selFeatures[0];
            var center;
            if (f.geometry.type.toLowerCase() === 'point') {
                center = f.geometry.coordinates;
            } else {
                center = csComp.Helpers.GeoExtensions.getCentroid(f.geometry.coordinates).coordinates;
            }
            if (!center || center.length < 2) return;
            this.map.getMap().panTo(new L.LatLng(center[1], center[0]));
        }

        public editFeature(feature: IFeature, select = true) {
            feature._gui['editMode'] = true;
            this.updateFeature(feature);
            if (select) this.selectFeature(feature);
        }

        private deselectFeature(feature: IFeature) {
            feature.isSelected = false;
            this.calculateFeatureStyle(feature);
            this.activeMapRenderer.updateFeature(feature);
        }

        /** Called when a feature is selected. */
        public selectFeature(feature: IFeature, multi = false, force = false) {
            if (force) {
                feature.isSelected = true;
            } else {
                feature.isSelected = !feature.isSelected;
            }
            feature._gui['title'] = Helpers.getFeatureTitle(feature);

            // deselect last feature and also update
            if (this.lastSelectedFeature != null && this.lastSelectedFeature !== feature && !multi) {
                this.deselectFeature(this.lastSelectedFeature);
                this.actionServices.forEach((as: IActionService) => as.deselectFeature(feature));
                this.$messageBusService.publish('feature', 'onFeatureDeselect', this.lastSelectedFeature);
            }

            this.actionServices.forEach((as: IActionService) => {
                if (feature.isSelected) { as.selectFeature(feature); } else { as.deselectFeature(feature); }
            });


            if (feature.isSelected) this.lastSelectedFeature = feature;

            // select new feature, set selected style and bring to front
            this.calculateFeatureStyle(feature);
            this.activeMapRenderer.updateFeature(feature);

            if (multi) {
                if (feature.isSelected) {
                    if (this.selectedFeatures.indexOf(feature) === -1) {
                        this.selectedFeatures.push(feature);
                    }
                } else {
                    if (this.selectedFeatures.indexOf(feature) >= 0) {
                        this.selectedFeatures = this.selectedFeatures.filter((f) => { return f.id !== feature.id; });
                    }
                }
            } else {
                this.selectedFeatures.forEach((f) => { if (f !== feature) this.deselectFeature(f); });
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
                if (!feature.fType.selectActions) {
                    this.actionService.execute('Select feature');
                } else {
                    feature.fType.selectActions.forEach(action => {
                        this.actionService.execute(action, {
                            layerId: feature.layerId
                        });
                    });
                }
                // var rpt = csComp.Helpers.createRightPanelTab('featureprops', 'featureprops', null, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'info', true);
                // var rpt = csComp.Helpers.createRightPanelTab('featureprops', 'featureprops', null, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'info', false, true);
                // this.$messageBusService.publish('rightpanel', 'activate', rpt);

                //this.visual.rightPanelVisible = true; // otherwise, the rightpanel briefly flashes open before closing.

                // var rpt = csComp.Helpers.createRightPanelTab('featurerelations', 'featurerelations', feature, 'Related features', '{{'RELATED_FEATURES' | translate}}', 'link');
                // this.$messageBusService.publish('rightpanel', 'activate', rpt);
                // var rpt = csComp.Helpers.createRightPanelTab('featureprops', 'featureprops', feature, 'Selected feature', '{{'FEATURE_INFO' | translate}}', 'info');
                // this.$messageBusService.publish('rightpanel', 'activate', rpt);
                this.$messageBusService.publish('feature', 'onFeatureSelect', feature);
            }
        }

        public getSelectedFeatures(): IFeature[] {
            return this.selectedFeatures;
        }

        private lookupLog(logs: Log[], timestamp: number): Log {
            if (!logs || logs.length === 0) return <Log>{};
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
                    if (key === '~geometry') {
                        if (l.value !== f.geometry) {
                            f.geometry = <IGeoJsonGeometry>l.value;
                            changed = true;
                        }
                    } else {
                        if (!f.properties.hasOwnProperty(key)) {
                            f.properties[key] = l.value;
                            changed = true;
                        } else {
                            if (f.properties[key] !== l.value) {
                                f.properties[key] = l.value;
                                changed = true;
                            }
                        }
                    }
                }

                if (changed) {
                    this.updateFeature(f);
                }
            }
        }

        public updateFeature(feature: IFeature) {
            this.calculateFeatureStyle(feature);
            this.activeMapRenderer.updateFeature(feature);
            if (feature === this.lastSelectedFeature) {
                this.$messageBusService.publish('feature', 'onFeatureUpdated', feature);
            }
        }

        public getSensorIndex(d: Number, timestamps: Number[]) {
            // check if active dashboard is live, return last value
            if (this.project.activeDashboard && this.project.activeDashboard.isLive) {
                return timestamps.length - 1;
            }
            else {
                for (var i = 1; i < timestamps.length; i++) {
                    if (timestamps[i] > d) {
                        return i - 1;
                    }
                }
            }
            return timestamps.length - 1;
        };


        /// calculate sensor data for a specific feature
        public updateFeatureSensorData(f: IFeature, date: number) {
            var l = f.layer;
            var timeStamps = f.timestamps ? f.timestamps : l.timestamps;
            if (f.sensors || f.coordinates) {
                let changed = false;
                var pos = 0;
                if (f.timestamps) { // check if feature contains timestamps
                    pos = this.getSensorIndex(date, f.timestamps);
                } else if (l.timestamps) {
                    if (l._gui.hasOwnProperty('timestampIndex')) {
                        pos = l._gui['timestampIndex'];
                    } else {
                        pos = this.getSensorIndex(date, l.timestamps);
                        l._gui['timestampIndex'] = pos;
                        l._gui['timestamp'] = l.timestamps[pos];
                    }
                }
                // check if a new coordinate is avaiable
                if (pos >= 0 && f.coordinates && f.geometry && f.coordinates.length > pos && f.coordinates[pos] !== f.geometry.coordinates) {
                    f.geometry.coordinates = f.coordinates[pos];
                    // get marker
                    if (l.group.markers.hasOwnProperty(f.id)) {
                        var m = l.group.markers[f.id];
                        // update position
                        m.setLatLng(new L.LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]));
                    }
                }
                if (f.sensors) {
                    for (var sensorTitle in f.sensors) {
                        var sensor = f.sensors[sensorTitle];
                        if (sensor.length > 0) {
                            var value = sensor[pos];
                            if (value !== f.properties[sensorTitle]) {
                                f.properties[sensorTitle] = value;
                                changed = true;
                            }
                        }
                    }




                    // only update feature if data actually has changed
                    if (changed) {
                        this.calculateFeatureStyle(f);
                        this.activeMapRenderer.updateFeature(f);
                        if (f.isSelected) this.$messageBusService.publish('feature', 'onFeatureUpdated', f);
                    }
                }
            }
        }

        public updateLayerSensorDataWithDate(l: ProjectLayer, date) {
            delete l._gui['timestampIndex'];
            delete l._gui['timestamp'];
            if ((l.hasSensorData || l.sensorLink) && l.data.features) {

                l.data.features.forEach((f: IFeature) => {
                    if ((l.partialBoundingBoxUpdates && f._gui.insideBBOX) || !l.partialBoundingBoxUpdates) this.updateFeatureSensorData(f, date);
                });

                this.mb.publish('layer', 'sensordataUpdated', l);

            }
            if (l.isDynamic && l.useLog) {
                l.data.features.forEach((f: IFeature) => {
                    this.updateLog(f);
                });
            }
        }

        /** update for all features the active sensor data values and update styles */
        public updateSensorData() {
            if (this.project == null || this.project.timeLine == null || this.project.features == null) return;

            for (var ll in this.loadedLayers) {
                var l = this.loadedLayers[ll];
                this.updateLayerSensorData(l);
            };
        }

        /** update sensor data for a layer */
        public updateLayerSensorData(l: ProjectLayer) {
            var date = this.project.timeLine.focus;
            if (this.project.activeDashboard && this.project.activeDashboard.isLive) {
                if (!_.isUndefined(l.timestamps) && _.isArray(l.timestamps)) {
                    date = l.timestamps[l.timestamps.length - 1];
                    this.updateLayerSensorDataWithDate(l, date);
                }
            }
            else {
                this.updateLayerSensorDataWithDate(l, date);
            }
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
            if (!feature) return;
            if (!feature._isInitialized) {
                feature._isInitialized = true;
                feature.type = 'Feature';
                feature._gui = {
                    included: true,
                    insideBBOX: true
                };

                if (!feature.logs) feature.logs = {};
                if (feature.properties == null) feature.properties = {};
                feature.index = layer.count++;
                // make sure it has an id
                if (feature.id == null) feature.id = Helpers.getGuid();
                feature.layerId = layer.id;
                feature.layer = layer;

                // add feature to global list of features
                this.project.features.push(feature);

                // resolve feature type
                feature.fType = this.getFeatureType(feature);

                // evaluate expressions
                this.evaluateFeatureExpressions(<Feature>feature);

                // add to crossfilter
                layer.group.ndx.add([feature]);

                if (!feature.fType) {
                    console.log('Warning: no featureType available');
                } else {
                    // check if defaultLegends are active
                    if (feature.fType.defaultLegendProperty) {
                        if (typeof feature.fType.defaultLegendProperty === 'string') {
                            this.checkLayerLegend(layer, <string>feature.fType.defaultLegendProperty);
                        }
                        else {
                            (<string[]>feature.fType.defaultLegendProperty).forEach(s => this.checkLayerLegend(layer, <string>feature.fType.defaultLegendProperty));
                        }
                    }
                }

                if (!feature.properties.hasOwnProperty('Name')) Helpers.setFeatureName(feature, this.propertyTypeData);
                if (feature.sensors) {
                    for (var s in feature.sensors) {
                        this.cleanSensorData(feature, s);
                    }
                }

                this.calculateFeatureStyle(feature);
                feature.propertiesOld = {};
                if (layer.useLog) this.trackFeature(feature);
                if (applyDigest) this.apply();
                if (layer.timeAware && publishToTimeline) this.$messageBusService.publish('timeline', 'updateFeatures');
            }
            return feature.fType;
        }

        public cleanSensorData(feature: IFeature, s: string) {
            // var propType = this.getPropertyType(feature, s);
            // if (propType && propType.sensorNull)
            for (var i = 0; i < feature.sensors[s].length; i++) {
                if (feature.sensors[s][i] === -1) feature.sensors[s][i] = NaN;
            }

        }

        /** remove feature */
        public removeFeature(feature: IFeature, save: boolean = false) {
            this.project.features = this.project.features.filter((f: IFeature) => { return f !== feature; });
            feature.layer.data.features = feature.layer.data.features.filter((f: IFeature) => { return f !== feature; });
            if (feature.layer.group.filterResult)
                feature.layer.group.filterResult = feature.layer.group.filterResult.filter((f: IFeature) => { return f !== feature; });
            feature.layer.group.ndx.remove([feature]);
            this.activeMapRenderer.removeFeature(feature);

            this.$messageBusService.publish('feature', 'onFeatureRemoved', feature);

            if (save && feature.layer.isDynamic) {
                var s = new LayerUpdate();
                s.layerId = feature.layerId;
                s.action = LayerUpdateAction.deleteFeature;
                s.item = feature.id;
                this.$messageBusService.serverSendMessageAction('layer', s);
            }

            if (feature.isSelected) {
                this.lastSelectedFeature = null;
                this.selectedFeatures.some((f, ind, arr) => {
                    if (f.id === feature.id) {
                        arr.splice(ind, 1);
                        return true;
                    }
                });
            }
        }

        /**
        * Calculate the effective feature style.
        */
        public calculateFeatureStyle(feature: IFeature) {
            var s = csComp.Helpers.getDefaultFeatureStyle(feature);
            var ft = this.getFeatureType(feature);
            var style = ft.style;
            var properties = feature.properties;
            if (style) {
                if (style.nameLabel) s.nameLabel = style.nameLabel;
                if (style.marker) s.marker = style.marker;
                if (style.iconUri) s.iconUri = style.iconUri;
                if (style.fillOpacity >= 0) s.fillOpacity = style.fillOpacity;
                if (style.strokeOpacity >= 0) s.strokeOpacity = style.strokeOpacity;
                if (style.opacity >= 0) s.opacity = style.opacity;
                if (style.fillColor) s.fillColor = csComp.Helpers.getColorString(style.fillColor);
                // Stroke is a boolean property, so you have to check whether it is undefined.
                if (typeof style.stroke !== 'undefined') s.stroke = style.stroke;
                if (style.strokeColor) s.strokeColor = csComp.Helpers.getColorString(style.strokeColor, '#fff');
                // StrokeWidth can be 0 (interpreted as false), so you have to check whether it is undefined.
                if (typeof style.strokeWidth !== 'undefined') s.strokeWidth = style.strokeWidth;
                if (style.selectedStrokeColor) s.selectedStrokeColor = csComp.Helpers.getColorString(style.selectedStrokeColor, '#000');
                if (style.selectedFillColor) s.selectedFillColor = csComp.Helpers.getColorString(style.selectedFillColor);
                if (style.selectedStrokeWidth >= 0) s.selectedStrokeWidth = style.selectedStrokeWidth;
                if (style.iconWidth >= 0) s.iconWidth = style.iconWidth;
                if (style.iconHeight >= 0) s.iconHeight = style.iconHeight;
                if (style.heightAboveSeaProperty) s.heightAboveSeaProperty = style.heightAboveSeaProperty;
                if (style.modelUri) s.modelUri = style.modelUri;
                if (style.modelScale) s.modelScale = style.modelScale;
                if (style.modelMinimumPixelSize) s.modelMinimumPixelSize = style.modelMinimumPixelSize;
                if (style.innerTextProperty) s.innerTextProperty = style.innerTextProperty;
                if (style.innerTextSize >= 0) s.innerTextSize = style.innerTextSize;
                if (style.cornerRadius >= 0) s.cornerRadius = style.cornerRadius;
                if (style.rotateProperty && properties.hasOwnProperty(style.rotateProperty)) {
                    s.rotate = Number(properties[style.rotateProperty]);
                }
                if (style.heightProperty && properties.hasOwnProperty(style.heightProperty)) {
                    s.height = Number(properties[style.heightProperty]);
                } else {
                    s.height = style.height;
                }
                // For Cesium
                if (style.modelUriProperty && properties.hasOwnProperty(style.modelUriProperty)) {
                    s.modelUri = properties[style.modelUriProperty];
                } else {
                    s.modelUri = style.modelUri;
                }
                if (style.modelScaleProperty && properties.hasOwnProperty(style.modelScaleProperty)) {
                    s.modelScale = properties[style.modelScaleProperty];
                } else {
                    s.modelScale = style.modelScale;
                }
                if (style.modelMinimumPixelSizeProperty && properties.hasOwnProperty(style.modelMinimumPixelSizeProperty)) {
                    s.modelMinimumPixelSize = properties[style.modelMinimumPixelSizeProperty];
                } else {
                    s.modelMinimumPixelSize = style.modelMinimumPixelSize;
                }
            }

            feature._gui['style'] = {};
            if (feature.layer) {
                if (!feature.layer.hasOwnProperty('opacity')) feature.layer.opacity = 100;
                s.opacity = (feature.layer.isTransparent) ? 0 : s.opacity * (feature.layer.opacity / 100);
                s.fillOpacity = (feature.layer.isTransparent) ? 0 : s.fillOpacity * (feature.layer.opacity / 100);
                s.iconHeight = (feature.layer.isTransparent) ? 0 : s.iconHeight;
                s.iconWidth = (feature.layer.isTransparent) ? 0 : s.iconWidth;
                s.strokeWidth = (feature.layer.isTransparent) ? 0 : s.strokeWidth;
            }

            if (feature.layer && feature.layer.group && feature.layer.group.styles) {
                feature.layer.group.styles.forEach((gs: GroupStyle) => {
                    if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
                        //delete feature.gui[gs.property];
                        var v = Number(feature.properties[gs.property]);
                        try {
                            if (!isNaN(v)) {

                                switch (gs.visualAspect) {
                                    case 'strokeColor':
                                        s.strokeColor = csComp.Helpers.getColor(v, gs);
                                        feature._gui['style'][gs.property] = s.strokeColor;
                                        break;
                                    case 'fillColor':
                                        s.fillColor = csComp.Helpers.getColor(v, gs);
                                        if (s.fillColor.length > 7) { // Convert RGBA to RGB & opacity
                                            let res = csComp.Helpers.getColorAndOpacityFromRgbaString(s.fillColor);
                                            if (res) {
                                                s.fillColor = res.color;
                                                s.fillOpacity = res.opacity;
                                            }
                                        }
                                        feature._gui['style'][gs.property] = s.fillColor;
                                        if (feature.geometry && feature.geometry.type && feature.geometry.type.toLowerCase() === 'linestring') {
                                            s.strokeColor = s.fillColor; //s.strokeColor = s.fillColor;
                                        }
                                        break;
                                    case 'strokeWidth':
                                        s.strokeWidth = ((v - gs.info.min) / (gs.info.max - gs.info.min) * 10) + 1;
                                        break;
                                    case 'height':
                                        s.height = ((v - gs.info.min) / (gs.info.max - gs.info.min) * 25000);
                                        break;
                                }
                            } else {
                                var ss = feature.properties[gs.property].toString();
                                switch (gs.visualAspect) {
                                    case 'strokeColor':
                                        s.strokeColor = csComp.Helpers.getColorFromStringValue(ss, gs);
                                        feature._gui['style'][gs.property] = s.strokeColor;
                                        break;
                                    case 'fillColor':
                                        s.fillColor = csComp.Helpers.getColorFromStringValue(ss, gs);
                                        if (s.fillColor.length > 7) { // Convert RGBA to RGB & opacity
                                            let res = csComp.Helpers.getColorAndOpacityFromRgbaString(s.fillColor);
                                            if (res) {
                                                s.fillColor = res.color;
                                                s.fillOpacity = res.opacity;
                                            }
                                        }
                                        feature._gui['style'][gs.property] = s.fillColor;
                                        break;
                                }
                            }
                        } catch (e) {
                            console.log('Error setting style for feature ' + e.message);
                        }
                        //s.fillColor = this.getColor(feature.properties[layer.group.styleProperty], null);
                    }
                });
            }

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
        public initFeatureType(ft: IFeatureType, source: ITypesResource) {
            if (ft._isInitialized) return;
            ft._isInitialized = true;
            this.initIconUri(ft);
            if (ft.languages != null && this.currentLocale in ft.languages) {
                var locale = ft.languages[this.currentLocale];
                if (locale.name) ft.name = locale.name;
            }
            if (!ft._propertyTypeData || ft._propertyTypeData.length === 0) {
                ft._propertyTypeData = [];
                if (ft.propertyTypeKeys && ft.propertyTypeKeys.length > 0) {
                    ft.propertyTypeKeys.split(/[,;]+/).forEach((key: string) => {
                        if (source.propertyTypeData) {
                            // check if property type already exists
                            if (source.propertyTypeData.hasOwnProperty(key)) {
                                ft._propertyTypeData.push(source.propertyTypeData[key]);
                            } else // if not create a new one with the key as label/property and title
                            {
                                let pt = <IPropertyType>{ label: key, title: key, type: 'text' };
                                source.propertyTypeData[key] = pt;

                                ft._propertyTypeData.push(pt);
                            }
                        }
                    });
                }

                ft._expressions = [];
                ft._propertyTypeData.forEach(pt => {
                    if (pt.expression) {
                        ft._expressions.push(pt);
                    }
                });
            }




        }

        /** Set the iconUri for remote servers (newIconUri = server/oldIconUri) */
        private initIconUri(ft: IFeatureType) {
            if (!ft.style.iconUri) return;
            const testForRemoteServerRegex = /^(http[s]?:\/\/[:a-zA-Z0-9_\.]+)\/.*$/g;
            var matches = testForRemoteServerRegex.exec(ft.id);
            if (matches && matches.length > 1) {
                ft.style.iconUri = `${matches[1]}/${ft.style.iconUri}`;
            }
        }

        /**
        * Initialize the property type with default values, and, if applicable, localize it.
        */
        private initPropertyType(pt: IPropertyType, legends: any) {
            this.setDefaultPropertyType(pt);
            if (pt.legendType && legends && legends.hasOwnProperty(pt.legendType)) pt.legend = legends[pt.legendType];
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
            if (!pt.type) pt.type = 'text';
            if (typeof pt.title === 'undefined') pt.title = pt.label;
            if (typeof pt.canEdit === 'undefined') pt.canEdit = false;
            if (typeof pt.visibleInCallOut === 'undefined') pt.visibleInCallOut = true;
            if (typeof pt.isSearchable === 'undefined' && pt.type === 'text') pt.isSearchable = true;
            if (pt.options && _.isArray(pt.options)) {
                var oo = <string[]>pt.options;
                pt.options = {};
                var i = 0;
                oo.forEach(o => {
                    pt.options[i] = o;
                    i += 1;
                });
            }
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

        public findResourceByLayer(layer: ProjectLayer): TypeResource {
            if (layer && layer.typeUrl) {
                if (this.typesResources.hasOwnProperty(layer.typeUrl)) {
                    return this.typesResources[layer.typeUrl];
                } else return null;
            } else return null;
        }

        public findResourceByFeature(feature: IFeature) {
            if (feature.layer && feature.layer.typeUrl) {
                var typeUrl = feature.layer.typeUrl;
                if (this.typesResources.hasOwnProperty(typeUrl)) {
                    return this.typesResources[typeUrl];
                } else return null;
            } else return null;
        }

        public findPropertyTypeById(id: string): IPropertyType {
            if (id.indexOf('#') === -1) return null;
            for (var r in this.typesResources) {
                if (id.indexOf(r) === 0) {
                    var res = this.typesResources[r].propertyTypeData;
                    var k = id.split('#')[1];
                    if (res.hasOwnProperty(k)) return res[k];
                }
            }
            return null;
        }

        /**
         * find a filter for a specific group/property combination
         */
        private findFilter(group: ProjectGroup, property: string): GroupFilter {
            if (!group || !property) return;
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
        public findFeatureById(featureId: string): IFeature {
            return _.find(this.project.features, (f: IFeature) => { return f.id === featureId; });
        }

        /**
         * Find a feature by layerId and FeatureId.
         * @property {string}
         * @value {number}
         */
        public findFeatureByPropertyValue(property: string, value: Object): IFeature {
            return _.find(this.project.features, (f: IFeature) => { return f.properties.hasOwnProperty(property) && f.properties[property] === value; });
        }

        /**
         * Find a feature by layerId and FeatureId.
         * @layer {ProjectLayer}
         * @featureId {number}
         */
        findFeature(layer: ProjectLayer, featureId: string): IFeature {
            if (!layer.data || !layer.data.features) return null;
            return _.find(layer.data.features, (f: IFeature) => { return f.id === featureId; });
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
                if (feature.hasOwnProperty('Name') && name === feature.properties['Name'])
                    return feature;
            }
        }

        /**
        * Find a loaded layer with a specific id.
        */
        findLoadedLayer(id: string): ProjectLayer {
            if (this.loadedLayers.hasOwnProperty(id)) return this.loadedLayers[id];
            return null;
        }

        /**
         * Find a layer with a specific id.
         */
        findLayer(id: string): ProjectLayer {
            if (this.loadedLayers.hasOwnProperty(id)) return this.loadedLayers[id];
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

        public setGroupStyle(group: ProjectGroup, property: IPropertyType) {
            if (typeof property === 'undefined' || property === null) return;
            if (typeof group === 'undefined' || group === null) return;
            var gs = new GroupStyle(this.$translate);
            gs.id = Helpers.getGuid();
            gs.title = property.title;
            gs.visualAspect = 'fillColor';
            gs.canSelectColor = gs.visualAspect.toLowerCase().indexOf('color') > -1;
            gs.info = this.calculatePropertyInfo(group, property.label);
            gs.enabled = true;
            gs.property = property.label;
            gs.group = group;
            if (property.legend) {
                gs.activeLegend = property.legend;
                if (gs.activeLegend.visualAspect) gs.visualAspect = gs.activeLegend.visualAspect;
            } else {
                gs.colors = ['white', '#FF5500'];
            }

            this.saveStyle(group, gs);
            this.project.features.forEach((fe: IFeature) => {
                if (fe.layer.group === group) {
                    this.calculateFeatureStyle(fe);
                    this.activeMapRenderer.updateFeature(fe);
                }
            });
            this.$messageBusService.publish('updatelegend', 'updatedstyle', gs);
        }

        public setStyleForProperty(layer: ProjectLayer, property: string): GroupStyle {
            return this.setStyle({
                feature: {
                    featureTypeName: layer.url + '#' + property,
                    layer: layer
                },
                property: property,
                key: property,
            }, false);
        }

        /**
         * Creates a GroupStyle based on a property and adds it to a group.
         * If the group already has a style which contains legends, those legends are copied into the newly created group.
         * Already existing groups (for the same visualAspect) are replaced by the new group.
         * Restoring a previously used groupstyle is possible by sending that GroupStyle object.
         */
        public setStyle(property: any, openStyleTab = false, customStyleInfo?: PropertyInfo, groupStyle?: GroupStyle): GroupStyle {
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
                    gs.visualAspect = (ft.style && ft.style.drawingMode && ft.style.drawingMode.toLowerCase() === 'line')
                        ? 'strokeColor'
                        : 'fillColor';
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
                        if (ptd.legend.visualAspect) gs.visualAspect = ptd.legend.visualAspect;

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
                    if (fe.layer.group === f.layer.group) {
                        this.calculateFeatureStyle(fe);
                        this.activeMapRenderer.updateFeature(fe);
                    }
                });

                if (openStyleTab) (<any>$('#leftPanelTab a[data-target="#styles"]')).tab('show'); // Select tab by name
                this.$messageBusService.publish('updatelegend', 'updatedstyle', gs);
                return gs;
            }
            return null;
        }

        public toggleStyle(property: any, group: ProjectGroup, openStyleTab = false, customStyleInfo?: PropertyInfo) {
            var s = property.feature.layer.group.styles;
            if (!s.some((s: GroupStyle) => s.property === property.property)) {
                this.setStyle(property, openStyleTab, customStyleInfo);
            } else {
                s.filter((s: GroupStyle) => s.property === property.property).forEach((st: GroupStyle) => this.removeStyle(st));
            }
            this.$messageBusService.publish('updatelegend', 'updatedstyle');
        }

        /**
         * checks if there are other styles that affect the same visual aspect, removes them (it)
         * and then adds the style to the group's styles
         */
        public saveStyle(group: ProjectGroup, style: GroupStyle) {
            var oldStyles = group.styles.filter((s: GroupStyle) => s.visualAspect === style.visualAspect);
            if (oldStyles.length > 0) {
                var pos = group.styles.indexOf(oldStyles[0]);
                group.styles.splice(pos, 1);   // RS, 2015-04-04: why delete only one style? (what if oldStyles.length > 1)
            }
            group.styles.push(style);
        }

        /** checks if there are any filters available, used to show/hide filter tab leftpanel menu */
        updateFilterAvailability() {
            this.noFilters = true;
            this.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                if (g.filters.length > 0 && this.noFilters) this.noFilters = false;
            });
        }

        addFilter(group: ProjectGroup, prop: string) {
            var filter = this.findFilter(group, prop);
            if (filter == null) {

                var gf = new GroupFilter();
                gf.property = prop;
                //gf.filterType = 'row';
                gf.title = prop;
                gf.rangex = [0, 1];
                group.filters.push(gf);
                // add filter
            } else {
                var pos = group.filters.indexOf(filter);
                if (pos !== -1) group.filters.slice(pos, 1);

            }
            this.visual.leftPanelVisible = true;
            (<any>$('#leftPanelTab a[data-target="#filters"]')).tab('show'); // Select tab by name
        }

        /**
         * enable a filter for a specific property
         */
        setFilter(filter: GroupFilter, group: csComp.Services.ProjectGroup) {
            filter.group = group;
            group.filters.push(filter);
            this.visual.leftPanelVisible = true;
            (<any>$('#leftPanelTab a[data-target="#filters"]')).tab('show'); // Select tab by name
            this.triggerUpdateFilter(group.id);
        }

        setLocationFilter(group: ProjectGroup) {
            if (group.filters.some((f) => { return f.filterType === 'location'; })) return;
            var gf = new GroupFilter();
            gf.id = Helpers.getGuid();
            gf.group = group;
            gf.filterType = 'location';
            gf.title = 'Location';
            gf.rangex = [0, 1];
            group.filters.push(gf);
            (<any>$('#leftPanelTab a[data-target="#filters"]')).tab('show'); // Select tab by name
            this.triggerUpdateFilter(group.id);
        }

        setFeatureAreaFilter(f: IFeature) {
            this.project.groups.forEach(g => {
                if (g.id === f.layer.group.id) return;
                if (!g.filters.some((f) => { return f.filterType === 'area'; })) {
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
                                    case 'date':
                                        gf.filterType = 'date';
                                        break;
                                    case 'number':
                                        gf.filterType = 'bar';
                                        break;
                                    case 'options':
                                        gf.filterType = 'row';
                                        gf.filterLabel = f.properties[prop];
                                        break;
                                    //case 'rank':
                                    //    gf.filterType  = 'bar';
                                    //    gf.value = property.value.split(',')[0];
                                    //    break;
                                    case 'text':
                                        gf.filterType = 'row';
                                        gf.filterLabel = f.properties[prop];
                                        break;
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
                        // add filter
                        layer.group.filters.push(gf);
                    } else {
                        this.removeFilter(filter);
                    }
                }
                (<any>$('#leftPanelTab a[data-target="#filters"]')).tab('show'); // Select tab by name
            }
            this.triggerUpdateFilter(layer.group.id);
        }

        public createScatterFilter(group: ProjectGroup, prop1: string, prop2: string) {
            //console.log('create scatter ' + prop1 + '-' + prop2);

            var gf = new GroupFilter();
            gf.property = prop1;
            gf.property2 = prop2;
            gf.id = Helpers.getGuid();
            gf.group = group;
            //gf.meta = property.meta;
            gf.filterType = 'scatter';
            // if (gf.meta != null) {
            //     if (gf.meta.filterType != null) {
            //         gf.filterType = gf.meta.filterType;
            //     } else {
            //         switch (gf.meta.type) {
            //             case 'date':
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
            gf.title = 'Scatter';
            gf.rangex = [0, 1];

            // add filter
            group.filters.push(gf);

            (<any>$('#leftPanelTab a[data-target="#filters"]')).tab('show'); // Select tab by name
            this.triggerUpdateFilter(group.id);
        }

        public triggerUpdateFilter(groupId: string) {
            this.mb.publish('filters', 'updated', groupId);
            this.updateFilterAvailability();
        }

        /** remove filter from group */
        public removeFilter(filter: GroupFilter) {
            if (!filter || !filter.dimension) return;
            // dispose crossfilter dimension
            filter.group.filterResult = filter.dimension.filterAll().top(Infinity);
            filter.dimension.dispose();
            filter.group.filters = filter.group.filters.filter(f => { return f !== filter; });
            this.resetMapFilter(filter.group);
            this.updateMapFilter(filter.group);
            this.triggerUpdateFilter(filter.group.id);
        }

        /**
         * Returns PropertyType for a specific property in a feature
         */
        public getPropertyType(feature: IFeature, property: string): IPropertyType {
            var res: IPropertyType;
            // search for local propertytypes in featuretype
            if (feature.fType && feature.fType._propertyTypeData && feature.fType._propertyTypeData.length > 0) {
                res = _.find(feature.fType._propertyTypeData, (pt: IPropertyType) => { return pt.label === property; });
                if (res) return res;
            }

            if (!feature.layer.typeUrl || !this.typesResources.hasOwnProperty(feature.layer.typeUrl)) return res;

            // if (feature.fType.propertyTypeKeys && typeof feature.fType.propertyTypeKeys === 'string') {
            //     feature.fType.propertyTypeKeys.split(';').forEach((key: string) => {
            //         if (rt.propertyTypeData.hasOwnProperty(key) && rt.propertyTypeData[key].label === property) res = rt.propertyTypeData[key];
            //     });
            // }

            if (!res) {
                var rt = this.typesResources[feature.layer.typeUrl];
                res = _.find(rt.propertyTypeData, (pt: IPropertyType) => { return pt.label === property; });
            }

            if (!res) {
                res = <IPropertyType>{ label: property, type: 'text', title: property };
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
            if (!feature.hasOwnProperty('properties')) feature['properties'] = {};
            var ftId = feature.properties['FeatureTypeId'] || feature.properties['featureTypeId'] || feature.layer.defaultFeatureType || 'Default';

            // if (name.toLowerCase().startsWith('http://')) return name;
            // if (csComp.Helpers.startsWith(name.toLowerCase(), 'http://')) return name;
            if (/^http:\/\//.test(ftId.toLowerCase())) return ftId;
            if (feature.layer.typeUrl) return feature.layer.typeUrl + '#' + ftId;
            return feature.layer.url
                ? feature.layer.url + '#' + ftId
                : this.project.url + '#' + ftId;
        }

        /**
         * Find a feature type by its ID (of the format 'featuretypeurl + # + featuretypename').
         * If it does not exist, return null.
         */
        getFeatureTypeById(featureTypeId: string): IFeatureType {
            if (this._featureTypes.hasOwnProperty(featureTypeId)) {
                return this._featureTypes[featureTypeId];
            } else {
                return;
            }
        }

        /**
         * Return the feature style for a specific feature.
         * First, look for a layer specific feature type, otherwise, look for a project-specific feature type.
         * In case both fail, create a default feature type at the layer level.
         *
         * If the feature type contains a _{xxx} part, replace the {xxx} with the value of feature.property['xxx']
         * if it exists, otherwise remove it.
         */
        getFeatureType(feature: IFeature): IFeatureType {
            if (!feature.featureTypeName) {
                feature.featureTypeName = this.getFeatureTypeId(feature);
            }
            var isPropertyBasedFeatureType = feature.featureTypeName.indexOf('_{') >= 0;
            if (!isPropertyBasedFeatureType && feature.fType) return feature.fType;
            var featureTypeName = feature.featureTypeName;
            if (isPropertyBasedFeatureType) {
                // Feature type depends on a property, so substite the property placeholder with its value,
                // e.g. featureTypeId='default_{state}', and property state='failed', look for featureTypeId=default_failed
                // If state is not defined, featureTypeId=default.
                const re = /_{([a-zA-Z_0-9]+)}/g;
                var matches = re.exec(featureTypeName);
                if (matches) {
                    for (let i = 1; i < matches.length; i++) {
                        var match = matches[i];
                        featureTypeName = feature.properties.hasOwnProperty(match)
                            ? featureTypeName.replace(`{${match}}`, feature.properties[match])
                            : featureTypeName.replace(`_{${match}}`, '');
                    }
                }
            }

            if (!this._featureTypes.hasOwnProperty(featureTypeName)) {
                this.createMissingFeatureType(feature);
            }
            feature.fType = this._featureTypes[featureTypeName];
            return feature.fType;
        }

        private createMissingFeatureType(feature: IFeature) {
            var ftKeys = Object.getOwnPropertyNames(this._featureTypes);
            var featureTypes = ftKeys.map(key => this._featureTypes[key]).filter(ft => ft.name === feature.featureTypeName);
            if (featureTypes.length > 0) {
                this._featureTypes[feature.featureTypeName] = featureTypes[0];
            } else {
                this._featureTypes[feature.featureTypeName] = csComp.Helpers.createDefaultType(feature, null);
            }
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

            try {

                layer.enabled = false;
                layer.isLoading = false;
                if (layer._gui) layer._gui.more = false;
                //if (layer.refreshTimer) layer.stop();

                // make sure the timers are disabled
                this.checkLayerTimer(layer);

                delete this.loadedLayers[layer.id];

                // find layer source, and remove layer
                if (!layer.layerSource) layer.layerSource = this.layerSources[layer.type.toLowerCase()];
                layer.layerSource.removeLayer(layer);

                if (this.lastSelectedFeature != null && this.lastSelectedFeature.layerId === layer.id) {
                    this.lastSelectedFeature = null;
                    this.visual.rightPanelVisible = false;
                    this.$messageBusService.publish('feature', 'onFeatureDeselect');
                }
                if (this.selectedFeatures.length > 0) {
                    this.selectedFeatures = this.selectedFeatures.filter((f) => { return f.layerId !== layer.id; });
                }

                this.activeMapRenderer.removeLayer(layer);

                this.project.features = this.project.features.filter((k: IFeature) => k.layerId !== layer.id);
                var layerName = layer.id + '_';
                var featureTypes = this._featureTypes;
                // EV What should this have done?
                // for (var poiTypeName in featureTypes) {
                //     if (!featureTypes.hasOwnProperty(poiTypeName)) continue;
                // }

                // check if there are no more active layers in group and remove filters/styles
                this.removeAllFilters(g);
                this.removeAllStyles(g);

                this.rebuildFilters(g);
                if (removeFromGroup) layer.group.layers = layer.group.layers.filter((pl: ProjectLayer) => pl !== layer);
                this.apply();
                this.$messageBusService.publish('layer', 'deactivate', layer);
                this.$messageBusService.publish('rightpanel', 'deactiveContainer', 'edit');
                if (layer.timeAware) this.$messageBusService.publish('timeline', 'updateFeatures');
                if (removeFromGroup) this.saveProject();
            }
            catch (e) {

            }
        }

        public removeAllFilters(g: ProjectGroup) {
            // if (g.layers.filter((l: ProjectLayer) => { return (l.enabled); }).length === 0 || g.oneLayerActive === true) {
            g.filters.forEach((gf: GroupFilter) => {
                this.removeFilter(gf);
            });
            g.filters.length = 0;
            // }
        }

        public removeAllStyles(g: ProjectGroup) {
            g.styles.forEach(s => { this.removeStyle(s); });
            g.styles.length = 0;
        }

        /***
         * Open solution file with references to available baselayers and projects
         * @params url: URL of the solution
         * @params layers: Optionally provide a semi-colon separated list of layer IDs that should be opened.
         * @params initialProject: Optionally provide a project name that should be loaded, if omitted the first project in the definition will be loaded
         */
        openSolution(url: string, layers?: string, initialProject?: string): void {
            //console.log('layers (openSolution): ' + JSON.stringify(layers));
            this.loadedLayers = {};

            var searchParams = this.$location.search();
            if (searchParams.hasOwnProperty('project')) {
                url = this.emptySolutionUrl;
                this.openSingleProject = true;
            }

            this.$http.get(url)
                .then((res: {data: Solution}) => {
                    if (!res || !res.data) {
                        console.log('Error: no solution obtained!');
                        return;
                    }
                    let solution = res.data;
                    if (typeof solution !== 'object') {
                        console.log('Error: obtained solution is not a json object!');
                        return;
                    }
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
                            if (b.maxNativeZoom != null) baselayer.maxNativeZoom = b.maxNativeZoom;
                            if (b.errorTileUrl != null) baselayer.errorTileUrl = b.errorTileUrl;
                            if (b.attribution != null) baselayer.attribution = b.attribution;
                            if (b.id != null) baselayer.id = b.id;
                            if (b.title != null) baselayer.title = b.title;
                            if (b.subtitle != null) baselayer.subtitle = b.subtitle;
                            if (b.preview != null) baselayer.preview = b.preview;
                            if (b.url != null) baselayer.url = b.url;
                            if (b.cesium_url != null) baselayer.cesium_url = b.cesium_url;
                            if (b.cesium_tileUrl != null) baselayer.cesium_tileUrl = b.cesium_tileUrl;
                            if (b.cesium_maptype != null) baselayer.cesium_maptype = b.cesium_maptype;
                            if (b.tms != null) baselayer.tms = b.tms;
                            if (b.noWrap != null) baselayer.noWrap = b.noWrap;

                            this.$mapService.baseLayers[b.title] = baselayer;
                            if (b.isDefault) {
                                this.activeMapRenderer.changeBaseLayer(baselayer);
                                this.$mapService.changeBaseLayer(b.title);
                            }
                        });
                    }

                    if (this.openSingleProject) {
                        let projectId = searchParams['project'];
                        // By default, look for an API project
                        let u = 'api/projects/' + projectId;
                        if (!initialProject) {
                            var foundProject = solution.projects.some(p => {
                                // If the solution already specifies a project, use that instead.
                                if (p.id !== projectId) return false;
                                initialProject = p.title;
                                //u = p.url;
                                return true;
                            });
                            if (!foundProject) {
                                this.$http.get(u)
                                    .then((res: {data: Project}) => {
                                        let data;
                                        if (res.data) {
                                            data = res.data;
                                            this.parseProject(data, <SolutionProject>{ title: data.title, url: data.url, dynamic: true }, []);
                                        }
                                    },
                                    (err) => {
                                        this.$messageBusService.notify('ERROR loading project', 'while loading: ' + u);
                                    });
                            }
                        } else {
                            this.$http.get(u)
                                .then(<Project>(data) => {
                                    if (data) {
                                        this.parseProject(data, <SolutionProject>{ title: data.title, url: data.url, dynamic: true }, []);
                                    }
                                },
                                (data) => {
                                    this.$messageBusService.notify('ERROR loading project', 'while loading: ' + u);
                                });
                        }
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
                        defaultStyle.background = 'red';
                        solution.widgetStyles['default'] = defaultStyle;
                    }

                    this.solution = solution;
                }, () => {
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
                    .then((res: {data: Project}) => {
                        let prj = res.data;
                        this.parseProject(prj, solutionProject, layerIds);

                        this.throttleSensorDataUpdate = _.debounce(this.updateSensorData, this.project.timeLine.updateDelay);
                        var delayFocusChange = _.debounce((date) => { this.refreshActiveLayers(); }, this.project.timeLine.updateDelay);
                        //alert('project open ' + this.$location.absUrl());
                    }, () => {
                        this.$messageBusService.notify('ERROR loading project', 'while loading: ' + solutionProject.url);
                    });
            } else {
                this.parseProject(project, solutionProject, layerIds);
            }
        }

        private parseProject(prj: Project, solutionProject: csComp.Services.SolutionProject, layerIds: Array<string>) {
            prj.solution = this.solution;
            this.setLanguage(prj);
            this.project = new Project().deserialize(prj);

            if (!this.project.disableDrop) {
                this.enableDrop();
            }

            this.$mapService.initDraw(this);

            if (typeof this.project.isDynamic === 'undefined') this.project.isDynamic = solutionProject.dynamic;

            if (!this.project.timeLine) {
                this.project.timeLine = new DateRange();
            } else {
                // Set range
                this.$messageBusService.publish('timeline', 'updateTimerange', this.project.timeLine);
            }

            if (this.project.viewBounds) {
                this.activeMapRenderer.fitBounds(this.project.viewBounds);
            }

            this.$messageBusService.publish('map', 'showScale', this.project.showScale);
            this.$messageBusService.publish('map', 'showLocation', this.project.showLocation);

            this.initTypeResources(this.project);

            if (this.project.eventTab) {
                var rpt = csComp.Helpers.createRightPanelTab('eventtab', 'eventtab', {}, 'Events', `{{'EVENT_INFO' | translate}}`, 'book');
                this.$messageBusService.publish('rightpanel', 'activate', rpt);
            }

            if (this.project.legendTab) {
                var rpt = csComp.Helpers.createRightPanelTab('legend-list', 'legend-list', {}, 'Icon legend', `{{'LEGEND' | translate}}`, 'list-ul', false, false);
                this.$messageBusService.publish('rightpanel', 'activate', rpt);
            }

            // if no dashboards defined, create one
            if (!this.project.dashboards) {
                this.project.dashboards = [];
                var d = new Services.Dashboard();
                d.id = 'map';
                d.name = 'Home';
                d.showMap = true;
                d.showLeftmenu = true;
                d.widgets = [];
                this.project.dashboards.push(d);
                var d2 = new Services.Dashboard();
                d2.id = 'datatable';
                d2.name = 'Table';
                d2.showMap = false;
                d2.showLeftmenu = false;
                d2.showRightmenu = false;
                d2.showTimeline = false;
                d2.widgets = [{
                    id: 'datatable_id',
                    directive: 'datatable',
                    elementId: 'widget-datatable_id',
                    enabled: true,
                    width: '100%',
                    top: "75px",
                    height: '100%',
                    bottom: '0px',
                    position: 'dashboard'
                }];
                this.project.dashboards.push(d2);
            } else {
                // initialize dashboards
                this.project.dashboards.forEach((d) => {
                    d = csComp.Helpers.translateObject(d, this.currentLocale, false);
                    if (!d.id) { d.id = Helpers.getGuid(); }
                    if (d.widgets && d.widgets.length > 0)
                        d.widgets.forEach((w) => {
                            if (w.datasource) {
                                let source = this.findWidgetById(w.datasource);
                                w.data = csComp.Helpers.translateObject(source.data, this.currentLocale, true);
                            } else {
                                w.data = csComp.Helpers.translateObject(w.data, this.currentLocale, true);
                            }
                            if (!w.id) w.id = Helpers.getGuid();
                            if (!w.enabled) w.enabled = true;
                            if (!w.position) w.position = 'dashboard';
                        });
                });
            }
            async.series([
                (callback) => {

                    // load extra type resources
                    if (this.project.typeUrls && this.project.typeUrls.length > 0) {
                        async.eachSeries(this.project.typeUrls, (item, cb) => {
                            this.loadTypeResources(item, false, () => cb(null));
                        }, () => {
                            callback(null, null);
                        });
                    } else {
                        callback(null, null);
                    }
                },
                (callback) => {

                    // load data resources
                    if (!this.project.datasources) this.project.datasources = [];

                    // this.project.datasources.forEach((ds: DataSource) => {
                    //     if (ds.url) {
                    //         DataSource.LoadData(this.$http, ds, () => {
                    //             if (ds.type === 'dynamic') { this.checkDataSourceSubscriptions(ds); }

                    //             for (var s in ds.sensors) {
                    //                 var ss: SensorSet = ds.sensors[s];
                    //                 /// check if there is an propertytype available for this sensor
                    //                 if (ss.propertyTypeKey != null && this.propertyTypeData.hasOwnProperty(ss.propertyTypeKey)) {
                    //                     ss.propertyType = this.propertyTypeData[ss.propertyTypeKey];
                    //                 } else { // else create a new one and store in project
                    //                     var id = 'sensor-' + Helpers.getGuid();
                    //                     var pt: IPropertyType = {};
                    //                     pt.title = s;
                    //                     ss.propertyTypeKey = id;
                    //                     this.project.propertyTypeData[id] = pt;
                    //                     ss.propertyType = pt;
                    //                 }
                    //                 if (ss.values && ss.values.length > 0) {
                    //                     ss.activeValue = ss.values[ss.values.length - 1];
                    //                 }
                    //             }
                    //         });
                    //     }
                    // });
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

            if (this.project.isDynamic) {
                if (!this.project.layerDirectory) this.project.layerDirectory = '/api/layers';
                // check connection
                this.$messageBusService.initConnection('', '', () => {
                    var handle = this.$messageBusService.subscribe('keyupdate', (key: any, msg: ClientMessage) => {
                        if (msg.action === 'key') {
                            var id = 'keys/' + msg.data.keyId;
                            this.findSensorSet(id, (ss: SensorSet) => {
                                var time = new Date().getTime();
                                if (msg.data.item.hasOwnProperty('time')) {
                                    time = msg.data.item['time'];
                                } else {
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
                    //     if (msg.action !== 'subscribed') {
                    //         if (msg.data) {
                    //             var id = 'keys/' + msg.data.keyId;
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
                    //             this.$messageBusService.publish(id, 'update', msg.data.item);
                    //         }
                    //         //this.project.dataSets
                    //     }
                    //
                    // });

                    // setTimeout(() => {
                    //     for (var ll in this.loadedLayers) {
                    //         var layer = <ProjectLayer>this.loadedLayers[ll];
                    //         if (layer && layer.layerSource && layer.layerSource.title.toLowerCase() === 'dynamicgeojson') {
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
                    this.directoryHandle = this.$messageBusService.serverSubscribe('', 'directory', (sub: string, msg: any) => {
                        if (msg.action === 'subscribed') return;

                        // received layer update
                        if (msg.action === 'layer' && msg.data && msg.data.item) {
                            // Disabled for single-project-solutions, as layers from excel2map get updated twice: on layer update and on project update
                            if (this.openSingleProject === false) {
                                var layer = <ProjectLayer> msg.data.item;
                                if (layer) {
                                    var l = this.findLayer(layer.id);
                                    if (!l) {
                                        //this.$messageBusService.notify('New layer available', layer.title);
                                    } else if (l.quickRefresh) {
                                        if (l.enabled) {
                                            var wasRightPanelVisible = this.visual.rightPanelVisible;
                                            //l.data = layer.data;
                                            l.layerSource.refreshLayer(l, layer);
                                            this.visual.rightPanelVisible = wasRightPanelVisible;
                                        }
                                    } else if (l.confirmUpdate) {
                                        this.$messageBusService.confirm('New update available for layer ' + layer.title, 'Do you want to reload this layer', r => {
                                            if (r && l.enabled) {
                                                var wasRightPanelVisible = this.visual.rightPanelVisible;
                                                l.layerSource.refreshLayer(l);
                                                this.visual.rightPanelVisible = wasRightPanelVisible;
                                            }
                                        });
                                    } else {
                                        var wasRightPanelVisible = this.visual.rightPanelVisible;
                                        l.data = layer.data;
                                        l.layerSource.refreshLayer(l, null);
                                        this.visual.rightPanelVisible = wasRightPanelVisible;
                                    }
                                }
                            }
                        }

                        // received project update
                        if (msg.action === 'project' && msg.data && msg.data.item) {
                            var project = <Project>msg.data.item;
                            if (project) {
                                var p = (this.project.id === project.id);
                                if (!p && !this.openSingleProject) {
                                    this.$messageBusService.notify('New project available', project.title);
                                    if (project.url && project.url.substring(project.url.length - 4) !== 'json') project.url = '/data' + project.url + '.json';
                                    if (!this.solution.projects.some(sp => { return (sp.title === project.title); })) {
                                        this.solution.projects.push(<SolutionProject>{ title: project.title, url: project.url, dynamic: true });
                                    } else {
                                        console.log('Project already exists (' + project.title + ')');
                                    }
                                } else {
                                    if (project.id === this.project.id) {
                                        this.$messageBusService.confirm('New update available for project ' + project.title, 'Do you want to reload the project?', r => {
                                            if (r) {
                                                this.openProject(solutionProject, null, project);
                                            }
                                        }, false);
                                        // this.$messageBusService.confirm('The project has been updated, do you want to update it?', 'yes',()=>{
                                        //     this.openProject(solutionProject, null, project);
                                        // });
                                        //this.openProject(solutionProject, null, project);

                                        //var solProj = this.solution.projects.filter(sp => { return (sp.title === project.title) }).pop();

                                    }
                                }
                            }
                        }
                    });
                }

                if (!this.$messageBusService.getConnection(this.project.id)) {
                    this.$messageBusService.serverSubscribe(this.project.id, 'project', (sub: string, msg: any) => {
                        if (msg.action === 'layer-update') {
                            msg.data.layer.forEach((l: ProjectLayer) => {
                                var g: ProjectGroup;
                                // find group
                                if (l.groupId) { g = this.findGroupById(l.groupId); } else { l.groupId = 'main'; }
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
                                });
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
                                            this.setStyle({
                                                feature: {
                                                    featureTypeName: l.url + '#' + l.defaultFeatureType,
                                                    layer: l
                                                },
                                                property: currentStyle[0].property,
                                                key: currentStyle[0].title,
                                                meta: currentStyle[0].meta
                                            }, false, null, currentStyle[0]);
                                    });
                                }
                                this.apply();
                            });

                            // init group
                            // add layer

                        }
                        if (msg.action === 'layer-remove') {
                            msg.data.forEach((l: ProjectLayer) => {
                                var g: ProjectGroup;
                                // find group
                                if (l.groupId) { g = this.findGroupById(l.groupId); } else { l.groupId = 'main'; }
                                if (g != null) {
                                    g.layers.forEach((layer: ProjectLayer) => {
                                        if (layer.id === l.id) {
                                            this.removeLayer(layer, true);
                                            //console.log('remove layer'+layer.id);
                                        }
                                    });

                                    if (g.layers.length === 0) {
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
                this.apply();
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

            // Add search providers
            this.project.searchProviders.forEach(searchProvider => {
                switch (searchProvider.name.toLowerCase()) {
                    case 'offline':
                        this.addActionService(new OfflineSearchActions(this.$http, searchProvider.url));
                        break;
                    case 'bag':
                        this.addActionService(new OnlineSearchActions(this.$http, searchProvider.url));
                        break;
                    case 'bing':
                        if (!searchProvider.key) break;
                        this.addActionService(new BingSearchAction(this.$http, searchProvider.key, searchProvider.url, searchProvider.data));
                        break;
                    case 'opencagedata':
                        if (!searchProvider.key) break;
                        let data = searchProvider.data;
                        if (!data) {
                            data = {
                                countrycode: 'nl',
                                //(min long, min lat, max long, max lat).
                                //NL: [[[3.357962,50.7503838],[3.357962,53.5551999],[7.2275102,53.5551999],[7.2275102,50.7503838],[3.357962,50.7503838]]]
                                bounds: '3.357962,50.7503838,7.2275102,53.5551999'
                            };
                        }
                        data.messageBus = this.$messageBusService;
                        this.addActionService(new OpenCageDataSearchAction(this.$http, searchProvider.key, searchProvider.url, data));
                        break;
                    case 'esribagsearch':
                        this.addActionService(new EsriBagSearchAction(this.$http, searchProvider.key, searchProvider.url, searchProvider.data));
                        break;
                }
            });
        }

        private apply() {
            if (this.$rootScope.$root.$$phase !== '$apply' && this.$rootScope.$root.$$phase !== '$digest') this.$rootScope.$apply();
        }

        /** toggle layer enabled/disabled */
        public toggleLayer(layer: ProjectLayer, loaded?: Function) {
            if (_.isUndefined(layer.enabled) || layer.enabled === false) {
                layer.enabled = true;
                this.addLayer(layer, () => { if (loaded) loaded(); });
            } else {
                layer.enabled = !layer.enabled;
                this.removeLayer(layer);
                if (loaded) loaded();
            }
        }

        public enableLayer(layer: ProjectLayer, loaded?: Function) {
            layer.enabled = true;
            this.addLayer(layer, () => { if (loaded) loaded(); });
        }

        public removeGroup(group: ProjectGroup) {
            if (group.layers) {
                group.layers.forEach((l: ProjectLayer) => {
                    if (l.enabled) this.removeLayer(l, true);
                });
            }
            group.ndx = null;
            this.project.groups = this.project.groups.filter((g: ProjectGroup) => g !== group);
            this.apply();
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
            this.activeMapRenderer.addGroup(group);

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
            layer.type = (layer.type) ? layer.type.toLowerCase() : 'geojson';
            layer._gui = {};
            layer.renderType = (layer.renderType) ? layer.renderType.toLowerCase() : layer.type;
            if (layer.type === 'dynamicgeojson') layer.isDynamic = true;
            if (layer.type === 'editablegeojson' || layer.isDynamic) layer.isEditable = true;
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
                this.$messageBusService.serverSubscribe(s, 'sensor', (sub: string, msg: any) => {
                    if (msg.action === 'sensor-update') {
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
                            this.$messageBusService.publish('sensor-' + ds.id + '/' + d.sensor, 'update', ss.activeValue);
                            this.apply();
                        }
                    }
                });
            }
        }

        checkSubscriptions() {
            this.project.datasources.forEach((ds: DataSource) => {
                if (ds.url && ds.type === 'dynamic') { this.checkDataSourceSubscriptions(ds); }
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
            if (kk.length === 2) {
                var dataSourceId = kk[0];
                var sensorId = kk[1];

                var dss = this.project.datasources.filter((ds: DataSource) => { return ds.id === dataSourceId; });
                if (dss.length === 0) {
                    var ds = new DataSource();
                    ds.id = dataSourceId;
                    ds.type = 'dynamic';
                    ds.sensors = {};
                    dss.push(ds);
                    this.project.datasources.push(ds);
                }
                ds = dss[0];
                if (ds.sensors.hasOwnProperty(sensorId)) {
                    callback(ds.sensors[sensorId]);
                } else {
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
            } else {
                features = (layer.group.filterResult) ? layer.group.filterResult : layer.data.features;
            }
            if (features) features.forEach((f: IFeature) => { if (f.layerId === layer.id) r.push(f.properties); });
            if (r.length === 0) r = layer.data.features;

            return r;
        }

        /**
         * Calculate min/max/count/mean/varience/sd for a specific property in a group
         */
        public calculatePropertyInfo(group: ProjectGroup, property: string): PropertyInfo {
            var r = <PropertyInfo>{
                count: 0,
                max: Number.MIN_VALUE,
                min: Number.MAX_VALUE
            };
            var sumOfElements = 0;
            var sumOfSquares = 0;

            group.layers.forEach((l: ProjectLayer) => {
                if (l.enabled) {
                    this.project.features.forEach((f: IFeature) => {
                        if (f.layerId === l.id && f.properties.hasOwnProperty(property)) {
                            var v = Number(f.properties[property]);
                            if (isNaN(v)) return;
                            r.count++;
                            sumOfElements += v;
                            sumOfSquares += v * v;
                            if (v > r.max) r.max = v;
                            if (v < r.min) r.min = v;
                        }
                    });
                }
            });
            if (!isNaN(sumOfElements) && r.count !== 0) {
                r.mean = sumOfElements / r.count;
                r.varience = sumOfSquares / r.count - r.mean * r.mean;
                r.sd = Math.sqrt(r.varience);
            }
            if (this.propertyTypeData.hasOwnProperty(property)) {
                var mid = this.propertyTypeData[property];
                r.userMin = mid.min;
                r.userMax = mid.max;
            }
            return r;
        }

        public updateFilterGroupCount(group: ProjectGroup) {
            if (group.filterResult != null)
                $('#filtergroupcount_' + group.id).text(group.filterResult.length + ' objecten geselecteerd');
        }

        private trackGeometry(f: IFeature, result: {}) {
            var key = '~geometry';
            var log = <Log>{
                ts: new Date().getTime(), prop: key, value: f.geometry
            };
            f.propertiesOld[key] = JSON.parse(JSON.stringify(f.geometry));
            if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
            if (!result.hasOwnProperty(key)) result[key] = [];
            f.logs[key].push(log);
            result[key].push(log);
            f._gui['lastUpdate'] = log.ts;
        }

        /**
         * Check for property changes for a specific key inside a feature, return a set of logs in result
         */
        private trackPropertyLog(f: IFeature, key: string, result: {}) {
            var log = <Log>{
                ts: new Date().getTime(), prop: key, value: f.properties[key]
            };
            f.propertiesOld[key] = JSON.parse(JSON.stringify(f.properties[key]));
            if (!f.logs.hasOwnProperty(key)) { f.logs[key] = []; }
            if (!result.hasOwnProperty(key)) { result[key] = []; }
            f.logs[key].push(log);
            result[key].push(log);
            f._gui['lastUpdate'] = log.ts;
        }

        /** Check for property changes inside a feature, return a set of logs in result */
        private trackFeature(feature: IFeature): {} {
            var result = {};
            for (var key in feature.properties) {
                if (!feature.propertiesOld.hasOwnProperty(key)) {
                    this.trackPropertyLog(feature, key, result);
                } else if (JSON.stringify(feature.propertiesOld[key]) !== JSON.stringify(feature.properties[key])) {
                    this.trackPropertyLog(feature, key, result);
                }
            }
            if (JSON.stringify(feature.propertiesOld['~geometry']) !== JSON.stringify(feature.geometry)) {
                this.trackGeometry(feature, result);
            }
            return result;
        }

        public isLocked(f: IFeature): boolean {
            return f._gui.hasOwnProperty('lock') || (f._gui.hasOwnProperty('editMode') && f._gui['editMode']);
        }

        /**
         * Set a lock property on the feature to signal others prevent feature updates
         */
        public lockFeature(f: IFeature): boolean {
            if (f._gui.hasOwnProperty('lock')) {
                return false;
            } else {
                f._gui['lock'] = true;
                return true;
            }
        }

        public unlockFeature(f: IFeature) {
            delete f._gui['lock'];
        }

        public stopEditingLayer(layer: csComp.Services.ProjectLayer) {
            this.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                delete g._gui['editing'];
                g.layers.forEach((l: csComp.Services.ProjectLayer) => {
                    delete layer._gui['editing'];
                    delete layer._gui['featureTypes'];
                    if (layer.data && layer.data.features && _.isArray(layer.data.features)) {
                        layer.data.features.forEach(f => {
                            delete f._gui['editMode'];
                            this.updateFeature(f);
                            this.saveFeature(f);
                        });
                    }
                });
            });
            this.editing = false;
        }


        /* save project back to api */
        public saveProject() {
            // if project is not dynamic, don't save it
            if (!this.project.isDynamic) return;
            console.log('saving project');
            setTimeout(() => {
                var data = this.project.serialize();
                var url = this.projectUrl.url;

                var pu = <ProjectUpdate>{ projectId: this.project.id, action: ProjectUpdateAction.updateProject, item: data };
                this.$messageBusService.serverSendMessageAction('project', pu);
                //.substr(0, this.$layerService.projectUrl.url.indexOf('/project.json'));
                // console.log('URL: ' + url);
                // $.ajax({
                //     url: url,
                //     type: 'PUT',
                //     data: data,
                //     contentType: 'application/json',
                //     complete: (d) => {
                //         if (d.error) {
                //             console.error('Error update project.json: ' + JSON.stringify(d));
                //         } else {
                //             console.log('Project.json updated succesfully!');
                //         }
                //     }
                // });
            }, 0);
        }

        private updateProjectReady(data) { }

        /** Create a new feature and save it to the server. */
        createFeature(feature: Feature, layer: ProjectLayer) {
            if (!layer || !layer.isDynamic || !layer.data || !layer.data.features) return;
            var found = _.find(layer.data.features, (f: Feature) => { return f.id === feature.id; });
            if (found) return;
            layer.data.features.push(feature);
            this.initFeature(feature, layer);
            this.activeMapRenderer.addFeature(feature);
            this.saveFeature(feature);
        }

        /**
         * Save feature back to the server. Does not create it, use createFeature for that.
         */
        public saveFeature(f: IFeature, logs: boolean = false) {
            f.properties['updated'] = new Date().getTime();
            // check if feature is in dynamic layer
            if (f.layer.isDynamic) {
                if (f.layer.useLog) {
                    var l = this.trackFeature(f);
                    var s = new LayerUpdate();
                    s.layerId = f.layerId;
                    s.action = LayerUpdateAction.updateLog;
                    s.item = { featureId: f.id, logs: l };
                    //this.$messageBusService.serverPublish('layer', s);
                    this.$messageBusService.serverSendMessageAction('layer', s);
                } else {
                    var s = new LayerUpdate();
                    s.layerId = f.layerId;
                    s.action = LayerUpdateAction.updateFeature;
                    s.item = Feature.serialize(f);
                    this.$messageBusService.serverSendMessageAction('layer', s);
                }
            }
        }

        /**
         * Update the filter status of a feature, i.e. the _gui.included property.
         * When a filter is applied, and the feature is not shown anymore, the feature._gui.included = false.
         * In all other cases, it is true. */
        private updateFilterStatusFeature(group: ProjectGroup) {
            //console.time('Filter');
            this.project.features.forEach(f => {
                if (f.layer.group === group) f._gui.included = false;
            });
            group.filterResult.forEach(f => {
                f._gui.included = true;
            });
            //console.timeEnd('Filter');
        }

        /***
         * Update map markers in cluster after changing filter
         */
        public updateMapFilter(group: ProjectGroup) {
            this.updateFilterStatusFeature(group);
            this.activeMapRenderer.updateMapFilter(group);
            // update timeline list
            this.$messageBusService.publish('timeline', 'updateFeatures', group.id);
        }

        public resetMapFilter(group: ProjectGroup) {
            this.updateFilterStatusFeature(group);
            $.each(group.markers, (key, marker) => {
                if (group.clustering) {
                    if (!group._cluster.hasLayer(marker)) group._cluster.addLayer(marker);
                } else {
                    if (!this.map.map.hasLayer(marker)) this.map.map.addLayer(marker);
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
        deleteFeature,
        updateLayer,
        deleteLayer,
        addUpdateFeatureBatch
    }

    /** Type of change in an ApiEvent */
    export enum ChangeType {
        Create, Update, Delete
    }

    /** When a key|layer|project is changed, the ChangeEvent is emitted with the following data. */
    export interface IChangeEvent {
        id: string;
        type: ChangeType;
        value?: Object;
    }

    /**
     * List of available action for sending/receiving project actions over socket.io channel
     */
    export enum ProjectUpdateAction {
        updateProject,
        deleteProject
    }

    /**
     * object for sending project messages over socket.io channel
     */
    export class ProjectUpdate {
        public projectId: string;
        public action: ProjectUpdateAction;
        public item: any;
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

    myModule.service('layerService', csComp.Services.LayerService);
}
