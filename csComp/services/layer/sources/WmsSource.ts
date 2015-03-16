module csComp.Services {
    'use strict';

    export class WmsSource implements ILayerSource
    {
      title = "wms";
      service : LayerService;

      init(service : LayerService){
        this.service = service;
      }

      enableLayer(layer : ProjectLayer)
      {
        var wms        : any = L.tileLayer.wms(layer.url, {
            layers     : layer.wmsLayers,
            opacity    : layer.opacity/100,
            format     : 'image/png',
            transparent: true,
            attribution: layer.description
        });
        layer.mapLayer = new L.LayerGroup<L.ILayer>();
        this.service.map.map.addLayer(layer.mapLayer);
        layer.mapLayer.addLayer(wms);
        wms.on('loading',  (event) => {
            layer.isLoading = true;
            this.service.$rootScope.$apply();
            if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
        });
        wms.on('load', (event) => {
            layer.isLoading = false;
            if (this.service.$rootScope.$$phase != '$apply' && this.service.$rootScope.$$phase != '$digest') { this.service.$rootScope.$apply(); }
        });
        layer.isLoading = true;
        //this.$rootScope.$apply();
      }

      disableLayer(layer : ProjectLayer)
      {

      }

    }

  }
