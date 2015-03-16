module csComp.Services {
    'use strict';

    export class GeoJsonSource implements ILayerSource
    {
      title = "geojson";
      service : LayerService;

      init(service : LayerService){
        this.service = service;
      }

      enableLayer(layer : ProjectLayer)
      {
        async.series([

            (callback) => {
                // Open a layer URL
                layer.isLoading = true;
                d3.json(layer.url, (error, data) => {
                  layer.isLoading = false;
                    if (error)
                        this.service.$messageBusService.notify('ERROR loading' + layer.title, error);
                    else {
                        if (layer.type.toLowerCase() === 'topojson')
                        {
                            data = this.service.convertTopoToGeoJson(data);
                        }
                        if (data.events && this.service.timeline) {
                            layer.events = data.events;
                            var devents = [];
                            layer.events.forEach((e: Event) => {
                                if (!e.id) e.id = Helpers.getGuid();
                                devents.push({
                                    'start': new Date(e.start),
                                    'content': e.title
                                });
                            });
                            this.service.timeline.draw(devents);
                        }
                        for (var featureTypeName in data.featureTypes) {
                            if (!data.featureTypes.hasOwnProperty(featureTypeName)) continue;
                            var featureType: IFeatureType = data.featureTypes[featureTypeName];
                            featureTypeName = layer.id + '_' + featureTypeName;
                            this.service.featureTypes[featureTypeName] = featureType;
                            //var pt = "." + featureTypeName;
                            //var icon = featureType.style.iconUri;
                            // var t = '{".style' + featureTypeName + '":';
                            // if (featureType.style.iconUri != null) {
                            //     t += ' { "background": "url(' + featureType.style.iconUri + ') no-repeat right center",';
                            // };
                            // t += ' "background-size": "100% 100%","border-style": "none"} }';
                            // var json = $.parseJSON(t);
                            // (<any>$).injectCSS(json);

                            //console.log(JSON.stringify(poiType, null, 2));
                        }
                        if (data.timestamps) layer.timestamps = data.timestamps;
                        if (layer.group.clustering) {
                            var markers = L.geoJson(data, {
                                pointToLayer: (feature, latlng) => this.service.addFeature(feature, latlng, layer),
                                onEachFeature: (feature: IFeature, lay) => {
                                    //We do not need to init the feature here: already done in style.
                                    //this.initFeature(feature, layer);
                                    layer.group.markers[feature.id] = lay;
                                    lay.on({
                                        mouseover: (a) => this.service.showFeatureTooltip(a, layer.group),
                                        mouseout: (s) => this.service.hideFeatureTooltip(s)
                                    });
                                }
                            });
                            layer.group.cluster.addLayer(markers);
                        } else {
                            layer.mapLayer = new L.LayerGroup<L.ILayer>();
                            this.service.map.map.addLayer(layer.mapLayer);

                            var v = L.geoJson(data, {
                                onEachFeature : (feature: IFeature, lay) => {
                                    //We do not need to init the feature here: already done in style.
                                    //this.initFeature(feature, layer);
                                    layer.group.markers[feature.id] = lay;
                                    lay.on({
                                        mouseover : (a) => this.service.showFeatureTooltip(a, layer.group),
                                        mouseout  : (s) => this.service.hideFeatureTooltip(s),
                                        mousemove : (d) => this.service.updateFeatureTooltip(d),
                                        click     : ()  => this.service.selectFeature(feature)
                                    });
                                },
                                style: (f: IFeature, m) => {

                                    this.service.initFeature(f, layer);
                                    //this.updateSensorData();
                                    layer.group.markers[f.id] = m;
                                    return this.service.style(f, layer);
                                },
                                pointToLayer                                 : (feature, latlng) => this.service.addFeature(feature, latlng, layer)
                            });
                            this.service.project.features.forEach((f                 : IFeature) => {
                                if (f.layerId !== layer.id) return;
                                var ft = this.service.getFeatureType(f);
                                f.properties['Name'] = f.properties[ft.style.nameLabel];
                            });
                            layer.mapLayer.addLayer(v);
                        }
                  }
                    this.service.updateSensorData();
                    this.service.$messageBusService.publish('layer', 'activated', layer);

                    callback(null, null);
                    this.service.updateFilters();
                });
            },
            // Callback
            () => {

            }
        ]);
      }

      disableLayer(layer : ProjectLayer)
      {
        //alert('remove layer');
      }

    }

  }
