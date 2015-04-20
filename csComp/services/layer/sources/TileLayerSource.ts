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
        this.service.removeLayer(layer);
        this.service.addLayer(layer);
      }

      public layerMenuOptions(layer : ProjectLayer) : [[string,Function]]
      {
        return [        
          ['Refresh', (($itemScope)=> this.refreshLayer(layer))]
        ];
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
