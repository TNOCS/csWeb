module csComp.Services {
    declare var toGeoJSON;

    export class KmlDataSource extends csComp.Services.GeoJsonSource {
        title = "kml";

        constructor(public service: csComp.Services.LayerService) {
            super(service);
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.layer = layer;
            layer.renderType = "geojson";
            // Open a layer URL
            layer.isLoading = true;
            // get data
            $.ajax(layer.url)
                .done((xml) => {
                    layer.count = 0;
                    layer.isLoading = false;
                    var data = toGeoJSON.kml(xml);
                    this.initLayer(data, layer);
                    callback(layer);
                })
                .fail((error) => {
                    layer.isLoading = false;
                    this.service.$messageBusService.notify('ERROR loading ' + layer.title, error);
                    this.service.$messageBusService.publish('layer', 'error', layer);
                    callback(layer);
                });

            /*async.series([
                (cb) => {
                    layer.renderType = "geojson";
                    // Open a layer URL
                    layer.isLoading = true;
                    // get data
                    //var u = layer.url.replace('[BBOX]', layer.BBOX);

                    $.ajax(layer.url)
                        .done((xml) => {
                            layer.count = 0;
                            layer.isLoading = false;
                            var data = toGeoJSON.kml(xml);
                            this.initLayer(data, layer);
                            cb(null, null);
                        })
                        .fail((error) => {
                            layer.isLoading = false;
                            this.service.$messageBusService.notify('ERROR loading ' + layer.title, error);
                            this.service.$messageBusService.publish('layer', 'error', layer);
                            cb(null, null);
                        });

                    /*var kmlLayer = omnivore.kml(layer.url)
                        .on('ready', () => {
                            layer.count = 0;
                            layer.isLoading = false;
                            this.initLayer(kmlLayer, layer);
                            cb(null, null);
                        }).
                        on('error', (error) => {
                            this.service.$messageBusService.notify('ERROR loading ' + layer.title, error);
                            this.service.$messageBusService.publish('layer', 'error', layer);
                            cb(null, null);
                        });
                },
                // Callback
                () => {
                    callback(layer);
                }
            ]);*/
        }


    }

}
