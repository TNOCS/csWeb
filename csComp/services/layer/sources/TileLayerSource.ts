module csComp.Services {
    'use strict';

    declare var L;
    
    export class TileLayerSource implements ILayerSource
    {


      title = "tilelayer";
      //service : LayerService;
      requiresLayer = false;
      constructor(public service: LayerService) {

      }

      public refreshLayer(layer: ProjectLayer) {
      }

      public addLayer(layer : ProjectLayer, callback : Function) {
          layer.layerRenderer = "tilelayer";
          callback(layer);
          //this.$rootScope.$apply();
      }

      removeLayer(layer : ProjectLayer)
      {

      }

    }

  }
