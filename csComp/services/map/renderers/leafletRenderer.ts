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
                attributionControl: true

            });
            this.map = this.service.$mapService.map;





            this.service.$mapService.map.on('moveend', (t, event: any) => {
                var b = (<L.Map>(this.service.$mapService.map)).getBounds();
                this.$messageBusService.publish("mapbbox", "update", b.toBBoxString());

                var boundingBox: csComp.Services.IBoundingBox = { southWest: [b.getSouthWest().lat, b.getSouthWest().lng], northEast: [b.getNorthEast().lat, b.getNorthEast().lng] };
                this.service.$mapService.maxBounds = boundingBox;
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
                    maxClusterRadius: (zoom) => { if (zoom > 18) { return 2; } else { return group.maxClusterRadius || 80 } },
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
                        this.service.project.features.forEach((feature: IFeature) => {
                            if (feature.layerId === layer.id && layer.group.markers.hasOwnProperty(feature.id)) {
                                delete layer.group.markers[feature.id];
                            }
                        });
                        if (this.service.map.map && layer.mapLayer) {
                            try {
                                this.service.map.map.removeLayer(layer.mapLayer);
                            } catch (error) { }
                        }
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
                        attribution: layer.description,
                        tiled: true
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
                var includedPropFilter, includedMapFilter, included;
                if (group.filterResult && group.filters.length > 0) {
                    includedPropFilter = group.filterResult.filter((f: IFeature) => f.id === key).length > 0;
                } else {
                    includedPropFilter = true;
                }
                if (this.service.project.mapFilterResult && this.service.project.mapFilterResult.length > 0) {
                    includedMapFilter = this.service.project.mapFilterResult.filter((m: any) => m.feature.id === key).length > 0;
                } else {
                    includedMapFilter = true;
                }
                included = (includedPropFilter && includedMapFilter);
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
                if (feature.isSelected && feature.layer && feature.layer.type !== 'accessibility' && feature.layer.group) {
                    if ((feature.layer.group.clustering && feature.layer.group.cluster && feature.layer.group.cluster.hasLayer(marker))
                        || feature.layer.group.markers.hasOwnProperty(marker.feature.id)) {
                        marker.bringToFront();
                    }
                }
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
                        icon: icon
                    });

                    marker.on('contextmenu', (e: any) => {
                        this.service._activeContextMenu = this.service.getActions(feature);

                        //e.stopPropagation();
                        var button: any = $("#map-contextmenu-button");
                        var menu: any = $("#map-contextmenu");
                        button.dropdown('toggle');
                        var mapSize = this.map.getSize();
                        menu.css("left", e.originalEvent.x + 5);
                        menu.css("top", e.originalEvent.y - 35);
                        if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
                        /*var containerSize = this.getElementSize(container),
                            anchor;*/
                        //console.log(e);
                        //L.DomEvent.apply(e, "click");
                        //alert(e.latlng);
                    });


                    break;
                default:
                    marker = L.GeoJSON.geometryToLayer(<any>feature);
                    marker.setStyle(this.getLeafletStyle(feature.effectiveStyle));

                    marker.on('contextmenu', (e: any) => {
                        this.service._activeContextMenu = this.service.getActions(feature);

                        //e.stopPropagation();
                        var button: any = $("#map-contextmenu-button");
                        var menu: any = $("#map-contextmenu");
                        button.dropdown('toggle');
                        var mapSize = this.map.getSize();
                        menu.css("left", e.originalEvent.x + 5);
                        menu.css("top", e.originalEvent.y - 35);
                        if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
                    });

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
                var iconHtml = csComp.Helpers.createIconHtml(feature, this.service.getFeatureType(feature));

                icon = new L.DivIcon({
                    className: '',
                    iconSize: new L.Point(iconHtml['iconPlusBorderWidth'], iconHtml['iconPlusBorderHeight']),
                    html: iconHtml['html']
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

            //In case a BAG contour is available, show it.
            if (this.service.currentContour) this.service.map.map.removeLayer(this.service.currentContour);
            if (feature.properties.hasOwnProperty('_bag_contour')) {
                var geoContour: L.GeoJSON = JSON.parse(feature.properties['_bag_contour']);
                this.service.currentContour = L.geoJson(geoContour);
                this.service.currentContour.addTo(this.service.map.map);
            }
        }

        hideFeatureTooltip(e) {
            if (this.popup && this.service.map.map) {
                (<any>this.service.map.map).closePopup(this.popup);
                //this.map.map.closePopup(this.popup);
                this.popup = null;
            }
            if (this.service.currentContour) this.service.map.map.removeLayer(this.service.currentContour);
        }

        updateFeatureTooltip(e) {
            if (this.popup != null && e.latlng != null) this.popup.setLatLng(e.latlng);
        }
    }


}
