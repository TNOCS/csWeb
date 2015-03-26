module csComp.Services
{
  export class LeafletRenderer implements IMapRenderer
  {

    title = "leaflet";
    service : LayerService;
    $messageBusService : MessageBusService;

    private popup: L.Popup;

    public init(service : LayerService){
      this.service = service;
      this.$messageBusService = service.$messageBusService;
    }

    public enable()
    {
      this.service.$mapService.map = L.map("map", {
      //var tl  = L.map("mapleft", {
          zoomControl: false,
          attributionControl: true
      });

    }
    public disable()
    {
      this.service.$mapService.map.remove();
      this.service.$mapService.map = null;
      $("#map").empty();

    }

    public addGroup(group : ProjectGroup) {
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

    public removeLayer(layer : ProjectLayer)
    {
      switch (layer.layerRenderer)
      {
        case "svg":
          var g = layer.group;

                //m = layer.group.vectors;
                if (g.clustering) {
                    var m = g.cluster;
                    this.service.project.features.forEach((feature: IFeature) => {
                        if (feature.layerId === layer.id) {
                            try {
                                m.removeLayer(layer.group.markers[feature.id]);
                                delete layer.group.markers[feature.id];
                            } catch (error) {

                            }
                        }
                    });
                } else {
                    this.service.map.map.removeLayer(layer.mapLayer);
                }
          break;
        case "wms":
          break;
      }

    }

    public addLayer(layer : ProjectLayer)
    {
      switch (layer.layerRenderer)
      {
        case "wms":
            var wms        : any = L.tileLayer.wms(layer.url, {
                layers     : layer.wmsLayers,
                opacity    : layer.opacity/100,
                format     : 'image/png',
                transparent: true,
                attribution: layer.description
            });
            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            this.service.map.map.addLayer(layer.mapLayer);
            layer.mapLayer.addLayer(wms);
            wms.on('loading',  (event) => {
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
          case "svg":
            // create leaflet layers
            if (layer.group.clustering) {
                var markers = L.geoJson(layer.data, {
                    pointToLayer: (feature, latlng) => this.addFeature(feature),
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

                var v = L.geoJson(layer.data, {
                    onEachFeature : (feature: IFeature, lay) => {
                        //We do not need to init the feature here: already done in style.
                        //this.initFeature(feature, layer);
                        layer.group.markers[feature.id] = lay;
                        lay.on({
                            mouseover : (a) => this.showFeatureTooltip(a, layer.group),
                            mouseout  : (s) => this.hideFeatureTooltip(s),
                            mousemove : (d) => this.updateFeatureTooltip(d),
                            click     : ()  => this.service.selectFeature(feature)
                        });
                    },
                    style: (f: IFeature, m) => {
                        layer.group.markers[f.id] = m;
                        return f.effectiveStyle;
                    },
                    pointToLayer                                 : (feature, latlng) => this.addFeature(feature)
                });
                this.service.project.features.forEach((f                 : IFeature) => {
                    if (f.layerId !== layer.id) return;
                    var ft = this.service.getFeatureType(f);
                    f.properties['Name'] = f.properties[ft.style.nameLabel];
                });
                layer.mapLayer.addLayer(v);
            break;
      }

      }
    }

    /***
     * Update map markers in cluster after changing filter
     */
    public updateMapFilter(group: ProjectGroup) {
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

    public removeGroup(group : ProjectGroup) {}

    public removeFeature(feature : IFeature) {

    }

    public updateFeature(feature : IFeature) {
      if (feature.geometry.type === 'Point') {
          var marker = <L.Marker>feature.layer.group.markers[feature.id];
          if (marker != null) marker.setIcon(this.getPointIcon(feature));

      } else {
          if (feature.layer.group == null) return;
          var m = feature.layer.group.markers[feature.id];
          var layer = this.service.findLayer(feature.layerId);
          //var s = this.style(feature);
          m.setStyle(feature.effectiveStyle);
      }
    }



      /**
       * add a feature
       */
      public addFeature(feature: IFeature) : any {
          //this.service.initFeature(feature,layer);
          //var style = type.style;
          var marker;
          switch (feature.geometry.type) {
          case 'Point'          :
              var icon = this.getPointIcon(feature);
              marker = new L.Marker(new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]), { icon: icon });
              marker.on('click', () => {
                  this.service.selectFeature(feature);
              });
              //feature.marker = m;
              break;
              default:
                  var polyoptions = {
                      fillColor: 'Green'
                  };
                  //marker = L.multiPolygon(latlng, polyoptions);
              break;
          }

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
                iconSize: new L.Point(32, 32),
                html: feature.htmlStyle
            });
        } else {
            var html = '<div ';
            var props = {};
            var ft = this.service.getFeatureType(feature);

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

            feature.layer.group.styles.forEach((gs: GroupStyle) => {
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
        if (this.popup!=null && e.latlng!=null) this.popup.setLatLng(e.latlng);
    }

  }


}
