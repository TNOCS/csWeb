module csComp.Services {
    export class HeatmapRenderer {
        static render(service: LayerService, layer: ProjectLayer, mapRenderer: LeafletRenderer) {
            if (layer.quickRefresh && layer.quickRefresh == true) return; //When only updating style of current heatmap, do not add a new layer.
            var time = new Date().getTime();
            // create leaflet layers
            layer.isLoading = true;
            if (layer.group.clustering) {
                var markers = L.geoJson(layer.data, {
                    pointToLayer: (feature, latlng) => mapRenderer.createFeature(feature),
                    onEachFeature: (feature: IFeature, lay) => {
                        //We do not need to init the feature here: already done in style.
                        //this.initFeature(feature, layer);
                        layer.group.markers[feature.id] = lay;
                        lay.on({
                            mouseover: (a) => mapRenderer.showFeatureTooltip(a, layer.group),
                            mouseout: (s) => mapRenderer.hideFeatureTooltip(s)
                        });
                    }
                });
                layer.group.cluster.addLayer(markers);
            } else {
                layer.mapLayer = new L.LayerGroup<L.ILayer>();
                service.map.map.addLayer(layer.mapLayer);

                if (layer.data && layer.data.features) {
                    var v = L.geoJson(layer.data, {
                        onEachFeature: (feature: IFeature, lay) => {
                            //We do not need to init the feature here: already done in style.
                            //this.initFeature(feature, layer);
                            layer.group.markers[feature.id] = lay;
                            lay.on({
                                mouseover: (a) => mapRenderer.showFeatureTooltip(a, layer.group),
                                mouseout: (s) => mapRenderer.hideFeatureTooltip(s),
                                mousemove: (d) => mapRenderer.updateFeatureTooltip(d),
                                click: (e) => {
                                    mapRenderer.selectFeature(feature);
                                }
                            });
                        },
                        style: (f: IFeature, m) => {
                            layer.group.markers[f.id] = m;
                            return f.effectiveStyle;
                        },
                        pointToLayer: (feature, latlng) => mapRenderer.createFeature(feature)
                    });
                } else {
                    var v = L.geoJson([]);
                }
                service.project.features.forEach((f: IFeature) => {
                    if (f.layerId !== layer.id) return;
                    var ft = service.getFeatureType(f);
                    f.properties['Name'] = f.properties[ft.style.nameLabel];
                });

                layer.mapLayer.addLayer(v);
                layer.isLoading = false;
                var time2 = new Date().getTime();
            }
        }
    }
}
