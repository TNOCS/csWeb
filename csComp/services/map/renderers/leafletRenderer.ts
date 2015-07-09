module csComp.Services {
    export class LeafletRenderer implements IMapRenderer {

        title = "leaflet";
        service: LayerService;
        $messageBusService: MessageBusService;
        map: L.Map;

        private popup: L.Popup;

        public init(service: LayerService) {
            this.service = service;
            this.$messageBusService = service.$messageBusService;
        }

        public enable() {
            if ($("map").length !== 1) return;
            this.service.$mapService.map = L.map("map", {

                //var tl  = L.map("mapleft", {
                zoomControl: false,
                maxZoom: 19,
                attributionControl: true,
                contextmenu: true,
                contextmenuWidth: 140,
                contextmenuItems: [{
                    text: 'Show coordinates',
                    callback: () => { alert('test') }
                }, {
                        text: 'Center map here',
                        callback: () => { alert('test') }
                    }, '-', {
                        text: 'Zoom in',
                        icon: 'images/zoom-in.png',
                        callback: () => { alert('test') }
                    }, {
                        text: 'Zoom out',
                        icon: 'images/zoom-out.png',
                        callback: () => { alert('test') }
                    }]

            });
            this.map = this.service.$mapService.map;


            /*this.map.on('contextmenu', (e: any) => {
                alert(e.latlng);
            });*/


            this.service.$mapService.map.on('moveend', (t, event: any) => {
                var b = (<L.Map>(this.service.$mapService.map)).getBounds();
                this.$messageBusService.publish("mapbbox", "update", b.toBBoxString());

                //this.service.$mapService.maxBounds = new csComp.Seb;
            });
        }

        public getExtent(): csComp.Services.IBoundingBox {

            var r = <IBoundingBox>{};
            if (this.map) {
                var b = this.map.getBounds();
                var sw = b.getSouthWest();
                var ne = b.getNorthEast();
                r.southWest = [sw.lat, sw.lng];
                r.northEast = [ne.lat, ne.lng];
            }
            return r;

        }

        public fitBounds(bounds: csComp.Services.IBoundingBox) {
            var southWest = L.latLng(bounds.southWest[0], bounds.southWest[1]);
            var northEast = L.latLng(bounds.northEast[0], bounds.northEast[1]);
            var lb = L.latLngBounds(southWest, northEast);
            try {
                this.service.$mapService.map.fitBounds(lb);
            } catch (e) { }
        }

        public getZoom() {
            return this.service.$mapService.map.getZoom();
        }

        public disable() {
            this.service.$mapService.map.remove();
            this.service.$mapService.map = null;
            $("#map").empty();
        }

        public addGroup(group: ProjectGroup) {
            // for clustering use a cluster layer
            if (group.clustering) {
                group.cluster = new L.MarkerClusterGroup({
                    maxClusterRadius: group.maxClusterRadius || 80,
                    disableClusteringAtZoom: group.clusterLevel || 0
                });
                this.service.map.map.addLayer(group.cluster);
            } else {
                group.vectors = new L.LayerGroup<L.ILayer>();
                this.service.map.map.addLayer(group.vectors);
            }
        }

        public removeLayer(layer: ProjectLayer) {
            switch (layer.renderType) {

                case "geojson":
                    var g = layer.group;
                    //m = layer.group.vectors;
                    if (g.clustering) {
                        var m = g.cluster;
                        this.service.project.features.forEach((feature: IFeature) => {
                            if (feature.layerId === layer.id) {
                                try {
                                    m.removeLayer(layer.group.markers[feature.id]);
                                    delete layer.group.markers[feature.id];
                                } catch (error) { }
                            }
                        });
                    } else {
                        if (this.service.map.map && layer.mapLayer)
                            try {
                                this.service.map.map.removeLayer(layer.mapLayer);
                            } catch (error) { }
                    }
                    break;
                default:

                    if (this.service.map.map && layer.mapLayer) this.service.map.map.removeLayer(layer.mapLayer);
                    break;
            }

        }

        baseLayer: L.ILayer;

        public changeBaseLayer(layerObj: BaseLayer) {
            if (layerObj == this.service.$mapService.activeBaseLayer) return;
            if (this.baseLayer) this.service.map.map.removeLayer(this.baseLayer);
            this.baseLayer = this.createBaseLayer(layerObj);

            this.service.map.map.addLayer(this.baseLayer);

            this.service.map.map.setZoom(this.service.map.map.getZoom());
            this.service.map.map.fire('baselayerchange', { layer: this.baseLayer });
            console.log('changebaselayer');
        }

        private createBaseLayer(layerObj: BaseLayer) {
            var options: L.TileLayerOptions = { noWrap: true };
            options['subtitle'] = layerObj.subtitle;
            options['preview'] = layerObj.preview;
            if (layerObj.subdomains != null) options['subdomains'] = layerObj.subdomains;
            if (layerObj.maxZoom != null) options.maxZoom = layerObj.maxZoom;
            if (layerObj.minZoom != null) options.minZoom = layerObj.minZoom;
            if (layerObj.attribution != null) options.attribution = layerObj.attribution;
            if (layerObj.id != null) options['id'] = layerObj.id;
            var layer = L.tileLayer(layerObj.url, options);

            return layer;
        }
        private getLeafletStyle(style: IFeatureTypeStyle) {
            var s = {
                fillColor: style.fillColor,
                weight: style.strokeWidth,
                opacity: style.opacity,
                fillOpacity: style.fillOpacity
            };
            s["color"] = (typeof style.stroke !== 'undefined' && style.stroke === false)
                ? style.fillColor
                : style.strokeColor;
            return s;
        }

        public addLayer(layer: ProjectLayer) {
            switch (layer.renderType) {
                case "tilelayer":
                    // check if we need to create a unique url to force a refresh
                    var u = layer.url;
                    if (layer.disableCache) {
                        layer.cacheKey = new Date().getTime().toString();
                        u += "&cache=" + layer.cacheKey;
                    }

                    var tileLayer: any = L.tileLayer(u, { attribution: layer.description });

                    layer.mapLayer = new L.LayerGroup<L.ILayer>();
                    tileLayer.setOpacity(layer.opacity / 100);
                    this.service.map.map.addLayer(layer.mapLayer);
                    layer.mapLayer.addLayer(tileLayer);
                    tileLayer.on('loading', (event) => {
                        layer.isLoading = true;
                        this.service.$rootScope.$apply();
                        if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
                    });
                    tileLayer.on('load', (event) => {
                        layer.isLoading = false;
                        if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
                    });
                    layer.isLoading = true;


                    //this.$rootScope.$apply();
                    break;
                case "wms":
                    var wms: any = L.tileLayer.wms(layer.url, {
                        layers: layer.wmsLayers,
                        opacity: layer.opacity / 100,
                        format: 'image/png',
                        transparent: true,
                        attribution: layer.description
                    });
                    layer.mapLayer = new L.LayerGroup<L.ILayer>();
                    this.service.map.map.addLayer(layer.mapLayer);
                    layer.mapLayer.addLayer(wms);
                    wms.on('loading', (event) => {
                        layer.isLoading = true;
                        this.service.$rootScope.$apply();
                        if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
                    });
                    wms.on('load', (event) => {
                        layer.isLoading = false;
                        if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
                    });
                    layer.isLoading = true;
                    break;
                case "geojson":
                    // create leaflet layers
                    layer.mapLayer = new L.LayerGroup<L.ILayer>();
                    this.service.map.map.addLayer(layer.mapLayer);
                    if (!layer.data || !layer.data.features) break;

                    (<any>layer.data).features.forEach((f: IFeature) => {
                        var marker = this.addFeature(f);
                        if (marker) layer.group.markers[f.id] = marker;
                    });
                    //var v = L.geoJson(layer.data, {
                    //    style: (f: IFeature, m) => {
                    //        layer.group.markers[f.id] = m;
                    //        return this.getLeafletStyle(f.effectiveStyle);
                    //    },
                    //    pointToLayer : (feature, latlng) =>
                    //});
                    //this.service.project.features.forEach((f : IFeature) => {
                    //    if (f.layerId !== layer.id) return;
                    //    var ft = this.service.getFeatureType(f);
                    //    f.properties['Name'] = f.properties[ft.style.nameLabel];
                    //});
                    //layer.mapLayer.addLayer(v);
                    break;
                case "heatmap":
                    if (layer.quickRefresh && layer.quickRefresh == true) break; //When only updating style of current heatmap, do not add a new layer.
                    var time = new Date().getTime();
                    // create leaflet layers
                    layer.isLoading = true;
                    if (layer.group.clustering) {
                        var markers = L.geoJson(layer.data, {
                            pointToLayer: (feature, latlng) => this.createFeature(feature),
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
                        this.service.map.map.addLayer(layer.mapLayer);

                        if (layer.data && layer.data.features) {
                            var v = L.geoJson(layer.data, {
                                onEachFeature: (feature: IFeature, lay) => {
                                    //We do not need to init the feature here: already done in style.
                                    //this.initFeature(feature, layer);
                                    layer.group.markers[feature.id] = lay;
                                    lay.on({
                                        mouseover: (a) => this.showFeatureTooltip(a, layer.group),
                                        mouseout: (s) => this.hideFeatureTooltip(s),
                                        mousemove: (d) => this.updateFeatureTooltip(d),
                                        click: () => this.service.selectFeature(feature)
                                    });
                                },
                                style: (f: IFeature, m) => {
                                    layer.group.markers[f.id] = m;
                                    return f.effectiveStyle;
                                },
                                pointToLayer: (feature, latlng) => this.createFeature(feature)
                            });
                        } else {
                            var v = L.geoJson([]);
                        }
                        this.service.project.features.forEach((f: IFeature) => {
                            if (f.layerId !== layer.id) return;
                            var ft = this.service.getFeatureType(f);
                            f.properties['Name'] = f.properties[ft.style.nameLabel];
                        });

                        layer.mapLayer.addLayer(v);
                        layer.isLoading = false;
                        var time2 = new Date().getTime();
                        console.log('Applied style in ' + (time2 - time).toFixed(1) + ' ms');
                    }
                    break;
            }
        }

        /***
         * Update map markers in cluster after changing filter
         */
        public updateMapFilter(group: ProjectGroup) {
            $.each(group.markers, (key, marker) => {
                var included;
                if (group.filterResult) included = group.filterResult.filter((f: IFeature) => f.id === key).length > 0;
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

        public removeGroup(group: ProjectGroup) { }

        public removeFeature(feature: IFeature) {
            var marker = <L.Marker>feature.layer.group.markers[feature.id];
            if (marker != null) {
                feature.layer.mapLayer.removeLayer(marker);
                delete feature.layer.group.markers[feature.id];
            }
        }

        public updateFeature(feature: IFeature) {
            if (feature.layer.group == null) return;
            var marker = feature.layer.group.markers[feature.id];
            if (marker == null) return;
            if (feature.geometry.type === 'Point') {
                marker.setIcon(this.getPointIcon(feature));
                marker.setLatLng(new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]));
            } else {
                marker.setStyle(this.getLeafletStyle(feature.effectiveStyle));
                if (feature.layer && feature.layer.type !== 'accessibility') marker.bringToFront();
            }
        }

        public addFeature(feature: IFeature): any {
            if (feature.geometry != null) {
                var m = this.createFeature(feature);
                var l = <ProjectLayer>feature.layer;
                l.group.markers[feature.id] = m;
                m.on({
                    mouseover: (a) => this.showFeatureTooltip(a, l.group),
                    mouseout: (s) => this.hideFeatureTooltip(s),
                    mousemove: (d) => this.updateFeatureTooltip(d),
                    click: () => this.service.selectFeature(feature)
                });
                m.feature = feature;
                if (l.group.clustering) {
                    l.group.cluster.addLayer(m);
                }
                else {
                    if (l.mapLayer) {
                        l.mapLayer.addLayer(m);
                    }
                }
                return m;
            } else return null;
        }

        /**
         * add a feature 
         */
        public createFeature(feature: IFeature): any {
            //this.service.initFeature(feature,layer);
            //var style = type.style;
            var marker;
            switch (feature.geometry.type) {
                case 'Point':
                    var icon = this.getPointIcon(feature);
                    marker = new L.Marker(new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]), {
                        icon: icon,
                        contextmenu: true,
                        contextmenuInheritItems: false,
                        contextmenuItems: [{
                            text: 'Marker item'
                        }]
                    });

                    break;
                default:
                    marker = L.GeoJSON.geometryToLayer(<any>feature);
                    marker.setStyle(this.getLeafletStyle(feature.effectiveStyle));

                    //marker = L.multiPolygon(latlng, polyoptions);
                    break;
            }
            marker.feature = feature;
            feature.layer.group.markers[feature.id] = marker;

            return marker;
        }

        /**
         * create icon based of feature style
         */
        public getPointIcon(feature: IFeature): any {
            var icon: L.DivIcon;
            if (feature.htmlStyle != null) {
                icon = new L.DivIcon({
                    className: '',
                    iconSize: new L.Point(feature.effectiveStyle.iconWidth, feature.effectiveStyle.iconHeight),
                    html: feature.htmlStyle
                });
            } else {
                var html = '<div ';
                var props = {};
                var ft = this.service.getFeatureType(feature);

                //if (feature.poiTypeName != null) html += "class='style" + feature.poiTypeName + "'";
                var iconUri = feature.effectiveStyle.iconUri; //ft.style.iconUri;
                //if (ft.style.fillColor == null && iconUri == null) ft.style.fillColor = 'lightgray';

                // TODO refactor to object
                props['background'] = feature.effectiveStyle.fillColor;
                props['width'] = feature.effectiveStyle.iconWidth + 'px';
                props['height'] = feature.effectiveStyle.iconHeight + 'px';
                props['border-radius'] = feature.effectiveStyle.cornerRadius + '%';
                props['border-style'] = 'solid';
                props['border-color'] = feature.effectiveStyle.strokeColor;
                props['border-width'] = feature.effectiveStyle.strokeWidth;
                props['opacity'] = feature.effectiveStyle.opacity;

                if (feature.isSelected) {
                    props['border-width'] = '3px';
                }

                html += ' style=\'display: inline-block;vertical-align: middle;text-align: center;';
                for (var key in props) {
                    if (!props.hasOwnProperty(key)) continue;
                    html += key + ':' + props[key] + ';';
                }

                html += '\'>';
                if (feature.effectiveStyle.innerTextProperty != null && feature.properties.hasOwnProperty(feature.effectiveStyle.innerTextProperty)) {
                    html += "<span style='font-size:12px;vertical-align:-webkit-baseline-middle'>" + feature.properties[feature.effectiveStyle.innerTextProperty] + "</span>";
                }
                else if (iconUri != null) {
                    // Must the iconUri be formatted?
                    if (iconUri != null && iconUri.indexOf('{') >= 0) iconUri = Helpers.convertStringFormat(feature, iconUri);

                    html += '<img src=\'' + iconUri + '\' style=\'width:' + (feature.effectiveStyle.iconWidth - 6) + 'px;height:' + (feature.effectiveStyle.iconHeight - 6) + 'px';
                    if (feature.effectiveStyle.rotate && feature.effectiveStyle.rotate > 0) html += ';transform:rotate(' + feature.effectiveStyle.rotate + 'deg)';
                    html += '\' />';
                }

                html += '</div>';

                icon = new L.DivIcon({
                    className: '',
                    iconSize: new L.Point(feature.effectiveStyle.iconWidth, feature.effectiveStyle.iconHeight),
                    html: html
                });
                //icon = new L.DivIcon({
                //    className: "style" + feature.poiTypeName,
                //    iconSize: new L.Point(feature.fType.style.iconWidth, feature.fType.style.iconHeight)
                //});
            }
            return icon;
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
                        var tl = s.title ? s.title.length : 10;
                        rowLength = Math.max(rowLength, valueLength + tl);
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
            }).setLatLng(e.latlng).setContent(content).openOn(this.service.map.map);
        }

        hideFeatureTooltip(e) {
            if (this.popup && this.service.map.map) {
                (<any>this.service.map.map).closePopup(this.popup);
                //this.map.map.closePopup(this.popup);
                this.popup = null;
            }
        }

        updateFeatureTooltip(e) {
            if (this.popup != null && e.latlng != null) this.popup.setLatLng(e.latlng);
        }
    }


}
