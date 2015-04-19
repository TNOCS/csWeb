module csComp.Services {
    'use strict';

    export class GeoJsonSource implements ILayerSource {
        title = "geojson";
        layer: ProjectLayer;
        requiresLayer = false;

        public constructor(public service: LayerService) {

        }

        public refreshLayer(layer: ProjectLayer) {
          this.service.removeLayer(layer);
          this.service.addLayer(layer);
        }

        public addLayer(layer: ProjectLayer, callback: Function) {
            this.baseAddLayer(layer, callback);
        }

        public fitMap(layer : ProjectLayer)
        {
          var b = Helpers.GeoExtensions.getBoundingBox(this.layer.data);
          this.service.$messageBusService.publish("map","setextent",b);
        }

        public layerMenuOptions(layer : ProjectLayer) : [[string,Function]]
        {
          return [
            ["Fit map", (($itemScope)=> this.fitMap(layer))],
            null,
            ['Refresh', (($itemScope)=> this.refreshLayer(layer))]
          ];
        }

        protected baseAddLayer(layer: ProjectLayer, callback: Function) {
            this.layer = layer;
            async.series([
                (cb) => {
                    layer.layerRenderer = "svg";
                    // Open a layer URL
                    layer.isLoading = true;
                    // get data
                    d3.json(layer.url,(error, data) => {
                        layer.count = 0;
                        layer.isLoading = false;
                        // check if loaded correctly
                        if (error)
                            this.service.$messageBusService.notify('ERROR loading ' + layer.title, error);
                        else {
                            // if this is a topojson layer, convert to geojson first
                            if (layer.type.toLowerCase() === 'topojson') {
                                data = csComp.Helpers.GeoExtensions.convertTopoToGeoJson(data);
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
                            }

                            if (data.timestamps) layer.timestamps = data.timestamps;

                            // store raw result in layer
                            layer.data = <any>data;
                            if (layer.data.geometries && !layer.data.features) {
                                layer.data.features = layer.data.geometries;
                            }
                            layer.data.features.forEach((f) => {
                                this.service.initFeature(f, layer);
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

        removeLayer(layer: ProjectLayer) {
            //alert('remove layer');
        }

    }

    export class DynamicGeoJsonSource extends GeoJsonSource {
        title = "dynamicgeojson";
        connection: Connection;

        constructor(public service: LayerService) {
            super(service);


            // subscribe

        }



        private updateFeatureByProperty(key, id, value: IFeature) {
            try {
                var features = (<any>this.layer.data).features;
                if (features == null)
                    return;
                var done = false;
                features.some((f: IFeature) => {
                    if (f.properties != null && f.properties.hasOwnProperty(key) && f.properties[key] === id) {
                        f.properties = value.properties;
                        f.geometry = value.geometry;
                        this.service.calculateFeatureStyle(f);
                        this.service.activeMapRenderer.updateFeature(f);
                        done = true;
                        //  console.log('updating feature');
                        return true;
                    } else {
                        return false;
                    }
                });
                if (!done) {
                    // console.log('adding feature');
                    features.push(value);

                    this.service.initFeature(value, this.layer);
                    var m = this.service.activeMapRenderer.addFeature(value);

                }
            } catch (e) {
                console.log('error');
            }
        }

        private deleteFeatureByProperty(key, id, value: IFeature) {
            try {
                var features = <IFeature[]>(<any>this.layer.data).features;

                //features = features.splice(

                if (features == null)
                    return;
                var done = false;

                features.some((f: IFeature) => {
                    if (f.properties != null && f.properties.hasOwnProperty(key) && f.properties[key] === id) {
                        f.properties = value.properties;
                        f.geometry = value.geometry;
                        this.service.calculateFeatureStyle(f);
                        this.service.activeMapRenderer.updateFeature(f);
                        done = true;
                        //  console.log('updating feature');
                        return true;
                    } else {
                        return false;
                    }
                });
                if (!done) {
                    // console.log('adding feature');
                    features.push(value);
                    this.service.initFeature(value, this.layer);
                    var m = this.service.activeMapRenderer.createFeature(value);

                }
            } catch (e) {
                console.log('error');
            }
        }

        public initSubscriptions(layer: ProjectLayer) {
            this.service.$messageBusService.serverPublish("joinlayer", { id: layer.id });
        }

        public addLayer(layer: ProjectLayer, callback: Function) {
            this.baseAddLayer(layer, callback);
            this.initSubscriptions(layer);
            this.service.$messageBusService.serverSubscribe("layer-" + layer.id,(topic: string, msg: any) => {
                switch (msg.action) {
                    case "update":
                        msg.data.forEach((f) => {
                            this.updateFeatureByProperty("id", f.properties["id"], f);
                        });
                        break;
                    case "delete":
                        msg.data.forEach((f) => {
                            //this.service.removeFeature(f);
                        });
                        break;
                }
            });
            this.connection = this.service.$messageBusService.getConnection("");
            //this.connection.events.add((status: string) => this.connectionEvent);
        }

        connectionEvent(status: string) {
            console.log("connected event");
            switch (status) {
                case "connected":
                    console.log('connected');
                    this.initSubscriptions(this.layer);
                    break;
            }
        }

        removeLayer(layer: ProjectLayer) {
            console.log('removing connection event');
            this.connection.events.remove((status: string) => this.connectionEvent);
        }

        public layerMenuOptions(layer : ProjectLayer) : [[string,Function]]
        {
          return [
            ["Fit map", (($itemScope)=> this.fitMap(layer))],
            null

          ];
        }
    }
}
