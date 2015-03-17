module csComp.Services {
    'use strict';

    export class GeoJsonSource implements ILayerSource
    {
      title = "geojson";
      service : LayerService;

      public init(service : LayerService){
        this.service = service;
      }

      public addLayer(layer : ProjectLayer, callback : Function)
      {
        async.series([

            (cb) => {
                // Open a layer URL
                layer.isLoading = true;
                // get data
                d3.json(layer.url, (error, data) => {
                  layer.isLoading = false;
                    // check if loaded correctly
                    if (error)
                        this.service.$messageBusService.notify('ERROR loading' + layer.title, error);
                    else {

                        // if this is a topojson layer, convert to geojson first
                        if (layer.type.toLowerCase() === 'topojson')
                        {
                            data = csComp.Helpers.convertTopoToGeoJson(data);
                        }


                        // check if there are events definined
                        if (data.events && this.service.timeline) {
                            layer.events = data.events;
                            var devents = [];
                            layer.events.forEach((e: Event) => {
                                if (!e.id) e.id = Helpers.getGuid();
                                devents.push({
                                    'start': new Date(e.start),
                                    'content': e.title
                                });
                            });
                            this.service.timeline.draw(devents);
                        }

                        // add featuretypes to global featuretype list
                        if (data.featureTypes) for (var featureTypeName in data.featureTypes) {
                            if (!data.featureTypes.hasOwnProperty(featureTypeName)) continue;
                            var featureType: IFeatureType = data.featureTypes[featureTypeName];

                            // give it a unique name
                            featureTypeName = layer.id + '_' + featureTypeName;
                            this.service.featureTypes[featureTypeName] = featureType;

                            //var pt = "." + featureTypeName;
                            //var icon = featureType.style.iconUri;
                            // var t = '{".style' + featureTypeName + '":';
                            // if (featureType.style.iconUri != null) {
                            //     t += ' { "background": "url(' + featureType.style.iconUri + ') no-repeat right center",';
                            // };
                            // t += ' "background-size": "100% 100%","border-style": "none"} }';
                            // var json = $.parseJSON(t);
                            // (<any>$).injectCSS(json);

                            //console.log(JSON.stringify(poiType, null, 2));
                        }

                        if (data.timestamps) layer.timestamps = data.timestamps;

                        // store raw result in layer
                        layer.data = data;


                  }


                    cb(null, null);

                });
            },
            // Callback
            () => {
              callback(layer);
            }
        ]);
      }

      removeLayer(layer : ProjectLayer)
      {
        //alert('remove layer');
      }

    }

  }
