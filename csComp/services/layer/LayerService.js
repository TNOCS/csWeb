var csComp;
(function (csComp) {
    var Services;
    (function (Services) {
        'use strict';
        var LayerService = (function () {
            function LayerService($location, $translate, $messageBusService, $mapService) {
                var _this = this;
                this.$location = $location;
                this.$translate = $translate;
                this.$messageBusService = $messageBusService;
                this.$mapService = $mapService;
                this.layerGroup = new L.LayerGroup();
                this.info = new L.Control();
                this.mb = $messageBusService;
                this.map = $mapService;
                this.accentColor = '';
                this.title = '';
                this.layerGroup = new L.LayerGroup();
                this.featureTypes = {};
                this.propertyTypeData = {};
                this.map.map.addLayer(this.layerGroup);
                this.noStyles = true;
                this.$messageBusService.subscribe('timeline', function (trigger) {
                    switch (trigger) {
                        case 'focusChange':
                            _this.updateSensorData();
                            break;
                    }
                });
            }
            LayerService.prototype.updateSensorData = function () {
                var _this = this;
                if (this.project == null || this.project.timeLine == null)
                    return;
                var date = this.project.timeLine.focus;
                var timepos = {};
                this.project.features.forEach(function (f) {
                    var l = _this.findLayer(f.layerId);
                    if (l != null) {
                        if (!timepos.hasOwnProperty(f.layerId)) {
                            for (var i = 1; i < l.timestamps.length; i++) {
                                if (l.timestamps[i] > date) {
                                    timepos[f.layerId] = i;
                                    break;
                                }
                            }
                        }
                        if (f.sensors != null) {
                            for (var sensorTitle in f.sensors) {
                                if (!f.sensors.hasOwnProperty(sensorTitle))
                                    continue;
                                var sensor = f.sensors[sensorTitle];
                                var value = sensor[timepos[f.layerId]];
                                f.properties[sensorTitle] = value;
                            }
                            _this.updateFeatureIcon(f, l);
                        }
                    }
                });
                this.$messageBusService.publish('feature', 'onFeatureUpdated');
            };
            LayerService.prototype.addLayer = function (layer) {
                var _this = this;
                var disableLayers = [];
                switch (layer.type.toLowerCase()) {
                    case 'wms':
                        var wms = L.tileLayer.wms(layer.url, {
                            layers: layer.wmsLayers,
                            opacity: layer.opacity / 100,
                            format: 'image/png',
                            transparent: true,
                            attribution: layer.description
                        });
                        layer.mapLayer = new L.LayerGroup();
                        this.map.map.addLayer(layer.mapLayer);
                        layer.mapLayer.addLayer(wms);
                        break;
                    case 'topojson':
                    case 'geojson':
                        async.series([
                            function (callback) {
                                if (layer.group.oneLayerActive) {
                                    layer.group.layers.forEach(function (l) {
                                        if (l !== layer && l.enabled) {
                                            disableLayers.push(l);
                                        }
                                    });
                                }
                                callback(null, null);
                            },
                            function (callback) {
                                if (layer.styleurl) {
                                    d3.json(layer.styleurl, function (err, dta) {
                                        if (err)
                                            _this.$messageBusService.notify('ERROR loading' + layer.title, err);
                                        else {
                                            if (dta.featureTypes)
                                                for (var featureTypeName in dta.featureTypes) {
                                                    if (!dta.featureTypes.hasOwnProperty(featureTypeName))
                                                        continue;
                                                    var featureType = dta.featureTypes[featureTypeName];
                                                    featureTypeName = layer.id + '_' + featureTypeName;
                                                    _this.featureTypes[featureTypeName] = featureType;
                                                }
                                        }
                                        callback(null, null);
                                    });
                                }
                                else
                                    callback(null, null);
                            },
                            function (callback) {
                                d3.json(layer.url, function (error, data) {
                                    if (error)
                                        _this.$messageBusService.notify('ERROR loading' + layer.title, error);
                                    else {
                                        if (layer.type.toLowerCase() === 'topojson')
                                            data = _this.convertTopoToGeoJson(data);
                                        if (data.events && _this.timeline) {
                                            layer.events = data.events;
                                            var devents = [];
                                            layer.events.forEach(function (e) {
                                                if (!e.id)
                                                    e.id = Helpers.getGuid();
                                                devents.push({
                                                    'start': new Date(e.start),
                                                    'content': e.title
                                                });
                                            });
                                            _this.timeline.draw(devents);
                                        }
                                        for (var featureTypeName in data.featureTypes) {
                                            if (!data.featureTypes.hasOwnProperty(featureTypeName))
                                                continue;
                                            var featureType = data.featureTypes[featureTypeName];
                                            featureTypeName = layer.id + '_' + featureTypeName;
                                            _this.featureTypes[featureTypeName] = featureType;
                                            var t = '{".style' + featureTypeName + '":';
                                            if (featureType.style.iconUri != null) {
                                                t += ' { "background": "url(' + featureType.style.iconUri + ') no-repeat right center",';
                                            }
                                            ;
                                            t += ' "background-size": "100% 100%","border-style": "none"} }';
                                            var json = $.parseJSON(t);
                                            $.injectCSS(json);
                                        }
                                        if (data.timestamps)
                                            layer.timestamps = data.timestamps;
                                        if (layer.group.clustering) {
                                            var markers = L.geoJson(data, {
                                                pointToLayer: function (feature, latlng) { return _this.addFeature(feature, latlng, layer); },
                                                onEachFeature: function (feature, lay) {
                                                    layer.group.markers[feature.id] = lay;
                                                    lay.on({
                                                        mouseover: function (a) { return _this.showFeatureTooltip(a, layer.group); },
                                                        mouseout: function (s) { return _this.hideFeatureTooltip(s); }
                                                    });
                                                }
                                            });
                                            layer.group.cluster.addLayer(markers);
                                        }
                                        else {
                                            layer.mapLayer = new L.LayerGroup();
                                            _this.map.map.addLayer(layer.mapLayer);
                                            var v = L.geoJson(data, {
                                                onEachFeature: function (feature, lay) {
                                                    layer.group.markers[feature.id] = lay;
                                                    lay.on({
                                                        mouseover: function (a) { return _this.showFeatureTooltip(a, layer.group); },
                                                        mouseout: function (s) { return _this.hideFeatureTooltip(s); },
                                                        mousemove: function (d) { return _this.updateFeatureTooltip(d); },
                                                        click: function () {
                                                            _this.selectFeature(feature);
                                                        }
                                                    });
                                                },
                                                style: function (f, m) {
                                                    _this.initFeature(f, layer);
                                                    layer.group.markers[f.id] = m;
                                                    return _this.style(f, layer);
                                                },
                                                pointToLayer: function (feature, latlng) { return _this.addFeature(feature, latlng, layer); }
                                            });
                                            _this.project.features.forEach(function (f) {
                                                if (f.layerId !== layer.id)
                                                    return;
                                                var ft = _this.getFeatureType(f);
                                                f.properties['Name'] = f.properties[ft.style.nameLabel];
                                            });
                                            layer.mapLayer.addLayer(v);
                                        }
                                    }
                                    _this.$messageBusService.publish('layer', 'activated', layer);
                                    callback(null, null);
                                    _this.updateFilters();
                                });
                            },
                            function () {
                                disableLayers.forEach(function (l) {
                                    _this.removeLayer(l);
                                    l.enabled = false;
                                });
                            }
                        ]);
                }
            };
            LayerService.prototype.convertTopoToGeoJson = function (data) {
                var topo = omnivore.topojson.parse(data);
                var newData = {};
                newData.featureTypes = data.featureTypes;
                newData.features = [];
                topo.eachLayer(function (l) {
                    newData.features.push(l.feature);
                });
                return newData;
            };
            LayerService.prototype.filterProperties = function (group) {
                var result = [];
                if (group.filters != null && group.filters.length > 0) {
                    group.filters.forEach(function (f) {
                        result.push(f.property);
                    });
                }
                ;
                return result;
            };
            LayerService.prototype.showFeatureTooltip = function (e, group) {
                var layer = e.target;
                var feature = layer.feature;
                var title = layer.feature.properties.Name;
                var rowLength = title.length;
                var content = '<td colspan=\'3\'>' + title + '</td></tr>';
                if (group.filters != null && group.filters.length > 0) {
                    group.filters.forEach(function (f) {
                        if (!feature.properties.hasOwnProperty(f.property))
                            return;
                        var value = feature.properties[f.property];
                        var valueLength = value.toString().length;
                        if (f.meta != null) {
                            value = Helpers.convertPropertyInfo(f.meta, value);
                            if (f.meta.type !== 'bbcode')
                                valueLength = value.toString().length;
                        }
                        rowLength = Math.max(rowLength, valueLength + f.title.length);
                        content += '<tr><td><div class=\'smallFilterIcon\'></td><td>' + f.title + '</td><td>' + value + '</td></tr>';
                    });
                }
                if (group.styles != null && group.styles.length > 0) {
                    group.styles.forEach(function (s) {
                        if (group.filters != null && group.filters.filter(function (f) {
                            return f.property === s.property;
                        }).length === 0 && feature.properties.hasOwnProperty(s.property)) {
                            var value = feature.properties[s.property];
                            var valueLength = value.toString().length;
                            if (s.meta != null) {
                                value = Helpers.convertPropertyInfo(s.meta, value);
                                if (s.meta.type !== 'bbcode')
                                    valueLength = value.toString().length;
                            }
                            rowLength = Math.max(rowLength, valueLength + s.title.length);
                            content += '<tr><td><div class=\'smallStyleIcon\'></td><td>' + s.title + '</td><td>' + value + '</td></tr>';
                        }
                    });
                }
                var widthInPixels = Math.max(Math.min(rowLength * 7 + 15, 250), 130);
                content = '<table style=\'width:' + widthInPixels + 'px;\'>' + content + '</table>';
                this.popup = L.popup({
                    offset: new L.Point(-widthInPixels / 2 - 40, -5),
                    closeOnClick: true,
                    autoPan: false,
                    className: 'featureTooltip'
                }).setLatLng(e.latlng).setContent(content).openOn(this.map.map);
            };
            LayerService.prototype.hideFeatureTooltip = function (e) {
                if (this.popup && this.map.map) {
                    this.map.map.closePopup(this.popup);
                    this.popup = null;
                }
            };
            LayerService.prototype.updateFeatureTooltip = function (e) {
                if (this.popup != null && e.latlng != null)
                    this.popup.setLatLng(e.latlng);
            };
            LayerService.prototype.highlightFeature = function (e) {
                var highlightStyle = {
                    "weight": 7
                };
                var layer = e.target;
                layer.bindPopup(layer.feature.properties.Name).openPopup();
                if (!L.Browser.ie) {
                    layer.bringToFront();
                }
                layer.setStyle(highlightStyle);
                if (!L.Browser.ie) {
                    layer.bringToFront();
                }
            };
            LayerService.prototype.resetHighlight = function (e) {
                var defaultStyle = {
                    "weight": 1
                };
                var layer = e.target;
                layer.setStyle(defaultStyle);
            };
            LayerService.prototype.removeStyle = function (style) {
                var g = style.group;
                g.styles = g.styles.filter(function (s) { return s.id !== style.id; });
                this.updateGroupFeatures(g);
            };
            LayerService.prototype.updateStyle = function (style) {
                if (style == null)
                    return;
                if (style.group != null) {
                    style.info = this.calculatePropertyInfo(style.group, style.property);
                    style.canSelectColor = style.visualAspect.toLowerCase().indexOf('color') > -1;
                    this.updateGroupFeatures(style.group);
                }
            };
            LayerService.prototype.updateFeature = function (feature, group) {
                if (feature.geometry.type === 'Point') {
                    var layer = this.findLayer(feature.layerId);
                    if (layer != null)
                        this.updateFeatureIcon(feature, layer);
                }
                else {
                    if (group == null) {
                        var l = this.findLayer(feature.layerId);
                        group = l.group;
                    }
                    if (group == null)
                        return;
                    var m = group.markers[feature.id];
                    this.updatePolygonStyle(m, feature);
                }
            };
            LayerService.prototype.updateGroupFeatures = function (group) {
                var _this = this;
                this.project.features.forEach(function (f) {
                    if (group.markers.hasOwnProperty(f.id)) {
                        _this.updateFeature(f, group);
                    }
                });
            };
            LayerService.prototype.getDefaultMarkerStyle = function (feature) {
            };
            LayerService.prototype.updatePolygonStyle = function (m, feature) {
                var layer = this.findLayer(feature.layerId);
                var s = this.style(feature, layer);
                m.setStyle(s);
            };
            LayerService.prototype.getColor = function (v, gs) {
                if (v > gs.info.sdMax)
                    return gs.colors[gs.colors.length - 1];
                if (v < gs.info.sdMin)
                    return gs.colors[0];
                var bezInterpolator = chroma.interpolate.bezier(gs.colors);
                var r = bezInterpolator((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin)).hex();
                return r;
            };
            LayerService.prototype.getColorString = function (color, defaultColor) {
                if (defaultColor === void 0) { defaultColor = '#f00'; }
                if (!color)
                    return defaultColor;
                if (color.length == 4 || color.length == 7)
                    return color;
                if (color.length == 9)
                    return '#' + color.substr(3, 6);
                return defaultColor;
            };
            LayerService.prototype.style = function (feature, layer) {
                var _this = this;
                var s = {
                    fillColor: 'red',
                    weight: 2,
                    opacity: 1,
                    color: 'black',
                    fillOpacity: 0.7
                };
                var ft = this.getFeatureType(feature);
                if (ft.style) {
                    if (ft.style.fillColor != null)
                        s['fillColor'] = this.getColorString(ft.style.fillColor);
                    if (ft.style.strokeColor != null)
                        s['strokeColor'] = this.getColorString(ft.style.strokeColor, '#000');
                    if (ft.style.strokeWidth != null)
                        s['weight'] = ft.style.strokeWidth;
                }
                layer.group.styles.forEach(function (gs) {
                    if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
                        var v = Number(feature.properties[gs.property]);
                        switch (gs.visualAspect) {
                            case 'strokeColor':
                                s['color'] = _this.getColor(v, gs);
                                break;
                            case 'fillColor':
                                s[gs.visualAspect] = _this.getColor(v, gs);
                                break;
                            case 'strokeWidth':
                                s['weight'] = ((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin) * 10) + 1;
                                break;
                        }
                    }
                });
                if (feature.isSelected) {
                    s['weight'] = 7;
                    s['color'] = 'blue';
                }
                return s;
            };
            LayerService.prototype.initFeature = function (feature, layer) {
                feature.isInitialized = true;
                if (feature.id == null)
                    feature.id = Helpers.getGuid();
                feature.layerId = layer.id;
                this.project.features.push(feature);
                layer.group.ndx.add([feature]);
                feature.fType = this.getFeatureType(feature);
                if (!feature.properties.hasOwnProperty('Name'))
                    Helpers.setFeatureName(feature);
                return feature.type;
            };
            LayerService.prototype.removeFeature = function (feature, layer) {
            };
            LayerService.prototype.getPointIcon = function (feature, layer) {
                var icon;
                if (feature.htmlStyle != null) {
                    icon = new L.DivIcon({
                        className: '',
                        iconSize: new L.Point(32, 32),
                        html: feature.htmlStyle
                    });
                }
                else {
                    var html = '<div ';
                    var props = {};
                    var ft = this.getFeatureType(feature);
                    var iconUri = ft.style.iconUri;
                    if (ft.style.fillColor == null && iconUri == null)
                        ft.style.fillColor = 'lightgray';
                    props['background'] = ft.style.fillColor;
                    props['width'] = '32px';
                    props['height'] = '32px';
                    props['border-radius'] = '20%';
                    props['border-style'] = 'solid';
                    props['border-color'] = 'black';
                    props['border-width'] = '0';
                    layer.group.styles.forEach(function (gs) {
                        if (gs.enabled && feature.properties.hasOwnProperty(gs.property)) {
                            var v = feature.properties[gs.property];
                            switch (gs.visualAspect) {
                                case 'fillColor':
                                    if (gs.meta.type === 'color') {
                                        props['background-color'] = v;
                                    }
                                    else {
                                        var bezInterpolator = chroma.interpolate.bezier(gs.colors);
                                        props['background-color'] = bezInterpolator((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin)).hex();
                                    }
                                    break;
                            }
                        }
                    });
                    if (feature.isSelected) {
                        props['border-width'] = '3px';
                    }
                    html += ' style=\'display: inline-block;vertical-align: middle;text-align: center;';
                    for (var key in props) {
                        if (!props.hasOwnProperty(key))
                            continue;
                        html += key + ':' + props[key] + ';';
                    }
                    html += '\'>';
                    if (iconUri != null) {
                        if (iconUri.indexOf('{') >= 0)
                            iconUri = Helpers.convertStringFormat(feature, iconUri);
                        html += '<img src=' + iconUri + ' style=\'width:' + (ft.style.iconWidth - 2) + 'px;height:' + (ft.style.iconHeight - 2) + 'px\' />';
                    }
                    html += '</div>';
                    icon = new L.DivIcon({
                        className: '',
                        iconSize: new L.Point(ft.style.iconWidth, ft.style.iconHeight),
                        html: html
                    });
                }
                return icon;
            };
            LayerService.prototype.updateFeatureIcon = function (feature, layer) {
                var marker = layer.group.markers[feature.id];
                if (marker != null)
                    marker.setIcon(this.getPointIcon(feature, layer));
            };
            LayerService.prototype.addFeature = function (feature, latlng, layer) {
                var _this = this;
                this.initFeature(feature, layer);
                var marker;
                switch (feature.geometry.type) {
                    case 'Point':
                        var icon = this.getPointIcon(feature, layer);
                        marker = new L.Marker(latlng, { icon: icon });
                        marker.on('click', function () {
                            _this.selectFeature(feature);
                        });
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
            };
            LayerService.prototype.selectFeature = function (feature) {
                feature.isSelected = !feature.isSelected;
                this.updateFeature(feature);
                if (this.lastSelectedFeature != null && this.lastSelectedFeature !== feature) {
                    this.lastSelectedFeature.isSelected = false;
                    this.updateFeature(this.lastSelectedFeature);
                }
                this.lastSelectedFeature = feature;
                if (!feature.isSelected) {
                    this.$messageBusService.publish('sidebar', 'hide');
                    this.$messageBusService.publish('feature', 'onFeatureDeselect');
                }
                else {
                    this.$messageBusService.publish('sidebar', 'show');
                    this.$messageBusService.publish('feature', 'onFeatureSelect', feature);
                }
            };
            LayerService.prototype.findFilter = function (group, property) {
                if (group.filters == null)
                    group.filters = [];
                var r = group.filters.filter(function (f) { return f.property === property; });
                if (r.length > 0)
                    return r[0];
                return null;
            };
            LayerService.prototype.findLayer = function (id) {
                var r;
                this.project.groups.forEach(function (g) {
                    g.layers.forEach(function (l) {
                        if (l.id === id)
                            r = l;
                    });
                });
                return r;
            };
            LayerService.prototype.setStyle = function (property, openStyleTab) {
                var _this = this;
                if (openStyleTab === void 0) { openStyleTab = true; }
                var f = property.feature;
                if (f != null) {
                    this.noStyles = false;
                    var layer = this.findLayer(f.layerId);
                    var gs = new GroupStyle(this.$translate);
                    gs.id = Helpers.getGuid();
                    gs.title = property.key;
                    gs.meta = property.meta;
                    gs.visualAspect = 'fillColor';
                    gs.canSelectColor = gs.visualAspect.toLowerCase().indexOf('color') > -1;
                    gs.property = property.property;
                    if (gs.info == null)
                        gs.info = this.calculatePropertyInfo(layer.group, property.property);
                    gs.enabled = true;
                    gs.group = layer.group;
                    gs.meta = property.meta;
                    var ft = this.getFeatureType(f);
                    if (ft.style && ft.style.fillColor) {
                        gs.colors = ['white', 'orange'];
                    }
                    else {
                        gs.colors = ['white', 'orange'];
                    }
                    this.saveStyle(layer.group, gs);
                    if (f.geometry.type.toLowerCase() === 'point') {
                        this.project.features.forEach(function (fe) {
                            if (layer.group.markers.hasOwnProperty(fe.id)) {
                                _this.updateFeatureIcon(fe, layer);
                            }
                        });
                    }
                    else {
                        this.updateStyle(gs);
                    }
                    if (openStyleTab)
                        $('#leftPanelTab a[href="#styles"]').tab('show');
                    return gs;
                }
                return null;
            };
            LayerService.prototype.saveStyle = function (group, style) {
                var oldStyles = group.styles.filter(function (s) { return s.visualAspect === style.visualAspect; });
                if (oldStyles.length > 0) {
                    var pos = group.styles.indexOf(oldStyles[0]);
                    group.styles.splice(pos, 1);
                }
                group.styles.push(style);
            };
            LayerService.prototype.addFilter = function (group, prop) {
                var filter = this.findFilter(group, prop);
                if (filter == null) {
                    var gf = new GroupFilter();
                    gf.property = prop;
                    gf.title = prop;
                    gf.rangex = [0, 1];
                    group.filters.push(gf);
                }
                else {
                    var pos = group.filters.indexOf(filter);
                    if (pos !== -1)
                        group.filters.slice(pos, 1);
                }
                this.updateFilters();
                $('#leftPanelTab a[href="#filters"]').tab('show');
            };
            LayerService.prototype.setFilter = function (property) {
                var prop = property.property;
                var f = property.feature;
                if (f != null) {
                    var layer = this.findLayer(f.layerId);
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
                                }
                                else {
                                    switch (gf.meta.type) {
                                        case 'number':
                                        case 'options':
                                            gf.filterType = 'bar';
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
                            if (gf.filterType === 'text') {
                                var old = layer.group.filters.filter(function (flt) { return flt.filterType === 'text'; });
                                old.forEach(function (groupFilter) {
                                    groupFilter.dimension.filterAll();
                                    groupFilter.dimension.dispose();
                                });
                                layer.group.filters = layer.group.filters.filter(function (groupFilter) { return groupFilter.filterType !== 'text'; });
                            }
                            layer.group.filters.push(gf);
                        }
                        else {
                            var pos = layer.group.filters.indexOf(filter);
                            if (pos !== -1)
                                layer.group.filters.slice(pos, 1);
                        }
                    }
                    this.updateFilters();
                    $('#leftPanelTab a[href="#filters"]').tab('show');
                }
            };
            LayerService.prototype.getFeatureType = function (feature) {
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
            };
            LayerService.prototype.createDefaultType = function (feature) {
                var type = {};
                type.style = { nameLabel: 'Name' };
                type.propertyTypeData = [];
                for (var key in feature.properties) {
                    if (!feature.properties.hasOwnProperty(key))
                        continue;
                    var propertyType = [];
                    propertyType.label = key;
                    propertyType.title = key.replace('_', ' ');
                    propertyType.isSearchable = true;
                    propertyType.visibleInCallOut = true;
                    propertyType.canEdit = false;
                    var value = feature.properties[key];
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
            };
            LayerService.prototype.resetFilters = function () {
                dc.filterAll();
                dc.redrawAll();
            };
            LayerService.prototype.getGroupFeatures = function (g) {
                var ls = [];
                g.layers.forEach(function (l) {
                    if (l.enabled)
                        ls.push(l.id);
                });
                var r = this.project.features.filter(function (k) { return ls.indexOf(k.layerId) > -1; });
                return r;
            };
            LayerService.prototype.rebuildFilters = function (g) {
                g.ndx = crossfilter([]);
                var features = this.getGroupFeatures(g);
                g.ndx.add(features);
                this.updateFilters();
            };
            LayerService.prototype.removeLayer = function (layer) {
                var m;
                var g = layer.group;
                if (this.lastSelectedFeature != null && this.lastSelectedFeature.layerId === layer.id) {
                    this.lastSelectedFeature = null;
                    this.$messageBusService.publish('sidebar', 'hide');
                    this.$messageBusService.publish('feature', 'onFeatureDeselect');
                }
                if (g.clustering) {
                    m = g.cluster;
                    this.project.features.forEach(function (feature) {
                        if (feature.layerId === layer.id) {
                            try {
                                m.removeLayer(layer.group.markers[feature.id]);
                                delete layer.group.markers[feature.id];
                            }
                            catch (error) {
                            }
                        }
                    });
                }
                else {
                    this.map.map.removeLayer(layer.mapLayer);
                }
                this.project.features = this.project.features.filter(function (k) { return k.layerId !== layer.id; });
                var layerName = layer.id + '_';
                var featureTypes = this.featureTypes;
                for (var poiTypeName in featureTypes) {
                    if (!featureTypes.hasOwnProperty(poiTypeName))
                        continue;
                    if (poiTypeName.lastIndexOf(layerName, 0) === 0)
                        delete featureTypes[poiTypeName];
                }
                if (g.layers.filter(function (l) {
                    return (l.enabled);
                }).length === 0) {
                    g.filters.forEach(function (f) {
                        if (f.dimension != null)
                            f.dimension.dispose();
                    });
                    g.filters = [];
                    g.styles = [];
                }
                this.rebuildFilters(g);
                this.$messageBusService.publish('layer', 'deactivate', layer);
            };
            LayerService.prototype.openSolution = function (url, layers, initialProject) {
                var _this = this;
                $.getJSON(url, function (solution) {
                    if (solution.maxBounds) {
                        _this.maxBounds = solution.maxBounds;
                        _this.$mapService.map.setMaxBounds(new L.LatLngBounds(solution.maxBounds.southWest, solution.maxBounds.northEast));
                    }
                    if (solution.viewBounds)
                        _this.$mapService.map.fitBounds(new L.LatLngBounds(solution.viewBounds.southWest, solution.viewBounds.northEast));
                    solution.baselayers.forEach(function (b) {
                        var options = {};
                        options['subtitle'] = b.subtitle;
                        options['preview'] = b.preview;
                        if (b.subdomains != null)
                            options['subdomains'] = b.subdomains;
                        if (b.maxZoom != null)
                            options.maxZoom = b.maxZoom;
                        if (b.minZoom != null)
                            options.minZoom = b.minZoom;
                        if (b.attribution != null)
                            options.attribution = b.attribution;
                        if (b.id != null)
                            options['id'] = b.id;
                        var layer = L.tileLayer(b.url, options);
                        _this.$mapService.baseLayers[b.title] = layer;
                        if (b.isDefault)
                            _this.$mapService.changeBaseLayer(layer);
                    });
                    if (solution.projects.length > 0) {
                        var p = solution.projects.filter(function (aProject) {
                            return aProject.title === initialProject;
                        })[0];
                        if (p != null) {
                            _this.openProject(p.url, layers);
                        }
                        else {
                            _this.openProject(solution.projects[0].url, layers);
                        }
                    }
                    _this.solution = solution;
                });
            };
            LayerService.prototype.openProject = function (url, layers) {
                var _this = this;
                var layerIds = [];
                if (layers) {
                    layers.split(';').forEach(function (layerId) {
                        layerIds.push(layerId.toLowerCase());
                    });
                }
                this.layerGroup.clearLayers();
                this.featureTypes = {};
                $.getJSON(url, function (data) {
                    _this.project = data;
                    if (!_this.project.timeLine) {
                        _this.project.timeLine = new DateRange();
                    }
                    if (_this.project.viewBounds) {
                        _this.$mapService.map.fitBounds(new L.LatLngBounds(_this.project.viewBounds.southWest, _this.project.viewBounds.northEast));
                    }
                    var featureTypes = _this.project.featureTypes;
                    if (featureTypes) {
                        for (var typeName in featureTypes) {
                            if (!featureTypes.hasOwnProperty(typeName))
                                continue;
                            var featureType = featureTypes[typeName];
                            _this.featureTypes[typeName] = featureType;
                        }
                    }
                    var propertyTypeData = _this.project.propertyTypeData;
                    if (propertyTypeData) {
                        for (var key in propertyTypeData) {
                            if (!propertyTypeData.hasOwnProperty(key))
                                continue;
                            var propertyType = propertyTypeData[key];
                            _this.propertyTypeData[key] = propertyType;
                        }
                    }
                    if (!_this.project.dashboards) {
                        _this.project.dashboards = {};
                        var d = new Services.Dashboard('1', _this.project.title);
                        d.widgets = [];
                        _this.project.dashboards[_this.project.title] = d;
                    }
                    if (!_this.project.dataSets)
                        _this.project.dataSets = [];
                    _this.project.features = [];
                    _this.project.groups.forEach(function (group) {
                        if (group.id == null)
                            group.id = Helpers.getGuid();
                        group.ndx = crossfilter([]);
                        if (group.styles == null)
                            group.styles = [];
                        if (group.filters == null)
                            group.filters = [];
                        group.markers = {};
                        if (group.clustering) {
                            group.cluster = new L.MarkerClusterGroup({
                                maxClusterRadius: group.maxClusterRadius || 80,
                                disableClusteringAtZoom: group.clusterLevel || 0
                            });
                            _this.map.map.addLayer(group.cluster);
                        }
                        else {
                            group.vectors = new L.LayerGroup();
                            _this.map.map.addLayer(group.vectors);
                        }
                        group.layers.forEach(function (layer) {
                            if (layer.reference == null)
                                layer.reference = Helpers.getGuid();
                            layer.group = group;
                            if (layer.enabled || layerIds.indexOf(layer.reference.toLowerCase()) >= 0) {
                                layer.enabled = true;
                                _this.addLayer(layer);
                            }
                        });
                        group.styles.forEach(function (style) {
                            if (style.id != null)
                                style.id = Helpers.getGuid();
                        });
                        group.filters.forEach(function (filter) {
                            if (filter.id != null)
                                filter.id = Helpers.getGuid();
                        });
                        if (data.startposition)
                            _this.$mapService.zoomToLocation(new L.LatLng(data.startposition.latitude, data.startposition.longitude));
                        _this.updateFilters();
                    });
                    _this.$messageBusService.publish('project', 'loaded');
                });
            };
            LayerService.prototype.closeProject = function () {
                var _this = this;
                if (this.project == null)
                    return;
                this.project.groups.forEach(function (group) {
                    group.layers.forEach(function (layer) {
                        if (layer.enabled) {
                            _this.removeLayer(layer);
                        }
                    });
                });
            };
            LayerService.prototype.zoom = function (data) {
            };
            LayerService.prototype.calculatePropertyInfo = function (group, property) {
                var _this = this;
                var r = new PropertyInfo();
                r.count = 0;
                var sum = 0;
                var sumsq = 0;
                group.layers.forEach(function (l) {
                    if (l.enabled) {
                        _this.project.features.forEach(function (f) {
                            if (f.layerId === l.id && f.properties.hasOwnProperty(property)) {
                                var s = f.properties[property];
                                var v = Number(s);
                                if (v !== NaN) {
                                    r.count += 1;
                                    sum = sum + v;
                                    sumsq = sumsq + v * v;
                                    if (r.max == null || v > r.max)
                                        r.max = v;
                                    if (r.min == null || v < r.min)
                                        r.min = v;
                                }
                            }
                        });
                    }
                });
                r.mean = sum / r.count;
                r.varience = sumsq / r.count - r.mean * r.mean;
                r.sd = Math.sqrt(r.varience);
                r.sdMax = r.mean + 3 * r.sd;
                r.sdMin = r.mean - 3 * r.sd;
                if (r.min > r.sdMin)
                    r.sdMin = r.min;
                if (r.max < r.sdMax)
                    r.sdMax = r.max;
                if (r.sdMin === NaN)
                    r.sdMin = r.min;
                if (r.sdMax === NaN)
                    r.sdMax = r.max;
                if (this.propertyTypeData.hasOwnProperty(property)) {
                    var mid = this.propertyTypeData[property];
                    if (mid.maxValue != null)
                        r.sdMax = mid.maxValue;
                    if (mid.minValue != null)
                        r.sdMin = mid.minValue;
                }
                return r;
            };
            LayerService.prototype.updateFilters = function () {
                var _this = this;
                var fmain = $('#filterChart');
                fmain.empty();
                this.noFilters = true;
                this.project.groups.forEach(function (group) {
                    if (group.filters != null && group.filters.length > 0) {
                        $('<div style=\'float:left;margin-left: -10px; margin-top: 5px\' data-toggle=\'collapse\' data-target=\'#filters_' + group.id + '\'><i class=\'fa fa-chevron-down togglebutton toggle-arrow-down\'></i><i class=\'fa fa-chevron-up togglebutton toggle-arrow-up\'></i></div><div class=\'group-title\' >' + group.title + '</div><div id=\'filtergroupcount_' + group.id + '\'  class=\'filter-group-count\' /><div class=\'collapse in\' id=\'filters_' + group.id + '\'></div>').appendTo('#filterChart');
                        group.filters.forEach(function (filter) {
                            if (filter.dimension != null)
                                filter.dimension.dispose();
                            _this.noFilters = false;
                            switch (filter.filterType) {
                                case 'text':
                                    _this.addTextFilter(group, filter);
                                    break;
                                case 'bar':
                                    _this.addBarFilter(group, filter);
                                    break;
                            }
                        });
                    }
                    _this.updateFilterGroupCount(group);
                });
                dc.renderAll();
            };
            LayerService.prototype.updateTextFilter = function (group, dcDim, value) {
                if (value == null || value === '') {
                    dcDim.filterAll();
                }
                else {
                    dcDim.filterFunction(function (d) {
                        if (d != null)
                            return (d.toLowerCase().indexOf(value.toLowerCase()) > -1);
                        return false;
                    });
                }
                group.filterResult = dcDim.top(Infinity);
                this.updateMapFilter(group);
                dc.renderAll();
            };
            LayerService.prototype.updateFilterGroupCount = function (group) {
                if (group.filterResult != null)
                    $('#filtergroupcount_' + group.id).text(group.filterResult.length + ' objecten geselecteerd');
            };
            LayerService.prototype.addTextFilter = function (group, filter) {
                var _this = this;
                filter.id = Helpers.getGuid();
                var dcDim = group.ndx.dimension(function (d) {
                    if (d.properties.hasOwnProperty(filter.property)) {
                        return d.properties[filter.property];
                    }
                    else
                        return null;
                });
                filter.dimension = dcDim;
                dcDim.filterFunction(function (d) {
                    if (d != null)
                        return (d.toLowerCase().indexOf(filter.stringValue.toLowerCase()) > -1);
                    return false;
                });
                this.updateTextFilter(group, dcDim, filter.stringValue);
                var fid = 'filtertext' + filter.id;
                $('<h4>' + filter.title + '</h4><input type=\'text\' value=\'' + filter.stringValue + '\' class=\'filter-text\' id=\'' + fid + '\'/><a class=\'btn\' value=' + filter.value + ' id=\'remove' + filter.id + '\'><i class=\'fa fa-times\'></i></a>').appendTo('#filters_' + group.id);
                $('#' + fid).keyup(function () {
                    filter.stringValue = $('#' + fid).val();
                    _this.updateTextFilter(group, dcDim, filter.stringValue);
                    _this.updateFilterGroupCount(group);
                });
                $('#remove' + filter.id).on('click', function () {
                    var pos = group.filters.indexOf(filter);
                    filter.dimension.filterAll();
                    filter.dimension.dispose();
                    filter.dimension = null;
                    if (pos !== -1)
                        group.filters = group.filters.slice(pos - 1, pos);
                    dc.filterAll();
                    _this.updateFilters();
                    _this.resetMapFilter(group);
                });
            };
            LayerService.prototype.updateChartRange = function (chart, filter) {
                var filterFrom = $('#fsfrom_' + filter.id);
                var filterTo = $('#fsto_' + filter.id);
                var extent = chart.brush().extent();
                if (extent != null && extent.length === 2) {
                    if (extent[0] !== extent[1]) {
                        console.log(extent);
                        filterFrom.val(extent[0]);
                        filterTo.val(extent[1]);
                    }
                }
                else {
                    filterFrom.val('0');
                    filterTo.val('1');
                }
            };
            LayerService.prototype.addBarFilter = function (group, filter) {
                var _this = this;
                filter.id = Helpers.getGuid();
                var info = this.calculatePropertyInfo(group, filter.property);
                var divid = 'filter_' + filter.id;
                $('<h4>' + filter.title + '</h4><div id=\'' + divid + '\'></div><div style=\'display:none\' id=\'fdrange_' + filter.id + '\'>from <span id=\'fsfrom_' + filter.id + '\'/> to <span id=\'fsto_' + filter.id + '\'/></div><a class=\'btn\' id=\'remove' + filter.id + '\'>remove</a>').appendTo('#filterChart');
                var filterFrom = $('#fsfrom_' + filter.id);
                var filterTo = $('#fsto_' + filter.id);
                var filterRange = $('#fdrange_' + filter.id);
                $('#remove' + filter.id).on('click', function () {
                    var pos = group.filters.indexOf(filter);
                    if (pos !== -1)
                        group.filters.splice(pos, 1);
                    filter.dimension.dispose();
                    _this.updateFilters();
                    _this.resetMapFilter(group);
                });
                var dcChart = dc.barChart('#' + divid);
                var nBins = 20;
                var binWidth = (info.sdMax - info.sdMin) / nBins;
                var dcDim = group.ndx.dimension(function (d) {
                    if (!d.properties.hasOwnProperty(filter.property))
                        return null;
                    else {
                        if (d.properties[filter.property] != null) {
                            var a = parseInt(d.properties[filter.property]);
                            if (a >= info.sdMin && a <= info.sdMax) {
                                return Math.floor(a / binWidth) * binWidth;
                            }
                            else {
                                return null;
                            }
                        }
                        return null;
                    }
                });
                filter.dimension = dcDim;
                var dcGroup = dcDim.group();
                dcChart.width(275).height(90).dimension(dcDim).group(dcGroup).transitionDuration(100).centerBar(true).gap(5).elasticY(true).x(d3.scale.linear().domain([info.sdMin, info.sdMax]).range([-1, nBins + 1])).filterPrinter(function (filters) {
                    var s = '';
                    if (filters.length > 0) {
                        var localFilter = filters[0];
                        filterFrom.text(localFilter[0].toFixed(2));
                        filterTo.text(localFilter[1].toFixed(2));
                        s += localFilter[0];
                    }
                    return s;
                }).on('filtered', function (e) {
                    var fil = e.hasFilter();
                    if (fil) {
                        filterRange.show();
                    }
                    else {
                        filterRange.hide();
                    }
                    dc.events.trigger(function () {
                        group.filterResult = dcDim.top(Infinity);
                        _this.updateFilterGroupCount(group);
                    }, 0);
                    dc.events.trigger(function () {
                        _this.updateMapFilter(group);
                    }, 100);
                });
                dcChart.xUnits(function () {
                    return 13;
                });
                filterFrom.on('change', function () {
                    if ($.isNumeric(filterFrom.val())) {
                        var min = parseInt(filterFrom.val());
                        var filters = dcChart.filters();
                        if (filters.length > 0) {
                            filters[0][0] = min;
                            dcChart.filter(filters[0]);
                            dcChart.render();
                            dc.redrawAll();
                        }
                    }
                });
                filterTo.on('change', function () {
                    if ($.isNumeric(filterTo.val())) {
                        var max = parseInt(filterTo.val());
                        var filters = dcChart.filters();
                        if (filters.length > 0) {
                            filters[0][1] = max;
                            dcChart.filter(filters[0]);
                            dcDim.filter(filters[0]);
                            dc.renderAll();
                        }
                    }
                });
                dcChart.yAxis().ticks(5);
                dcChart.xAxis().ticks(5);
                this.updateChartRange(dcChart, filter);
            };
            LayerService.prototype.updateMapFilter = function (group) {
                $.each(group.markers, function (key, marker) {
                    var included = group.filterResult.filter(function (f) { return f.id === key; }).length > 0;
                    if (group.clustering) {
                        var incluster = group.cluster.hasLayer(marker);
                        if (!included && incluster)
                            group.cluster.removeLayer(marker);
                        if (included && !incluster)
                            group.cluster.addLayer(marker);
                    }
                    else {
                        var onmap = group.vectors.hasLayer(marker);
                        if (!included && onmap)
                            group.vectors.removeLayer(marker);
                        if (included && !onmap)
                            group.vectors.addLayer(marker);
                    }
                });
            };
            LayerService.prototype.resetMapFilter = function (group) {
                $.each(group.markers, function (key, marker) {
                    if (group.clustering) {
                        var incluster = group.cluster.hasLayer(marker);
                        if (!incluster)
                            group.cluster.addLayer(marker);
                    }
                    else {
                        var onmap = group.vectors.hasLayer(marker);
                        if (!onmap)
                            group.vectors.addLayer(marker);
                    }
                });
            };
            LayerService.$inject = [
                '$location',
                '$translate',
                'messageBusService',
                'mapService'
            ];
            return LayerService;
        })();
        Services.LayerService = LayerService;
    })(Services = csComp.Services || (csComp.Services = {}));
})(csComp || (csComp = {}));
