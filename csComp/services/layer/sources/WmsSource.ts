module csComp.Services {
    'use strict';

    export class WmsSource implements ILayerSource {
        title = "wms";
        requiresLayer = false;
        //service : LayerService;
        constructor(public service: LayerService) {

        }

        public refreshLayer(layer: ProjectLayer) {
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            return null;
        }

        public addLayer(layer: ProjectLayer, callback: Function, data = null) {
            var wms: any = L.tileLayer.wms(layer.url, <any>{
                layers: layer.wmsLayers,
                opacity: layer.opacity / 100,
                format: 'image/png',
                transparent: true,
                attribution: layer.description
            });
            layer.renderType = "wms";
            callback(layer);
            //this.$rootScope.$apply();
        }

        removeLayer(layer: ProjectLayer) {

        }

    }

}
