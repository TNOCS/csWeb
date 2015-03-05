module csComp.Services {
    'use strict';

    declare var jsonld;
    declare var omnivore;

    export interface ILayerService {
        title                : string;
        accentColor          : string;
        solution             : Solution;
        project              : Project;
        maxBounds            : IBoundingBox;
        findLayer(id         : string): ProjectLayer;
        selectFeature(feature: Services.IFeature);

        mb              : Services.MessageBusService;
        map             : Services.MapService;
        layerGroup      : L.LayerGroup<L.ILayer>;
        featureTypes    : { [key: string]: Services.IFeatureType; };
        propertyTypeData: { [key: string]: Services.IPropertyType; };
        timeline        : any;
    }

    export class LayerService implements ILayerService {
        maxBounds           : IBoundingBox;
        title               : string;
        accentColor         : string;
        mb                  : Services.MessageBusService;
        map                 : Services.MapService;
        featureTypes        : { [key: string]: IFeatureType; };
        propertyTypeData    : { [key: string]: IPropertyType; };
        project             : Project;
        projectUrl          : string; // URL of the current project
        solution            : Solution;
        dimension           : any;
        noFilters           : boolean;
        noStyles            : boolean;
        lastSelectedFeature : IFeature;
        selectedLayerId     : string;
        timeline            : any;
        loadedLayers  = new csComp.Helpers.Dictionary<L.ILayer>();
        layerGroup    = new L.LayerGroup<L.ILayer>();
        info          = new L.Control();
        currentLocale = 'en';

        static $inject = [
            '$location',
            '$translate',
            'messageBusService',
            'mapService',
            '$rootScope'
        ];

        constructor(
            private $location          : ng.ILocationService,
            private $translate         : ng.translate.ITranslateService,
            private $messageBusService : Services.MessageBusService,
            private $mapService        : Services.MapService,
            private $rootScope : any) {
            //$translate('FILTER_INFO').then((translation) => console.log(translation));
            // NOTE EV: private props in constructor automatically become fields, so mb and map are superfluous.
            this.mb               = $messageBusService;
            this.map              = $mapService;
            this.accentColor      = '';
            this.title            = '';
            //this.layerGroup       = new L.LayerGroup<L.ILayer>();
            this.featureTypes     = {};
            this.propertyTypeData = {};
            //this.map.map.addLayer(this.layerGroup);
            this.noStyles = true;

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

        public selectDashboard(dashboard: csComp.Services.Dashboard, container : string) {            
           this.project.activeDashboard = dashboard;
           this.$messageBusService.publish("dashboard-" + container, "activated", dashboard);
        }

        public updateSensorData() {
            if (this.project == null || this.project.timeLine == null) return;

            var date = this.project.timeLine.focus;
            var timepos = {};

            this.project.features.forEach((f: IFeature) => {
                var l = this.findLayer(f.layerId);

                if (l != null) {
                    if (f.sensors || f.coordinates)
                    {
                        var getIndex = (d: Number, timestamps: Number[]) => {
                            for (var i = 1; i < timestamps.length; i++) {
                                if (timestamps[i] > d) {
                                    return i;                                    
                                }
                            }
                            return timestamps.length-1;
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
                        if (f.coordinates && f.coordinates.length>pos && f.coordinates[pos] != f.geometry.coordinates) {
                            f.geometry.coordinates = f.coordinates[pos];
                            // get marker
                            if (l.group.markers.hasOwnProperty(f.id))
                            {
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
                        this.updateFeatureIcon(f, l);
                        if (f.isSelected) this.$messageBusService.publish("feature", "onFeatureUpdated", f);
                    }
                }
            });
                }
        }

        /**
         * Add a layer
         */
        addLayer(layer : ProjectLayer) {
            var disableLayers = [];
            switch (layer.type.toLowerCase()) {
            case 'wms':
                var wms        : any = L.tileLayer.wms(layer.url, {
                    layers     : layer.wmsLayers,
                    opacity    : layer.opacity/100,
                    format     : 'image/png',
                    transparent: true,
                    attribution: layer.description
                });
                layer.mapLayer = new L.LayerGroup<L.ILayer>();
                this.map.map.addLayer(layer.mapLayer);
                layer.mapLayer.addLayer(wms);
                wms.on('loading',  (event) => {
                    layer.isLoading = true;
                    this.$rootScope.$apply();
                    if (this.$rootScope.$$phase != '$apply' && this.$rootScope.$$phase != '$digest') { this.$rootScope.$apply(); }
                });
                wms.on('load', (event) => {
                    layer.isLoading = false;
                    if (!layer.id) layer.id = Helpers.getGuid();
                    this.loadedLayers.add(layer.id, layer);
                    if (this.$rootScope.$$phase != '$apply' && this.$rootScope.$$phase != '$digest') { this.$rootScope.$apply(); }
                });
                layer.isLoading = true;
                //this.$rootScope.$apply();
                break;
            case 'topojson':
            case 'geojson':
                async.series([
                    (callback) => {
                        // If oneLayerActive: close other group layer
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
                        // Open a style file
                        if (layer.styleurl) {
                            d3.json(layer.styleurl, (err, dta) => {

                                if (err)
                                    this.$messageBusService.notify('ERROR loading' + layer.title, err);
                                else {
                                    if (dta.featureTypes)
                                        for (var featureTypeName in dta.featureTypes) {
                                            if (!dta.featureTypes.hasOwnProperty(featureTypeName)) continue;
                                            var featureType: IFeatureType = dta.featureTypes[featureTypeName];
                                            featureTypeName = layer.id + '_' + featureTypeName;
                                            this.featureTypes[featureTypeName] = featureType;
                                        }
                                }
                                callback(null, null);
                            });
                        } else
                            callback(null, null);
                    },
                    (callback) => {
                        // Open a layer URL
                        layer.isLoading = true;
                        d3.json(layer.url, (error, data) => {
                            layer.isLoading = false;
                            if (error)
                                this.$messageBusService.notify('ERROR loading' + layer.title, error);
                            else {
                                if (!layer.id) layer.id = Helpers.getGuid();
                                this.loadedLayers.add(layer.id, layer);
                                if (layer.type.toLowerCase() === 'topojson')
                                    data = this.convertTopoToGeoJson(data);
                                if (data.events && this.timeline) {
                                    layer.events = data.events;
                                    var devents = [];
                                    layer.events.forEach((e: Event) => {
                                        if (!e.id) e.id = Helpers.getGuid();
                                        devents.push({
                                            'start': new Date(e.start),
                                            'content': e.title
                                        });
                                    });
                                    this.timeline.draw(devents);
                                }
                                for (var featureTypeName in data.featureTypes) {
                                    if (!data.featureTypes.hasOwnProperty(featureTypeName)) continue;
                                    var featureType: IFeatureType = data.featureTypes[featureTypeName];
                                    featureTypeName = layer.id + '_' + featureTypeName;
                                    this.featureTypes[featureTypeName] = featureType;
                                    //var pt = "." + featureTypeName;
                                    //var icon = featureType.style.iconUri;
                                    var t = '{".style' + featureTypeName + '":';
                                    if (featureType.style.iconUri != null) {
                                        t += ' { "background": "url(' + featureType.style.iconUri + ') no-repeat right center",';
                                    };
                                    t += ' "background-size": "100% 100%","border-style": "none"} }';
                                    var json = $.parseJSON(t);
                                    (<any>$).injectCSS(json);

                                    //console.log(JSON.stringify(poiType, null, 2));
                                }
                                if (data.timestamps) layer.timestamps = data.timestamps;
                                if (layer.group.clustering) {
                                    var markers = L.geoJson(data, {
                                        pointToLayer: (feature, latlng) => this.addFeature(feature, latlng, layer),
                                        onEachFeature: (feature: IFeature, lay) => {
                                            //We do not need to init the feature here: already done in style.
                                            //this.initFeature(feature, layer);
                                            layer.group.markers[feature.id] = lay;
                                            lay.on({
                                                mouseover: (a) => this.showFeatureTooltip(a, layer.group),
                                                mouseout: (s) => this.hideFeatureTooltip(s)
                                            });
                                        }
                                    });
                                    layer.group.cluster.addLayer(markers);
                                } else {
                                    layer.mapLayer = new L.LayerGroup<L.ILayer>();
                                    this.map.map.addLayer(layer.mapLayer);

                                    var v = L.geoJson(data, {
                                        onEachFeature : (feature: IFeature, lay) => {
                                            //We do not need to init the feature here: already done in style.
                                            //this.initFeature(feature, layer);
                                            layer.group.markers[feature.id] = lay;
                                            lay.on({
                                                mouseover : (a) => this.showFeatureTooltip(a, layer.group),
                                                mouseout  : (s) => this.hideFeatureTooltip(s),
                                                mousemove : (d) => this.updateFeatureTooltip(d),
                                                click     : ()  => this.selectFeature(feature)
                                            });
                                        },
                                        style: (f: IFeature, m) => {

                                            this.initFeature(f, layer);
                                            //this.updateSensorData();
                                            layer.group.markers[f.id] = m;
                                            return this.style(f, layer);
                                        },
                                        pointToLayer : (feature, latlng) => this.addFeature(feature, latlng, layer)
                                    });
                                    this.project.features.forEach((f: IFeature) => {
                                        if (f.layerId !== layer.id) return;
                                        var ft = this.getFeatureType(f);
                                        f.properties['Name'] = f.properties[ft.style.nameLabel];
                                    });
                                    layer.mapLayer.addLayer(v);
                                }
                          }
                            this.updateSensorData();
                            this.$messageBusService.publish('layer', 'activated', layer);

                            callback(null, null);
                            this.updateFilters();
                        });
                    },
                    // Callback
                    () => {
                        disableLayers.forEach((l) => {
                            this.removeLayer(l);
                            l.enabled = false;
                        });
                    }
                ]);
            }
        }

        /**
        * Convert topojson data to geojson data.
        */
        private convertTopoToGeoJson(data) {
            // Convert topojson to geojson format
            var topo = omnivore.topojson.parse(data);
            var newData: any = {};
            newData.featureTypes = data.featureTypes;
            newData.features = [];
            topo.eachLayer((l) => {
                newData.features.push(l.feature);
            });
            return newData;
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

        /***
         * Show tooltip with name, styles & filters.
         */
        showFeatureTooltip(e, group: ProjectGroup) {
            var layer = e.target;
            var feature = <Feature>layer.feature;
            // add title
            var title = layer.feature.properties.Name;
            var rowLength = (title) ? title.length : 1;
            var content = '<td colspan=\'3\'>' + title + '</td></tr>';
            // add filter values
            if (group.filters != null && group.filters.length > 0) {
                group.filters.forEach((f: GroupFilter) => {
                    if (!feature.properties.hasOwnProperty(f.property)) return;
                    var value = feature.properties[f.property];
                    if (value) {
                        var valueLength = value.toString().length;
                        if (f.meta != null) {
                            value = Helpers.convertPropertyInfo(f.meta, value);
                            if (f.meta.type !== 'bbcode') valueLength = value.toString().length;
                        }
                        rowLength = Math.max(rowLength, valueLength + f.title.length);
                        content += '<tr><td><div class=\'smallFilterIcon\'></td><td>' + f.title + '</td><td>' + value + '</td></tr>';
                    }
                });
            }

            // add style values, only in case they haven't been added already as filter
            if (group.styles != null && group.styles.length > 0) {
                group.styles.forEach((s: GroupStyle) => {
                    if (group.filters != null && group.filters.filter((f: GroupFilter) => { return f.property === s.property; }).length === 0 && feature.properties.hasOwnProperty(s.property)) {
                        var value = feature.properties[s.property];
                        var valueLength = value.toString().length;
                        if (s.meta != null) {
                            value = Helpers.convertPropertyInfo(s.meta, value);
                                if (s.meta.type !== 'bbcode') valueLength = value.toString().length;
                        }
                        rowLength = Math.max(rowLength, valueLength + s.title.length);
                            content += '<tr><td><div class=\'smallStyleIcon\'></td><td>' + s.title + '</td><td>' + value + '</td></tr>';
                    }
                });
            }
            var widthInPixels = Math.max(Math.min(rowLength * 7 + 15, 250), 130);
            content = '<table style=\'width:' + widthInPixels + 'px;\'>' + content + '</table>';

            this.popup = L.popup({
                offset      : new L.Point(-widthInPixels / 2 - 40, -5),
                closeOnClick: true,
                autoPan     : false,
                className   : 'featureTooltip'
            }).setLatLng(e.latlng).setContent(content).openOn(this.map.map);
        }

        hideFeatureTooltip(e) {
            if (this.popup && this.map.map) {
                (<any>this.map.map).closePopup(this.popup);
                //this.map.map.closePopup(this.popup);
                this.popup = null;
            }
        }
        private popup: L.Popup;

        updateFeatureTooltip(e) {
            if (this.popup!=null && e.latlng!=null) this.popup.setLatLng(e.latlng);
        }



        //Highlight polyline features on event
        highlightFeature(e) {
            var highlightStyle = {
                "weight": 7
            };
            var layer = e.target;

            layer.bindPopup(layer.feature.properties.Name)
                .openPopup();


            if (!L.Browser.ie) {
                layer.bringToFront();
            }
            // Change the style to the highlighted version
            layer.setStyle(highlightStyle);
            if (!L.Browser.ie) {
                layer.bringToFront();
            }
        }

        //Reset polyline style
        resetHighlight(e) {
            var defaultStyle = {
                "weight": 1
            };
            var layer = e.target;
            layer.setStyle(defaultStyle);
        }

        removeStyle(style: GroupStyle) {
            //console.log('update style ' + style.title);

            var g = style.group;
            g.styles = g.styles.filter((s: GroupStyle) => s.id !== style.id);

            this.updateGroupFeatures(g);
        }

        updateStyle(style: GroupStyle) {
            //console.log('update style ' + style.title);
            if (style == null) return;
            if (style.group != null) {
                style.info = this.calculatePropertyInfo(style.group, style.property);
                style.canSelectColor = style.visualAspect.toLowerCase().indexOf('color') > -1;
                this.updateGroupFeatures(style.group);
            }
        }

        updateFeature(feature: IFeature, group?: ProjectGroup) {
            var layer = this.findLayer(feature.layerId);
            if (layer == null) return;
            if (feature.geometry.type === 'Point') {
                
                this.updateFeatureIcon(feature, layer);
            } else {
                if (group == null) {
                    group = layer.group;
                }
                if (group == null) return;
                var m = group.markers[feature.id];
                this.updatePolygonStyle(m, feature);
            }
        }

        private updateGroupFeatures(group : ProjectGroup) {
            this.project.features.forEach((f: IFeature) => {
                if (group.markers.hasOwnProperty(f.id)) {
                    this.updateFeature(f, group);
                }
            });
        }

        private getDefaultMarkerStyle(feature: IFeature) { }

        private updatePolygonStyle(m: any, feature: IFeature) {
            var layer = this.findLayer(feature.layerId);
            var s = this.style(feature, layer);
            m.setStyle(s);
        }

        private getColor(v: number, gs: GroupStyle) {
            if (v > gs.info.sdMax) return gs.colors[gs.colors.length - 1];
            if (v < gs.info.sdMin) return gs.colors[0];
            var bezInterpolator = chroma.interpolate.bezier(gs.colors);
            var r = bezInterpolator((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin)).hex();
            return r;
        }

        /**
        * Extract a valid color string, without transparency.
        */
        private getColorString(color: string, defaultColor = '#f00') {
            if (!color) return defaultColor;
            if (color.length == 4 || color.length == 7) return color;
            if (color.length == 9) return '#' + color.substr(3, 6);
            return defaultColor;
        }

        style(feature: IFeature, layer: ProjectLayer) {
            var s = {
                fillColor   : 'red',
                weight      : 2,
                opacity     : 1,
                color       : 'black',
                fillOpacity : 0.7
            };

            var ft = this.getFeatureType(feature);
            if (ft.style) {
                if (ft.style.fillColor   != null) s['fillColor']   = this.getColorString(ft.style.fillColor);
                if (ft.style.strokeColor != null) s['strokeColor'] = this.getColorString(ft.style.strokeColor, '#000');
                if (ft.style.strokeWidth != null) s['weight']      = ft.style.strokeWidth;
            }

            //var layer = this.findLayer(feature.layerId);
            layer.group.styles.forEach((gs: GroupStyle) => {
                if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
                    var v = Number(feature.properties[gs.property]);
                    if (!isNaN(v)) {
                        switch (gs.visualAspect) {
                        case 'strokeColor':
                            s['color'] = this.getColor(v, gs);
                            break;
                        case 'fillColor':
                            s[gs.visualAspect] = this.getColor(v, gs);
                            break;
                        case 'strokeWidth':
                            s['weight'] = ((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin) * 10) + 1;
                            break;
                        }
                    }
                    //s.fillColor = this.getColor(feature.properties[layer.group.styleProperty], null);
                }
            });

            if (feature.isSelected) {
                s['weight'] = 7;
                s['color'] = 'blue';
            }
            return s;
        }

        /**
         * init feature (add to feature list, crossfilter)
         */
        initFeature(feature: IFeature, layer: ProjectLayer): IFeatureType {
            //if (!feature.isInitialized)
            feature.isInitialized = true;
            if (feature.id == null) feature.id = Helpers.getGuid();
            feature.layerId = layer.id;
            this.project.features.push(feature);
            layer.group.ndx.add([feature]);
            feature.fType = this.getFeatureType(feature);
            this.initFeatureType(feature.fType);
            // Do we have a name?
            if (!feature.properties.hasOwnProperty('Name'))
                Helpers.setFeatureName(feature);
            return feature.type;
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

            if (typeof pt.canEdit          == 'undefined'                      ) pt.canEdit          = false;
            if (typeof pt.visibleInCallOut == 'undefined'                      ) pt.visibleInCallOut = true;
            if (typeof pt.isSearchable     == 'undefined' && pt.type === 'text') pt.isSearchable     = true;
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

        //removeFeature(feature: IFeature, layer: ProjectLayer) {

        //}

        /**
         * create icon based of feature style
         */
        getPointIcon(feature: IFeature, layer: ProjectLayer): any {
            var icon: L.DivIcon;
            if (feature.htmlStyle != null) {
                icon = new L.DivIcon({
                    className: '',
                    iconSize: new L.Point(32, 32),
                    html: feature.htmlStyle
                });
            } else {
                var html = '<div ';
                var props = {};
                var ft = this.getFeatureType(feature);

                //if (feature.poiTypeName != null) html += "class='style" + feature.poiTypeName + "'";
                var iconUri = ft.style.iconUri;
                if (ft.style.fillColor == null && iconUri == null) ft.style.fillColor = 'lightgray';

                // TODO refactor to object
                props['background']    = ft.style.fillColor;
                props['width']         = '32px';
                props['height']        = '32px';
                props['border-radius'] = '20%';
                props['border-style']  = 'solid';
                props['border-color']  = 'black';
                props['border-width']  = '0';

                layer.group.styles.forEach((gs: GroupStyle) => {
                    if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
                        var v = feature.properties[gs.property];

                        switch (gs.visualAspect) {
                        case 'fillColor':
                            if (gs.meta.type === 'color') {
                                props['background-color'] = v;
                            } else {
                                var bezInterpolator = chroma.interpolate.bezier(gs.colors);
                                props['background-color'] = bezInterpolator((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin)).hex();
                            }

                            break;
                        }
                        //s.fillColor = this.getColor(feature.properties[layer.group.styleProperty], null);
                    }
                });
                if (feature.isSelected) {
                    props['border-width'] = '3px';
                }

                html += ' style=\'display: inline-block;vertical-align: middle;text-align: center;';
                for (var key in props) {
                    if (!props.hasOwnProperty(key)) continue;
                    html += key + ':' + props[key] + ';';
                }

                html += '\'>';
                if (iconUri != null) {
                    // Must the iconUri be formatted?
                    if (iconUri!=null && iconUri.indexOf('{') >= 0) iconUri = Helpers.convertStringFormat(feature, iconUri);

                    html += '<img src=' + iconUri + ' style=\'width:' + (ft.style.iconWidth - 2) + 'px;height:' + (ft.style.iconHeight - 2) + 'px\' />';
                }
                html += '</div>';

                icon = new L.DivIcon({
                    className: '',
                    iconSize: new L.Point(ft.style.iconWidth, ft.style.iconHeight),
                    html: html
                });
                //icon = new L.DivIcon({
                //    className: "style" + feature.poiTypeName,
                //    iconSize: new L.Point(feature.fType.style.iconWidth, feature.fType.style.iconHeight)
                //});
            }
            return icon;
        }

        /**
         * Update icon for features
         */
        updateFeatureIcon(feature: IFeature, layer: ProjectLayer) {
            var geomType = feature.geometry.type.toLowerCase();
            switch (geomType)
            {
                case "point":
                   var marker = <L.Marker>layer.group.markers[feature.id];
                   if (marker != null) marker.setIcon(this.getPointIcon(feature, layer));
                   break;
                case "polygon":
                case "multipolygon":
                    this.updateFeature(feature);
                    break;
            }
        }

        /**
         * add a feature
         */
        addFeature(feature: IFeature, latlng, layer: ProjectLayer) : any {
            this.initFeature(feature,layer);
            //var style = type.style;
            var marker;
            switch (feature.geometry.type) {
            case 'Point'          :
                var icon = this.getPointIcon(feature,layer);
                marker = new L.Marker(latlng, { icon: icon });
                marker.on('click', () => {
                    this.selectFeature(feature);
                });
                //feature.marker = m;
                break;
                default:
                    var polyoptions = {
                        fillColor: 'Green'
                    };
                    marker = L.multiPolygon(latlng, polyoptions);
                break;
            }
            layer.group.markers[feature.id] = marker;

            return marker;
        }

        selectFeature(feature: IFeature) {
            feature.isSelected = !feature.isSelected;

            this.updateFeature(feature);

            // deselect last feature and also update
            if (this.lastSelectedFeature != null && this.lastSelectedFeature !== feature) {
                this.lastSelectedFeature.isSelected = false;
                this.updateFeature(this.lastSelectedFeature);
            }
            this.lastSelectedFeature = feature;


            if (!feature.isSelected) {
                this.$messageBusService.publish('sidebar', 'hide');
                this.$messageBusService.publish('feature', 'onFeatureDeselect');
            } else {
                this.$messageBusService.publish('sidebar', 'show');
                this.$messageBusService.publish('feature', 'onFeatureSelect', feature);
            }
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
         * Find a layer with a specific id
         */
        findLayer(id: string): ProjectLayer {
            if (this.loadedLayers.containsKey(id)) return this.loadedLayers[id];
            return null;
            //var r: ProjectLayer;
            //this.project.groups.forEach(g => {
            //    g.layers.forEach(l => {
            //        if (l.id === id) r = l;
            //    });
            //});
            //return r;
        }

        setStyle(property: any, openStyleTab = true) {
            var f: IFeature = property.feature;
            if (f != null) {
                this.noStyles     = false;
                var layer         = this.findLayer(f.layerId);
                var gs            = new GroupStyle(this.$translate);
                gs.id             = Helpers.getGuid();
                gs.title          = property.key;
                gs.meta           = property.meta;
                gs.visualAspect   = 'fillColor';
                gs.canSelectColor = gs.visualAspect.toLowerCase().indexOf('color') > -1;

                gs.property = property.property;
                if (gs.info==null) gs.info = this.calculatePropertyInfo(layer.group, property.property);

                gs.enabled = true;
                gs.group = layer.group;
                gs.meta = property.meta;
                var ft = this.getFeatureType(f);

                if (ft.style && ft.style.fillColor) {
                    gs.colors = ['white', 'orange'];
                } else {
                    gs.colors = ['white', 'orange'];
                }
                this.saveStyle(layer.group, gs);
                if (f.geometry.type.toLowerCase() === 'point') {
                    this.project.features.forEach((fe: IFeature) => {
                        if (layer.group.markers.hasOwnProperty(fe.id)) {
                            this.updateFeatureIcon(fe, layer);
                        }
                    });
                } else {
                    this.updateStyle(gs);
                }

                if (openStyleTab)
                    (<any>$('#leftPanelTab a[href="#styles"]')).tab('show'); // Select tab by name
                return gs;
            }
            return null;
        }

        private saveStyle(group: ProjectGroup, style: GroupStyle) {
            // check if there are other styles that affect the same visual aspect, remove them
            var oldStyles = group.styles.filter((s: GroupStyle) => s.visualAspect === style.visualAspect);

            if (oldStyles.length > 0) {
                var pos = group.styles.indexOf(oldStyles[0]);
                group.styles.splice(pos,1);
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
        setFilter(filter: GroupFilter, group : csComp.Services.ProjectGroup) {
            
            group.filters.push(filter);
            this.updateFilters();
                (<any>$('#leftPanelTab a[href="#filters"]')).tab('show'); // Select tab by name
            
        }

       
         /**
         * enable a filter for a specific property
         */
        setPropertyFilter(property: FeatureProps.CallOutProperty) {
            var prop                                   = property.property;
            var f                                      = property.feature;
            if (f != null) {
                var layer                              = this.findLayer(f.layerId);
                if (layer != null) {
                    var filter                         = this.findFilter(layer.group, prop);
                    if (filter                         == null) {
                        var gf                         = new GroupFilter();
                        gf.property                    = prop;
                        gf.meta                        = property.meta;
                        gf.filterType                  = 'bar';
                        if (gf.meta != null) {
                            if (gf.meta.filterType != null) {
                                gf.filterType          = gf.meta.filterType;
                            } else {
                                switch (gf.meta.type) {
                                    case 'number':
                                    case 'options':
                                        gf.filterType  = 'bar';
                                        break;
                                    //case 'rank':
                                    //    gf.filterType  = 'bar';
                                    //    gf.value = property.value.split(',')[0];
                                    //    break;
                                    default:
                                        gf.filterType  = 'text';
                                        gf.stringValue = property.value;
                                        gf.value       = property.value;
                                        break;
                                }
                            }
                        }

                        gf.title  = property.key;
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
            var projectFeatureTypeName = feature.properties['FeatureTypeId'] || 'Default';
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
            var type : IFeatureType = {};
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

        private getGroupFeatures(g: ProjectGroup) : Array<IFeature> {

            // find active layers
            var ls = [];
            g.layers.forEach((l: ProjectLayer) => { if (l.enabled) ls.push(l.id); });

            // add active features
            var r = this.project.features.filter((k: IFeature) => ls.indexOf(k.layerId)>-1);
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
        removeLayer(layer: ProjectLayer) {
            var m: any;
            var g = layer.group;

            this.loadedLayers.remove(layer.id);

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
                this.map.map.removeLayer(layer.mapLayer);
            }

            this.project.features = this.project.features.filter((k: IFeature) => k.layerId !== layer.id);
            var layerName = layer.id + '_';
            var featureTypes = this.featureTypes;
            for (var poiTypeName in featureTypes) {
                if (!featureTypes.hasOwnProperty(poiTypeName)) continue;
                if (poiTypeName.lastIndexOf(layerName, 0) === 0) delete featureTypes[poiTypeName];
            }

            // check if there are no more active layers in group and remove filters/styles
            if (g.layers.filter((l: ProjectLayer) => { return (l.enabled); }).length === 0) {
                g.filters.forEach((f: GroupFilter) => { if (f.dimension != null) f.dimension.dispose(); });
                g.filters = [];
                g.styles = [];
            }

            this.rebuildFilters(g);
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

            $.getJSON(url, (solution : Solution) => {
                //var projects = data;
                if (solution.maxBounds) {
                    this.maxBounds = solution.maxBounds;
                    this.$mapService.map.setMaxBounds(new L.LatLngBounds(solution.maxBounds.southWest, solution.maxBounds.northEast));
                }
                if (solution.viewBounds)
                    this.$mapService.map.fitBounds(new L.LatLngBounds(solution.viewBounds.southWest, solution.viewBounds.northEast));

                //$scope.title = projects.title;
                //$scope.projects = [];

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
                    if (b.isDefault)
                        this.$mapService.changeBaseLayer(layer);
                });
                //$scope.projects = projects.projects;
                if (solution.projects.length > 0) {
                    var p = solution.projects.filter((aProject: SolutionProject) => { return aProject.title === initialProject; })[0];
                    if (p != null) {
                        this.openProject(p.url, layers);
                    } else {
                        this.openProject(solution.projects[0].url, layers);
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
        public openProject(url: string, layers?: string): void {
            this.projectUrl = url;
            //console.log('layers (openProject): ' + JSON.stringify(layers));
            var layerIds: Array<string> = [];
            if (layers) {
                layers.split(';').forEach((layerId) => { layerIds.push(layerId.toLowerCase()); });
            }
            //console.log('layerIds (openProject): ' + JSON.stringify(layerIds));
            this.clearLayers();
            this.featureTypes = {};

            $.getJSON(url,(data: Project) => {
                
                this.project = new Project().deserialize(data);

                if (!this.project.timeLine) {
                    this.project.timeLine = new DateRange();
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
                    d.widgets = [];
                    this.project.dashboards.push(d);
                }


                if (!this.project.dataSets)
                    this.project.dataSets = [];

                this.project.features = [];

                this.project.groups.forEach((group: ProjectGroup) => {
                    if (group.id == null) group.id = Helpers.getGuid();
                    group.ndx = crossfilter([]);
                    if (group.styles == null) group.styles = [];
                    if (group.filters == null) group.filters = [];
                    group.markers = {};
                    if (group.languages != null && this.currentLocale in group.languages) {
                        var locale = group.languages[this.currentLocale];
                        if (locale.title      ) group.title       = locale.title;
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
                    group.layers.forEach((layer: ProjectLayer) => {
                        if (layer.id == null) layer.id = Helpers.getGuid();
                        if (layer.reference == null) layer.reference = layer.id; //Helpers.getGuid();
                        if (layer.title == null) layer.title = layer.id;
                        if (layer.languages != null && this.currentLocale in layer.languages) {
                            var locale = layer.languages[this.currentLocale];
                            if (locale.title      ) layer.title       = locale.title;
                            if (locale.description) layer.description = locale.description;
                        }
                        layer.group = group;
                        if (layer.enabled || layerIds.indexOf(layer.reference.toLowerCase()) >= 0) {
                            layer.enabled = true;
                            this.addLayer(layer);
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

                this.$messageBusService.publish('project', 'loaded');
                this.$messageBusService.publish('dashboard-main', 'activated', this.project.dashboards[Object.keys(this.project.dashboards)[0]]);
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

        //private zoom(data: any) {
        //    //var a = data;
        //}

        /**
         * Calculate min/max/count for a specific property in a group
         */
        private calculatePropertyInfo(group: ProjectGroup, property: string) : PropertyInfo {
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
                if (group.filters != null && group.filters.length>0) {
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
            if (extent !=null && extent.length === 2) {
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
            
            $('#remove' + filter.id).on('click',() => {
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
                    return [0,0];
                    
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
}
