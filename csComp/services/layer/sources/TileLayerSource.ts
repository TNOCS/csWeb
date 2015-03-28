module csComp.Services {
    'use strict';

    export class TileLayerSource implements ILayerSource
    {
      title = "tilelayer";
      service : LayerService;

      init(service : LayerService){
        this.service = service;
      }

      public addLayer(layer : ProjectLayer, callback : Function)
      {
        var tileLayer        : any = L.tileLayer(layer.url, {

            attribution: layer.description
        });
        layer.mapLayer = new L.LayerGroup<L.ILayer>();
        this.service.map.map.addLayer(layer.mapLayer);
        layer.mapLayer.addLayer(tileLayer);
        tileLayer.on('loading',  (event) => {
            layer.isLoading = true;
            this.service.$rootScope.$apply();
            if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
        });
        tileLayer.on('load', (event) => {
            layer.isLoading = false;
            if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
        });
        layer.isLoading = true;
        //this.$rootScope.$apply();
      }

      removeLayer(layer : ProjectLayer)
      {

      }

    }

  }
