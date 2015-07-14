module csComp.Services {
    export class RssDataSource extends csComp.Services.GeoJsonSource {
        title = "RSS datasource";

        constructor(public service: csComp.Services.LayerService) {
            super(service);
        }

        public addLayer(layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void) {
            this.layer = layer;
            layer.type = 'geojson';
            // Open a layer URL
            layer.isLoading = true;
            layer.count = 0;

            $.getJSON('/api/rss', {
                url: layer.url
            }, (data, textStatus) => {
                    layer.data = data;//csComp.Helpers.GeoExtensions.createFeatureCollection(features);

                    if (layer.data.geometries && !layer.data.features) {
                        layer.data.features = layer.data.geometries;
                    }
                    layer.data.features.forEach((f) => {
                        this.service.initFeature(f, layer);
                    });

                    layer.isLoading = false;
                    callback(layer);
                });
        }
    }
}
