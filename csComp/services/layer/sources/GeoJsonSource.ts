module csComp.Services {
    'use strict';

   

    export class GeoJsonSource implements ILayerSource
    {
        title = "geojson";
        layer: ProjectLayer;
     
      public constructor(public service: LayerService) {

      }

      public addLayer(layer: ProjectLayer, callback: Function) {
          this.baseAddLayer(layer, callback);
      }

      protected baseAddLayer(layer: ProjectLayer, callback: Function)
      {
          this.layer = layer;
        async.series([

            (cb) => {
                layer.layerRenderer = "svg";
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

                        (<any>(layer.data)).features.forEach((f)=>
                        {
                          this.service.initFeature(f,layer);
                        });


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

    export class DynamicGeoJsonSource extends GeoJsonSource {
        title = "dynamicgeojson";
        

        constructor(public service: LayerService) {
            super(service);
            
            // subscribe
            
        }

        private updateById(obj, key, id, value: IFeature) {
            try {
                if (obj == null)
                    return;
                var done = false;
                obj.some((o : IFeature) => {
                    if (o.properties != null && o.properties.hasOwnProperty(key) && o.properties[key] === id) {
                        o.properties = value.properties;
                        o.geometry = value.geometry;
                        this.service.calculateFeatureStyle(o);
                        this.service.activeMapRenderer.updateFeature(o);                        
                        done = true;
                        //  console.log('updating feature');
                        return true;
                    } else {
                        
                        return false;
                    }
                });
                if (!done) {
                    // console.log('adding feature');
                    obj.push(value);
                    this.service.initFeature(value, this.layer);
                    var m = this.service.activeMapRenderer.createFeature(value);
                    
                }
            } catch (e) {
                console.log('error');
            }
        }

        public addLayer(layer: ProjectLayer, callback: Function) {
            
            this.baseAddLayer(layer, callback);
            this.service.$messageBusService.serverPublish("joinlayer", { id: layer.id });
            this.service.$messageBusService.serverSubscribe("layer-" + layer.id,(topic: string, msg: any) => {                                
                switch (msg.action) {
                    case "update": 
                        msg.data.forEach((f) => {
                            this.updateById((<any>layer.data).features, "id", f.properties["id"], f); 
                        });                        
                        break;
                }
                
            });

            //this.addLayer(layer, callback);
            
        }

    }

    

  }
