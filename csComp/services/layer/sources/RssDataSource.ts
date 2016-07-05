module csComp.Services {
    export class RssDataSource extends csComp.Services.GeoJsonSource {
        title = "RSS datasource";

        constructor(public service: csComp.Services.LayerService, $http: ng.IHttpService, $storage: ng.localStorage.ILocalStorageService) {
            super(service, $http, $storage);
        }

        public addLayer(layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void) {
            this.layer = layer;
            layer.type = 'geojson';

            // Open a layer URL
            layer.isLoading = true;
            layer.count = 0;

            this.$http({
                url: '/api/rss',
                method: "GET",
                params: { url: layer.url }
            }).success((data) => {
                    layer.data = data;//csComp.Helpers.GeoExtensions.createFeatureCollection(features);

                    if (layer.data.geometries && !layer.data.features) {
                        layer.data.features = layer.data.geometries;
                    }
                    layer.data.features.forEach((f) => {
                        this.service.initFeature(f, layer, false, false);
                    });
                    this.service.$messageBusService.publish("timeline", "updateFeatures");

                    layer.isLoading = false;
                    callback(layer);
            })
            .error(() => {
                console.log('RssDataSource called $HTTP with errors...');
            });
        }
    }
}
