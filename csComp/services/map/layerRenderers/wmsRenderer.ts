module csComp.Services {
    export class WmsRenderer {
        static render(service: LayerService, layer: ProjectLayer) {
            var wms: any = L.tileLayer.wms(layer.url, <any>{
                layers: layer.wmsLayers,
                opacity: layer.opacity / 100,
                format: 'image/png',
                transparent: true,
                attribution: layer.description,
                tiled: true
            });
            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            service.map.map.addLayer(layer.mapLayer);
            layer.mapLayer.addLayer(wms);
            wms.on('loading', (event) => {
                layer.isLoading = true;
                service.$rootScope.$apply();
                if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            });
            wms.on('load', (event) => {
                layer.isLoading = false;
                if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            });
            layer.isLoading = true;
        }
    }
}
