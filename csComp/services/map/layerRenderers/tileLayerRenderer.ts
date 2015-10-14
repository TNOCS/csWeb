module csComp.Services {
    export class TileLayerRenderer {
        static render(service: LayerService, layer: ProjectLayer) {
            var u = layer.url;
            if (layer.timeDependent) {
                // convert epoch to time string parameter
                var ft = service.project.timeLine.focus;
                if (layer.timeResolution) {
                    var tr = layer.timeResolution;
                    ft = Math.floor(ft / tr) * tr;
                };
                var d = new Date(0);
                d.setUTCSeconds(ft / 1000);
                var sDate: string = d.yyyymmdd();
                var hrs = d.getHours();
                var mins = d.getMinutes();
                var secs = d.getSeconds();
                var sTime: string = Utils.twoDigitStr(hrs) +
                    Utils.twoDigitStr(mins) + Utils.twoDigitStr(secs);
                u += "&time=" + sDate + sTime;
            } else if (layer.disableCache) {
                // check if we need to create a unique url to force a refresh
                layer.cacheKey = new Date().getTime().toString();
                u += "&cache=" + layer.cacheKey;
            }

            var tileLayer: any = L.tileLayer(u, { attribution: layer.description });
            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            tileLayer.setOpacity(layer.opacity / 100);
            service.map.map.addLayer(layer.mapLayer);
            layer.mapLayer.addLayer(tileLayer);
            tileLayer.on('loading', (event) => {
                layer.isLoading = true;
                service.$rootScope.$apply();
                if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            });
            tileLayer.on('load', (event) => {
                layer.isLoading = false;
                if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            });
            layer.isLoading = true;
        }
    }
}
