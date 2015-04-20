module csComp.Services {
    'use strict';

    export class WmsSource implements ILayerSource
    {
      title = "wms";
      requiresLayer = false;
      //service : LayerService;
	  constructor(public service: LayerService) {

      }

      public refreshLayer(layer: ProjectLayer) {
      }

      public layerMenuOptions(layer : ProjectLayer) : [[string,Function]]
      {
        return null;
      }

      public addLayer(layer : ProjectLayer, callback : Function)
      {
        var wms        : any = L.tileLayer.wms(layer.url, {
            layers     : layer.wmsLayers,
            opacity    : layer.opacity/100,
            format     : 'image/png',
            transparent: true,
            attribution: layer.description
          });
        layer.layerRenderer = "wms";
        callback(layer);
        //this.$rootScope.$apply();
      }

      removeLayer(layer : ProjectLayer)
      {

      }

    }

  }
