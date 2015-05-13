module csComp.Services {
    'use strict';

    declare var jsonld;
    declare var omnivore;

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

    export interface IMapRenderer {
        title: string;
        init(service: LayerService);
        enable();
        disable();
        addGroup(group: ProjectGroup);
        addLayer(layer: ProjectLayer);
        removeGroup(group: ProjectGroup);
        createFeature(feature: IFeature);
        removeFeature(feature: IFeature);
        updateFeature(feature: IFeature);
        addFeature(feature: IFeature);
    }

    export class VisualState {
        public leftPanelVisible: boolean = true;
        public rightPanelVisible: boolean = false;
        public dashboardVisible: boolean = true;
        public mapVisible: boolean = true;
        public timelineVisible: boolean = true;
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
        layerGroup: L.LayerGroup<L.ILayer>;
        featureTypes: { [key: string]: Services.IFeatureType; };
        propertyTypeData: { [key: string]: Services.IPropertyType; };
        timeline: any;
    }

    export class LayerService implements ILayerService {
        maxBounds:           IBoundingBox;
        title:               string;
        accentColor:         string;
        mb:                  Services.MessageBusService;
        map:                 Services.MapService;
        featureTypes:        { [key: string]: IFeatureType; };
        propertyTypeData:    { [key: string]: IPropertyType; };
        project:             Project;
        projectUrl:          SolutionProject; // URL of the current project
        solution:            Solution;
        dimension:           any;
        noFilters:           boolean;
        noStyles:            boolean;
        lastSelectedFeature: IFeature;
        selectedLayerId:     string;
        timeline:            any;
        currentLocale:       string;
        loadedLayers       = new csComp.Helpers.Dictionary<L.ILayer>();
        layerGroup         = new L.LayerGroup<L.ILayer>();
        info               = new L.Control();
        layerSources:        { [key: string]: ILayerSource };   // list of available layer sources
        mapRenderers:        { [key: string]: IMapRenderer };   // list of available map renderers
        activeMapRenderer:   IMapRenderer;                 // active map renderer
        public visual:       VisualState = new VisualState();

        static $inject = [
            '$location',
            '$translate',
            'messageBusService',
            'mapService',
            '$rootScope'

        ];

        constructor(
            private $location: ng.ILocationService,
            private $translate: ng.translate.ITranslateService,
            public $messageBusService: Services.MessageBusService,
            public $mapService: Services.MapService,
            public $rootScope: any,
            public dashboardService: Services.DashboardService) {
            //$translate('FILTER_INFO').then((translation) => console.log(translation));
            // NOTE EV: private props in constructor automatically become fields, so mb and map are superfluous.
            this.mb = $messageBusService;
            this.map = $mapService;

            this.accentColor = '';
            this.title = '';
            //this.layerGroup       = new L.LayerGroup<L.ILayer>();
            this.featureTypes = {};
            this.propertyTypeData = {};
            //this.map.map.addLayer(this.layerGroup);
            this.noStyles = true;
            this.currentLocale = "en";
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
        }

        /**
         * Initialize the available layer sources
         */
        private initLayerSources() {
            // init layer sources
            this.layerSources = {};

            // add a topo/geojson source
            var geojsonsource = new GeoJsonSource(this);

            this.layerSources["geojson"]        = geojsonsource;
            this.layerSources["topojson"]       = geojsonsource;
            this.layerSources["dynamicgeojson"] = new DynamicGeoJsonSource(this);

            // add wms source
            this.layerSources["wms"] = new WmsSource(this);

            //add tile layer
            this.layerSources["tilelayer"] = new TileLayerSource(this);

            //add heatmap layer
            this.layerSources["heatmap"] = new HeatmapSource(this);

            //add hierarchy layer
            this.layerSources["hierarchy"] = new HierarchySource(this);

            // check for every feature (de)select if layers should automatically be activated
            this.checkFeatureSubLayers();

        }

        private removeSubLayers(feature : IFeature)
        {
          if (!feature  || !feature.fType) return;
          var props = csComp.Helpers.getPropertyTypes(feature.fType, this.propertyTypeData);
          props.forEach((prop : IPropertyType)=>{
            if (prop.type === "layer" && feature.properties.hasOwnProperty(prop.label))
            {
              var l = feature.properties[prop.label];

              if (this.loadedLayers.containsKey(l))
              {
                var layer = this.loadedLayers[l];
                this.removeLayer(this.loadedLayers[l],true);
              }
            }
          });

        }

        /**
        check for every feature (de)select if layers should automatically be activated
        */
        private checkFeatureSubLayers()
        {
          this.$messageBusService.subscribe('feature', (action : string, feature : IFeature)=>
          {
            if (!feature.fType) return;
            var props = csComp.Helpers.getPropertyTypes(feature.fType, this.propertyTypeData);
            switch (action){
              case 'onFeatureDeselect':
                // check sub-layers

                break;
                case 'onFeatureSelect':
                  // check sub-layers
                  props.forEach((prop : IPropertyType)=>{
                    if (prop.type === "layer" && prop.activation==="automatic" && feature.properties.hasOwnProperty(prop.label))
                    {
                      this.removeSubLayers(feature.layer.lastSelectedFeature);

                      feature.layer.lastSelectedFeature = feature;

                      var l = feature.properties[prop.label];

                      var pl = new ProjectLayer();
                      if(typeof l === 'string') {
                        pl.url = l;
                      }
                      else
                      {
                        pl = l;
                      }

                      if (!pl.id) pl.id = l;
                      if (!pl.group) {
                        pl.group = feature.layer.group;
                      }
                      else
                      {
                        if(typeof pl.group === 'string') {
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
                    var requiredLayers: ProjectLayer[] = this.layerSources[layerSource].getRequiredLayers(layer);
                    requiredLayers.forEach((l) => {
                        this.addLayer(l);
                    });
                }
            }
        }

        public addLayer(layer: ProjectLayer) {
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
                    // load required feature layers, if applicable
                    this.loadRequiredLayers(layer);

                    // find layer source, and activate layer
                    var layerSource = layer.type.toLowerCase();
                    if (this.layerSources.hasOwnProperty(layerSource)) {
                        layer.layerSource = this.layerSources[layerSource];
                        // load layer from source
                        layer.layerSource.addLayer(layer, (l) => {
                            l.enabled = true;
                            this.loadedLayers[layer.id] = l;
                            this.updateSensorData();
                            this.updateFilters();
                            this.activeMapRenderer.addLayer(layer);
                            if (layer.defaultLegendProperty) this.checkLayerLegend(layer, layer.defaultLegendProperty);
                            this.checkLayerTimer(layer);
                            this.$messageBusService.publish('layer', 'activated', layer);
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

        checkLayerLegend(layer: ProjectLayer, property: string) {
            var ptd = this.project.propertyTypeData[property];
            if (ptd && ptd.legend) {
                var gs: GroupStyle;
                if (layer.group.styles && (layer.group.styles.length > 0)) {
                    gs = layer.group.styles[0];  // TODO: when do we need a different one than the first?
                } else {
                    gs = new GroupStyle(this.$translate);
                    layer.group.styles.push(gs);
                }
                gs.title                  = ptd.title;
                gs.id                     = Helpers.getGuid();
                gs.activeLegend           = ptd.legend;
                gs.group                  = layer.group;
                gs.property               = ptd.label;
                gs.legends[ptd.title]     = ptd.legend;
                gs.colorScales[ptd.title] = ['purple', 'purple'];
                gs.enabled                = true;
                gs.visualAspect           = (ptd.legend.visualAspect)
                    ? ptd.legend.visualAspect
                    : 'strokeColor';  // TODO: let this be read from the propertyTypeData

                this.saveStyle(layer.group, gs);
                this.project.features.forEach((fe: IFeature) => {
                    if (fe.layer.group == layer.group) {
                        this.calculateFeatureStyle(fe);
                        this.activeMapRenderer.updateFeature(fe);
                    }
                });

                this.noStyles = false;   // TODO: when does this need to be reset?
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

        public selectRenderer(renderer: string) {
            if (this.activeMapRenderer && this.activeMapRenderer.title == renderer) return;

            if (this.activeMapRenderer) this.activeMapRenderer.disable();

            if (this.mapRenderers.hasOwnProperty(renderer)) {
                this.activeMapRenderer = this.mapRenderers[renderer];
                this.activeMapRenderer.enable();
            }
        }

        public getPropertyTypes(fType : IFeatureType) : IPropertyType[]
        {
          var result : IPropertyType[] = [];
          if (fType)
          {
            fType.propertyTypeKeys.split(';').forEach((key)=>
            {
              if (this.propertyTypeData.hasOwnProperty(key))
              {
                var prop = this.propertyTypeData[key];
                result.push(prop);
              }
            });
          }
          return result;

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
                this.$messageBusService.publish('feature', 'onFeatureDeselect',this.lastSelectedFeature);
            }
            this.lastSelectedFeature = feature;


            if (!feature.isSelected) {
                this.$messageBusService.publish('sidebar', 'hide');
                this.$messageBusService.publish('feature', 'onFeatureDeselect',feature);
            } else {

                this.$messageBusService.publish('sidebar', 'show');
                this.$messageBusService.publish('feature', 'onFeatureSelect', feature);
            }
        }

        public updateSensorData() {
            if (this.project == null || this.project.timeLine == null || this.project.features == null) return;

            var date = this.project.timeLine.focus;
            var timepos = {};

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
                // Do we have a name?
                if (!feature.properties.hasOwnProperty('Name'))
                    Helpers.setFeatureName(feature);

                this.calculateFeatureStyle(feature);
            }
            return feature.type;
        }

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
            s.strokeWidth   = 1;
            s.strokeColor   = 'black';
            s.fillOpacity   = 0.75;
            s.rotate        = 0;
            //s.strokeColor = 'black';
            //s.iconHeight = 32;
            //s.iconWidth = 32;
            //s.cornerRadius = 20;

            var ft = this.getFeatureType(feature);
            if (ft.style) {
                if (ft.style.fillColor !== null) s.fillColor = csComp.Helpers.getColorString(ft.style.fillColor);
                if (ft.style.stroke !== null) s.stroke = ft.style.stroke;
                if (ft.style.strokeColor !== null) s.strokeColor = csComp.Helpers.getColorString(ft.style.strokeColor, '#fff');
                if (ft.style.strokeWidth !== null) s.strokeWidth = ft.style.strokeWidth;
                if (ft.style.iconWidth !== null) s.iconWidth = ft.style.iconWidth;
                if (ft.style.iconHeight !== null) s.iconHeight = ft.style.iconHeight;
                if (ft.style.innerTextProperty !== null) s.innerTextProperty = ft.style.innerTextProperty;
                if (ft.style.innerTextSize !== null) s.innerTextSize = ft.style.innerTextSize;
                if (ft.style.cornerRadius !== null) s.cornerRadius = ft.style.cornerRadius;
                if (ft.style.rotateProperty && feature.properties.hasOwnProperty(ft.style.rotateProperty)) {
                    s.rotate = Number(feature.properties[ft.style.rotateProperty]);
                }
            }

            // feature.layer.group.styles.forEach((gs: GroupStyle) => {
            //     if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
            //         if (gs.activeLegend) {
            //             if ((gs.activeLegend.legendKind == 'discrete') ||
            //                 (gs.activeLegend.legendKind == 'interpolated')) {
            //
            //                 var v = Number(feature.properties[gs.property]);
            //                 if (!isNaN(v)) {
            //                     switch (gs.visualAspect) {
            //                         case 'strokeColor':
            //                             s.strokeColor = csComp.Helpers.getColor(v, gs);
            //                             break;
            //                         case 'fillColor':
            //                             s.fillColor = csComp.Helpers.getColor(v, gs);
            //                             break;
            //                         case 'strokeWidth':
            //                             s.strokeWidth = ((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin) * 10) + 1;
            //                             break;
            //                     }
            //                 }
            //             } // discrete or interpolated
            //             if (gs.activeLegend.legendKind == 'discretestrings') {
            //                 var ss = feature.properties[gs.property];
            //                 switch (gs.visualAspect) {
            //                     case 'strokeColor':
            //                         s.strokeColor = csComp.Helpers.getColorFromStringValue(ss, gs);
            //                         break;
            //                     case 'fillColor':
            //                         s.fillColor = csComp.Helpers.getColorFromStringValue(ss, gs);
            //                         break;
            //                 }
            //             } // discrete strings
            //         } // activelegend
            //     }
            // });

            //var layer = this.findLayer(feature.layerId);
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
                s.strokeWidth = 5;
                s.strokeColor = 'black';
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
            if (this.project.groups[i].id === id) return this.project.groups[i]; }
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
        public setStyle(property: any, openStyleTab = true, customStyleInfo?: PropertyInfo) {
            // parameter property is of the type ICallOutProperty. explicit declaration gives the red squigglies
            var f: IFeature = property.feature;
            if (f != null) {
                var ft = this.getFeatureType(f);
                this.noStyles = false;
                // for debugging: what do these properties contain?
                var layer = f.layer;
                var lg = layer.group;

                var gs = new GroupStyle(this.$translate);
                // add the legends and colorscales from any existing group style
                // if (lg.styles && (lg.styles.length > 0)) {
                //     var gs0 = lg.styles[0];
                //     gs0.title = property.key;
                //     var legend: Legend;
                //     var legendKey: string;
                //     for (legendKey in gs0.legends) {
                //         legend = gs0.legends[legendKey];
                //         gs.legends[legendKey] = legend;
                //         if ((legend.legendEntries) && (legend.legendEntries.length > 0)) {
                //             var e1: LegendEntry = legend.legendEntries[0];
                //             var e2: LegendEntry = legend.legendEntries[legend.legendEntries.length - 1];
                //             gs.colorScales[legendKey] = [e1.color, e2.color]
                //         } else {
                //             gs.colorScales[legendKey] = ['red', 'red'];
                //         }
                //     }
                // }

                gs.id = Helpers.getGuid();
                gs.title = property.key;
                gs.meta = property.meta;
                gs.visualAspect = (ft.style && ft.style.drawingMode && ft.style.drawingMode.toLowerCase() == 'polyline') ? 'strokeColor' : 'fillColor';
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
                if (openStyleTab)
                    (<any>$('#leftPanelTab a[href="#styles"]')).tab('show'); // Select tab by name
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
            this.updateFilters();
            (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
        }

        /**
         * enable a filter for a specific property
         */
        setFilter(filter: GroupFilter, group: csComp.Services.ProjectGroup) {
            group.filters.push(filter);
            this.updateFilters();
            (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
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
                        gf.meta = property.meta;
                        gf.filterType = 'bar';
                        if (gf.meta != null) {
                            if (gf.meta.filterType != null) {
                                gf.filterType = gf.meta.filterType;
                            } else {
                                switch (gf.meta.type) {
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
                this.updateFilters();
                (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
            }
        }

        /**
         * Return the feature style for a specific feature.
         * First, look for a layer specific feature type, otherwise, look for a project-specific feature type.
         * In case both fail, create a default feature type at the layer level.
         */
        getFeatureType(feature: IFeature): IFeatureType {
            var projectFeatureTypeName = feature.properties['FeatureTypeId'] || feature.layer.defaultFeatureType || 'Default';
            var featureTypeName = feature.layerId + '_' + projectFeatureTypeName;
            if (!(this.featureTypes.hasOwnProperty(featureTypeName))) {
                if (this.featureTypes.hasOwnProperty(projectFeatureTypeName))
                    featureTypeName = projectFeatureTypeName;
                else
                    this.featureTypes[featureTypeName] = this.createDefaultType(feature);
            }
            feature.featureTypeName = featureTypeName;
            return this.featureTypes[featureTypeName];
        }

        /**
         * In case we are dealing with a regular JSON file without type information, create a default type.
         */
        private createDefaultType(feature: IFeature): IFeatureType {
            var type: IFeatureType = {};
            type.style = { nameLabel: 'Name' };
            type.propertyTypeData = [];

            for (var key in feature.properties) {
                if (!feature.properties.hasOwnProperty(key)) continue;
                var propertyType: IPropertyType = [];
                propertyType.label = key;
                propertyType.title = key.replace('_', ' ');
                propertyType.isSearchable = true;
                propertyType.visibleInCallOut = true;
                propertyType.canEdit = false;
                var value = feature.properties[key]; // TODO Why does TS think we are returning an IStringToString object?
                if (StringExt.isNumber(value))
                    propertyType.type = 'number';
                else if (StringExt.isBoolean(value))
                    propertyType.type = 'boolean';
                else if (StringExt.isBbcode(value))
                    propertyType.type = 'bbcode';
                else
                    propertyType.type = 'text';

                type.propertyTypeData.push(propertyType);
            }
            return type;
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

            // redraw charts
            this.updateFilters();
        }

        /**
         * deactivate layer
         */
        removeLayer(layer: ProjectLayer, removeFromGroup : boolean = false) {
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
                this.$messageBusService.publish('sidebar', 'hide');
                this.$messageBusService.publish('feature', 'onFeatureDeselect');
            }

            //m = layer.group.vectors;
            if (g.clustering) {
                m = g.cluster;
                this.project.features.forEach((feature: IFeature) => {
                    if (feature.layerId === layer.id) {
                        try {
                            m.removeLayer(layer.group.markers[feature.id]);
                            delete layer.group.markers[feature.id];
                        } catch (error) {

                        }
                    }
                });
            } else {
                if (layer.mapLayer) this.map.map.removeLayer(layer.mapLayer);
            }

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
            if (removeFromGroup) layer.group.layers = layer.group.layers.filter((pl:ProjectLayer)=>pl != layer);
            this.$messageBusService.publish('layer', 'deactivate', layer);
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
                    this.$mapService.map.fitBounds(new L.LatLngBounds(solution.viewBounds.southWest, solution.viewBounds.northEast));

                solution.baselayers.forEach(b => {
                    var options: L.TileLayerOptions = {};
                    options['subtitle'] = b.subtitle;
                    options['preview'] = b.preview;
                    if (b.subdomains != null) options['subdomains'] = b.subdomains;
                    if (b.maxZoom != null) options.maxZoom = b.maxZoom;
                    if (b.minZoom != null) options.minZoom = b.minZoom;
                    if (b.attribution != null) options.attribution = b.attribution;
                    if (b.id != null) options['id'] = b.id;
                    var layer = L.tileLayer(b.url, options);
                    this.$mapService.baseLayers[b.title] = layer;
                    if (b.isDefault) this.$mapService.changeBaseLayer(layer);
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
        public openProject(project : csComp.Services.SolutionProject, layers?: string ): void {
            this.projectUrl = project;
            //console.log('layers (openProject): ' + JSON.stringify(layers));
            var layerIds: Array<string> = [];
            if (layers) {
                layers.split(';').forEach((layerId) => { layerIds.push(layerId.toLowerCase()); });
            }
            //console.log('layerIds (openProject): ' + JSON.stringify(layerIds));
            this.clearLayers();
            this.featureTypes = {};

            $.getJSON(project.url, (data: Project) => {
                this.project = new Project().deserialize(data);

                if (!this.project.timeLine) {
                    this.project.timeLine = new DateRange();
                }
                else {
                    // Set range
                    this.$messageBusService.publish('timeline', 'updateTimerange', this.project.timeLine);
                }

                if (this.project.viewBounds) {
                    this.$mapService.map.fitBounds(new L.LatLngBounds(this.project.viewBounds.southWest, this.project.viewBounds.northEast));
                }
                var featureTypes = this.project.featureTypes;
                if (featureTypes) {
                    for (var typeName in featureTypes) {
                        if (!featureTypes.hasOwnProperty(typeName)) continue;
                        var featureType: IFeatureType = featureTypes[typeName];
                        this.initFeatureType(featureType);
                        this.featureTypes[typeName] = featureType;
                    }
                }
                if (this.project.propertyTypeData) {
                    for (var key in this.project.propertyTypeData) {
                        var propertyType: IPropertyType = this.project.propertyTypeData[key];
                        this.initPropertyType(propertyType);
                        if (!propertyType.label) propertyType.label = key;
                        this.propertyTypeData[key] = propertyType;
                    }
                }

                if (!this.project.dashboards) {
                    this.project.dashboards = [];
                    var d = new Services.Dashboard();
                    d.id = "map";
                    d.name = "Home";
                    d.showMap = true;
                    d.showLeftmenu = true;
                    d.widgets = [];
                    this.project.dashboards.push(d);
                }else
                {

                  this.project.dashboards.forEach((d)=>
                  {
                    if (!d.id) d.id = Helpers.getGuid();
                    if (d.widgets && d.widgets.length>0)
                      d.widgets.forEach((w)=>
                      {
                        if (!w.id) w.id = Helpers.getGuid();
                        if (!w.enabled) w.enabled = true;
                      });
                  });
                }


                if (this.project.datasources) {
                    this.project.datasources.forEach((ds: DataSource) => {
                        if (ds.url) {
                            DataSource.LoadData(ds, () => {
                                console.log('datasource loaded');
                                if (ds.type === "dynamic") this.checkDataSourceSubscriptions(ds);

                                for (var s in ds.sensors) {
                                    var ss : SensorSet = ds.sensors[s];
                                    /// check if there is an propertytype available for this sensor
                                    if (ss.propertyTypeKey != null && this.project.propertyTypeData.hasOwnProperty(ss.propertyTypeKey)) {
                                      ss.propertyType = this.project.propertyTypeData[ss.propertyTypeKey];
                                    }
                                    else // else create a new one and store in project
                                    {
                                      var id = "sensor-" + Helpers.getGuid();
                                      var pt : IPropertyType = {};
                                      pt.title = s;
                                      ss.propertyTypeKey = id;
                                      this.project.propertyTypeData[id] = pt;
                                      ss.propertyType = pt;
                                    }

                                    ss.activeValue = ss.values[ss.values.length - 1];
                                }
                            });
                        }
                    });
                }

                if (!this.project.dataSets)
                    this.project.dataSets = [];

                this.project.features = [];

                if (this.project.groups && this.project.groups.length > 0) {
                    this.project.groups.forEach((group: ProjectGroup) => {
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
                            if (layer.id == null) layer.id = Helpers.getGuid();
                            layer.type = layer.type.toLowerCase();
                            if (layer.reference == null) layer.reference = layer.id; //Helpers.getGuid();
                            if (layer.title == null) layer.title = layer.id;
                            if (layer.languages != null && this.currentLocale in layer.languages) {
                                var locale = layer.languages[this.currentLocale];
                                if (locale.title) layer.title = locale.title;
                                if (locale.description) layer.description = locale.description;
                            }

                            layer.group = group;
                            if (layer.enabled || layerIds.indexOf(layer.reference.toLowerCase()) >= 0) {
                                layer.enabled = true;
                                this.activeMapRenderer.addLayer(layer);
                            }
                        });

                        group.styles.forEach((style: GroupStyle) => {
                            if (style.id != null) style.id = Helpers.getGuid();
                        });

                        group.filters.forEach((filter: GroupFilter) => {
                            if (filter.id != null) filter.id = Helpers.getGuid();
                        });

                        if (data.startposition)
                            this.$mapService.zoomToLocation(new L.LatLng(data.startposition.latitude, data.startposition.longitude));

                        this.updateFilters();
                    });
                }
                if (this.project.connected) {
                    // check connection
                    this.$messageBusService.initConnection("", "", () => {
                    });
                }

                // check if project is dynamic
                if (project.dynamic)
                {
                  this.$messageBusService.serverSubscribe(this.project.id, "project", (sub: string, msg: any) => {
                      if (msg.action === "layer-update") {
                        alert('new layer');
                      }
                    });
                }

                this.$messageBusService.publish('project', 'loaded', this.project);
                if (this.project.dashboards && this.project.dashboards.length > 0)
                    this.$messageBusService.publish('dashboard-main', 'activated', this.project.dashboards[Object.keys(this.project.dashboards)[0]]);
            });
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

        private updateFilters() {
            var fmain = $('#filterChart');
            fmain.empty();
            this.noFilters = true;

            this.project.groups.forEach((group: ProjectGroup) => {
                if (group.filters != null && group.filters.length > 0) {
                    $('<div style=\'float:left;margin-left: -10px; margin-top: 5px\' data-toggle=\'collapse\' data-target=\'#filters_' + group.id + '\'><i class=\'fa fa-chevron-down togglebutton toggle-arrow-down\'></i><i class=\'fa fa-chevron-up togglebutton toggle-arrow-up\'></i></div><div class=\'group-title\' >' + group.title + '</div><div id=\'filtergroupcount_' + group.id + '\'  class=\'filter-group-count\' /><div class=\'collapse in\' id=\'filters_' + group.id + '\'></div>').appendTo('#filterChart');
                    group.filters.forEach((filter: GroupFilter) => {
                        if (filter.dimension != null) filter.dimension.dispose();
                        this.noFilters = false;
                        switch (filter.filterType) {
                            case 'text':
                                this.addTextFilter(group, filter);
                                break;
                            case 'bar':
                                this.addBarFilter(group, filter);
                                break;
                            case 'scatter':
                                this.addScatterFilter(group, filter);
                                break;
                        }
                    });
                }
                this.updateFilterGroupCount(group);
            });
            dc.renderAll();
        }

        private updateTextFilter(group: ProjectGroup, dcDim: any, value: string) {

            if (value == null || value === '') {
                dcDim.filterAll();
            } else {
                dcDim.filterFunction((d: string) => {
                    if (d != null) return (d.toLowerCase().indexOf(value.toLowerCase()) > -1);
                    return false;
                });
            }

            group.filterResult = dcDim.top(Infinity);
            this.updateMapFilter(group);
            dc.renderAll();
        }

        private updateFilterGroupCount(group: ProjectGroup) {
            if (group.filterResult != null)
                $('#filtergroupcount_' + group.id).text(group.filterResult.length + ' objecten geselecteerd');
        }

        /***
         * Add text filter to list of filters
         */
        private addTextFilter(group: ProjectGroup, filter: GroupFilter) {
            filter.id = Helpers.getGuid();
            //var divid = 'filter_' + filter.id;
            var dcDim = group.ndx.dimension(d => {
                if (d.properties.hasOwnProperty(filter.property)) {
                    return d.properties[filter.property];
                } else return null;
            });
            filter.dimension = dcDim;
            dcDim.filterFunction((d: string) => {
                if (d != null) return (d.toLowerCase().indexOf(filter.stringValue.toLowerCase()) > -1);
                return false;
            });

            this.updateTextFilter(group, dcDim, filter.stringValue);
            var fid = 'filtertext' + filter.id;
            $('<h4>' + filter.title + '</h4><input type=\'text\' value=\'' + filter.stringValue + '\' class=\'filter-text\' id=\'' + fid + '\'/><a class=\'btn\' value=' + filter.value + ' id=\'remove' + filter.id + '\'><i class=\'fa fa-times\'></i></a>').appendTo('#filters_' + group.id);
            //$("<h4>" + filter.title + "</h4><input type='text' class='filter-text' id='" + fid + "'/></div><a class='btn btn-filter-delete' value=" + filter.value + " id='remove" + filter.id + "'><i class='fa fa-remove'></i></a>").appendTo("#filterChart");
            $('#' + fid).keyup(() => {
                filter.stringValue = $('#' + fid).val();
                this.updateTextFilter(group, dcDim, filter.stringValue);
                this.updateFilterGroupCount(group);
                //alert('text change');
            });
            $('#remove' + filter.id).on('click', () => {
                var pos = group.filters.indexOf(filter);

                filter.dimension.filterAll();
                filter.dimension.dispose();
                filter.dimension = null;
                if (pos !== -1) group.filters = group.filters.slice(pos - 1, pos);
                dc.filterAll();

                this.updateFilters();
                this.resetMapFilter(group);
            });
        }

        private updateChartRange(chart: dc.IBarchart, filter: GroupFilter) {
            var filterFrom = $('#fsfrom_' + filter.id);
            var filterTo = $('#fsto_' + filter.id);
            var extent = (<any>chart).brush().extent();
            if (extent != null && extent.length === 2) {
                if (extent[0] !== extent[1]) {
                    console.log(extent);
                    //if (extent.length == 2) {
                    filterFrom.val(extent[0]);
                    filterTo.val(extent[1]);
                }
            } else {
                filterFrom.val('0');
                filterTo.val('1');
            }
        }


        private addScatterFilter(group: ProjectGroup, filter: GroupFilter) {
            filter.id = Helpers.getGuid();

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
                this.updateFilters();

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
         * Add bar chart filter for filter number values
         */
        private addBarFilter(group: ProjectGroup, filter: GroupFilter) {
            filter.id = Helpers.getGuid();
            var info = this.calculatePropertyInfo(group, filter.property);

            var divid = 'filter_' + filter.id;
            //$("<h4>" + filter.title + "</h4><div id='" + divid + "'></div><a class='btn' id='remove" + filter.id + "'>remove</a>").appendTo("#filters_" + group.id);
            //$("<h4>" + filter.title + "</h4><div id='" + divid + "'></div><div style='display:none' id='fdrange_" + filter.id + "'>from <input type='text' style='width:75px' id='fsfrom_" + filter.id + "'> to <input type='text' style='width:75px' id='fsto_" + filter.id + "'></div><a class='btn' id='remove" + filter.id + "'>remove</a>").appendTo("#filterChart");

            $('<div style=\'position:relative\'><h4>' + filter.title + '</h4><span class=\'dropdown\' dropdown><a href class=\'fa fa-circle-o makeNarrow dropdown-toggle\' dropdown-toggle > </a><ul class=\'dropdown-menu\' ><li><a>scatter plot</a></li><li><a>add to dashboard< /a></li ></ul></span><a class=\'btn fa fa-cog\' style=\'position:absolute;top:-5px;right:0\' id=\'remove' + filter.id + '\'></a><div id=\'' + divid + '\' style=\'float:none\'></div><div style=\'display:none\' id=\'fdrange_' + filter.id + '\'>from <span id=\'fsfrom_' + filter.id + '\'/> to <span id=\'fsto_' + filter.id + '\'/></div></div>').appendTo('#filterChart');
            var filterFrom = $('#fsfrom_' + filter.id);
            var filterTo = $('#fsto_' + filter.id);
            var filterRange = $('#fdrange_' + filter.id);
            $('#remove' + filter.id).on('click', () => {
                var pos = group.filters.indexOf(filter);
                if (pos !== -1) group.filters.splice(pos, 1);
                filter.dimension.dispose();
                this.updateFilters();

                this.resetMapFilter(group);
            });

            var dcChart = <any>dc.barChart('#' + divid);

            var nBins = 20;

            var binWidth = (info.sdMax - info.sdMin) / nBins;

            var dcDim = group.ndx.dimension(d => {
                if (!d.properties.hasOwnProperty(filter.property)) return null;
                else {
                    if (d.properties[filter.property] != null) {
                        var a = parseInt(d.properties[filter.property]);
                        if (a >= info.sdMin && a <= info.sdMax) {
                            return Math.floor(a / binWidth) * binWidth;
                        } else {
                            return null;
                        }
                    }
                    return null;
                    //return a;
                }
            });
            filter.dimension = dcDim;
            var dcGroup = dcDim.group();

            //var scale =
            dcChart.width(275)
                .height(90)
                .dimension(dcDim)
                .group(dcGroup)
                .transitionDuration(100)
                .centerBar(true)
                .gap(5) //d3.scale.quantize().domain([0, 10]).range(d3.range(1, 4));
                .elasticY(true)
                .x(d3.scale.linear().domain([info.sdMin, info.sdMax]).range([-1, nBins + 1]))
                .filterPrinter(filters => {
                var s = '';
                if (filters.length > 0) {
                    var localFilter = filters[0];
                    filterFrom.text(localFilter[0].toFixed(2));
                    filterTo.text(localFilter[1].toFixed(2));
                    s += localFilter[0];
                }

                return s;
            })
                .on('filtered', (e) => {
                var fil = e.hasFilter();
                if (fil) {
                    filterRange.show();
                } else {
                    filterRange.hide();
                }
                dc.events.trigger(() => {
                    group.filterResult = dcDim.top(Infinity);
                    this.updateFilterGroupCount(group);
                }, 0);
                dc.events.trigger(() => {
                    this.updateMapFilter(group);
                }, 100);
            });

            dcChart.xUnits(() => { return 13; });

            filterFrom.on('change', () => {
                if ($.isNumeric(filterFrom.val())) {
                    var min = parseInt(filterFrom.val());
                    var filters = dcChart.filters();
                    if (filters.length > 0) {
                        filters[0][0] = min;
                        dcChart.filter(filters[0]);
                        dcChart.render();
                        //dcDim.filter(filters[0]);
                        dc.redrawAll();
                        //dc.renderAll();
                    }
                }
            });
            filterTo.on('change', () => {
                if ($.isNumeric(filterTo.val())) {
                    var max = parseInt(filterTo.val());
                    var filters = dcChart.filters();
                    if (filters.length > 0) {
                        filters[0][1] = max;
                        dcChart.filter(filters[0]);
                        dcDim.filter(filters[0]);
                        dc.renderAll();
                    }
                    //dc.redrawAll();
                }
                //dcDim.filter([min, min + 100]);
            });

            //if (filter.meta != null && filter.meta.minValue != null) {
            //    dcChart.x(d3.scale.linear().domain([filter.meta.minValue, filter.meta.maxValue]));
            //} else {
            //    var propInfo = this.calculatePropertyInfo(group, filter.property);
            //    var dif = (propInfo.max - propInfo.min) / 100;
            //    dcChart.x(d3.scale.linear().domain([propInfo.min - dif, propInfo.max + dif]));
            //}

            dcChart.yAxis().ticks(5);
            dcChart.xAxis().ticks(5);
            this.updateChartRange(dcChart, filter);
            //.x(d3.scale.quantile().domain(dcGroup.all().map(function (d) {
            //return d.key;
            //   }))
            //.range([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
        }

        /***
         * Update map markers in cluster after changing filter
         */
        private updateMapFilter(group: ProjectGroup) {
            $.each(group.markers, (key, marker) => {
                var included = group.filterResult.filter((f: IFeature) => f.id === key).length > 0;
                if (group.clustering) {
                    var incluster = group.cluster.hasLayer(marker);
                    if (!included && incluster) group.cluster.removeLayer(marker);
                    if (included && !incluster) group.cluster.addLayer(marker);
                } else {
                    var onmap = group.vectors.hasLayer(marker);
                    if (!included && onmap) group.vectors.removeLayer(marker);
                    if (included && !onmap) group.vectors.addLayer(marker);
                }
            });
        }

        private resetMapFilter(group: ProjectGroup) {
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
