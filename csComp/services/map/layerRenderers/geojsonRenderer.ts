module csComp.Services {
    export class GeojsonRenderer {
        static render(service: LayerService, layer: ProjectLayer, mapRenderer: IMapRenderer) {
            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            service.map.map.addLayer(layer.mapLayer);
            if (!layer.data || !layer.data.features) return;

            (<any>layer.data).features.forEach((f: IFeature) => {
                var marker = mapRenderer.addFeature(f);
                if (marker) layer.group.markers[f.id] = marker;
            });
        }

        static remove(service: LayerService, layer: ProjectLayer) {
            var g = layer.group;
            //m = layer.group.vectors;
            if (g.clustering) {
                var m = g.cluster;
                service.project.features.forEach((feature: IFeature) => {
                    if (feature.layerId === layer.id) {
                        try {
                            m.removeLayer(layer.group.markers[feature.id]);
                            delete layer.group.markers[feature.id];
                        } catch (error) { }
                    }
                });
            } else {
                service.project.features.forEach((feature: IFeature) => {
                    if (feature.layerId === layer.id && layer.group.markers.hasOwnProperty(feature.id)) {
                        delete layer.group.markers[feature.id];
                    }
                });
                if (service.map.map && layer.mapLayer) {
                    try {
                        service.map.map.removeLayer(layer.mapLayer);
                    } catch (error) { }
                }
            }

        }
    }
}
