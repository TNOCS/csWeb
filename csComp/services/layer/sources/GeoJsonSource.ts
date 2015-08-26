module csComp.Services {
    'use strict';



    export class GeoJsonSource implements ILayerSource {
        title = "geojson";
        layer: ProjectLayer;
        requiresLayer = false;

        public constructor(public service: LayerService) { }

        public refreshLayer(layer: ProjectLayer) {
            this.service.removeLayer(layer);
            this.service.addLayer(layer);
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.baseAddLayer(layer, callback);
        }

        /** zoom to boundaries of layer */
        public fitMap(layer: ProjectLayer) {
            var b = Helpers.GeoExtensions.getBoundingBox(this.layer.data);
            this.service.$messageBusService.publish("map", "setextent", b);
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            return [
                ["Fit map", (($itemScope) => this.fitMap(layer))],
                null,
                ['Refresh', (($itemScope) => this.refreshLayer(layer))]
            ];
        }

        protected baseAddLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.layer = layer;
            async.series([
                (cb) => {
                    layer.renderType = "geojson";
                    // Open a layer URL
                    layer.isLoading = true;
                    // get data
                    var u = layer.url.replace('[BBOX]', layer.BBOX);

                    this.service.$http.get(u).success((data, status) => {
                        layer.count = 0;
                        layer.isLoading = false;
                        layer.enabled = true;
                        // check if loaded correctly
                        // if (error) {
                        //     this.service.$messageBusService.notify('ERROR loading ' + layer.title, error + '\nwhile loading: ' + u);
                        //     this.service.$messageBusService.publish('layer', 'error', layer);
                        // } else {
                        this.initLayer(data, layer);
                        //}
                        cb(null, null);
                    }).error((data, status) => {
                        layer.isLoading = false;
                        layer.enabled = false;
                        layer.isConnected = false;
                        this.service.$messageBusService.notify('ERROR loading ' + layer.title, 'while loading: ' + u);
                        cb(null, null);
                        //     this.service.$messageBusService.publish('layer', 'error', layer);
                    });
                },
                // Callback
                () => {
                    callback(layer);
                }
            ]);
        }

        protected initLayer(data: any, layer: ProjectLayer) {
            // if this is a topojson layer, convert to geojson first
            if (layer.type.toLowerCase() === 'topojson') {
                data = csComp.Helpers.GeoExtensions.convertTopoToGeoJson(data);
            }

            if (layer.id.toLowerCase() === 'accessibility' || layer.id.toLowerCase() === 'tripplanner') {
                layer.disableMoveSelectionToFront = true;
                this.processAccessibilityReply(data, layer, (processedLayer) => {
                    data = layer.data;
                    layer = processedLayer;
                })
            }

            // add featuretypes to global featuretype list
            if (data.featureTypes) for (var featureTypeName in data.featureTypes) {
                if (!data.featureTypes.hasOwnProperty(featureTypeName)) continue;
                var featureType: IFeatureType = data.featureTypes[featureTypeName];

                // give it a unique name
                featureTypeName = layer.url + '#' + featureTypeName;
                this.service._featureTypes[featureTypeName] = featureType;
            }

            if (data.timestamps) layer.timestamps = data.timestamps;

            // store raw result in layer
            layer.data = <any>data;
            if (layer.data.geometries && !layer.data.features) {
                layer.data.features = layer.data.geometries;
            }
            layer.data.features.forEach((f) => {
                this.service.initFeature(f, layer, false, false);
            });
            this.service.$messageBusService.publish("timeline", "updateFeatures");
        }

        removeLayer(layer: ProjectLayer) {
            //alert('remove layer');
        }

        private processAccessibilityReply(data, layer, clbk) {
            if (data.hasOwnProperty('error')) {
                console.log('Error in opentripplanner: ' + data['error'].msg);
                clbk(layer);
                return;
            }
            var latlng: L.LatLng;
            var urlParameters = csComp.Helpers.parseUrlParameters(layer.url, '?', '&', '=');
            if (urlParameters.hasOwnProperty('fromPlace')) {
                var coords = urlParameters['fromPlace'].split('%2C');
                if (isNaN(+coords[0]) || isNaN(+coords[1])) clbk(layer);
                latlng = new L.LatLng(+coords[0], +coords[1]);
            }
            var parsedData = data;
            if (parsedData.hasOwnProperty('features')) { // Reply is in geoJson format
                //Add arrival times when leaving now
                var startTime = new Date(Date.now());
                parsedData.features.forEach((f) => {
                    f.properties['seconds'] = f.properties['time'];
                    f.properties['time'] = f.properties['seconds'] * 1000;
                    f.properties['arriveTime'] = (new Date(startTime.getTime() + f.properties['time'])).toISOString();
                    f.properties['latlng'] = [latlng.lat, latlng.lng];
                });
                if (layer.hasOwnProperty('data') && layer.data.hasOwnProperty('features')) {
                    for (let index = 0; index < layer.data.features.length; index++) {
                        var f = layer.data.features[index];
                        if (f.properties.hasOwnProperty('latlng') && f.properties['latlng'][0] === latlng.lat && f.properties['latlng'][1] === latlng.lng) {
                            layer.data.features.splice(index--, 1);
                        }
                    }
                    parsedData.features.forEach((f) => {
                        layer.data.features.push(f);
                    });
                } else {
                    layer.count = 0;
                    layer.data = parsedData;
                }
            } else { // Reply is in routeplanner format
                var fromLoc = parsedData.plan.from;
                var toLoc = parsedData.plan.to;
                layer.data = {};
                layer.data.type = 'FeatureCollection';
                layer.data.features = [];
                parsedData.plan.itineraries.forEach((it) => {
                    var route = new L.Polyline([]);
                    var legs: IOtpLeg[] = [];
                    var transfers = -1;
                    it.legs.forEach((leg) => {
                        var polyLeg: L.Polyline = L.Polyline.fromEncoded(leg.legGeometry.points);
                        polyLeg.getLatLngs().forEach((ll) => {
                            route.addLatLng(ll);
                        });
                        var legDetails: IOtpLeg = {
                            mode: leg.mode,
                            start: new Date(leg.startTime).toISOString(),
                            arrive: new Date(leg.endTime).toISOString(),
                            duration: csComp.Helpers.convertPropertyInfo({ type: "duration" }, (+leg.duration) * 1000)
                        };
                        (leg.agencyName) ? legDetails.agency = leg.agencyName : null;
                        (leg.routeShortName) ? legDetails.route = leg.routeShortName : null;
                        (leg.routeLongName) ? legDetails.routeName = leg.routeLongName : null;
                        if (leg.mode !== 'WALK' && leg.mode !== 'BICYCLE') transfers = transfers + 1;
                        legs.push(legDetails);
                    });
                    var geoRoute = route.toGeoJSON();
                    layer.data.features.push(csComp.Helpers.GeoExtensions.createLineFeature(geoRoute.geometry.coordinates,
                        {
                            fromLoc: fromLoc.name,
                            toLoc: toLoc.name,
                            duration: (+it.duration) * 1000,
                            startTime: new Date(it.startTime).toISOString(),
                            arriveTime: new Date(it.endTime).toISOString(),
                            legs: legs,
                            transfers: (transfers >= 0) ? transfers : 0
                        }));
                });
            }
            clbk(layer);
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
                    if (f.hasOwnProperty(key) && f[key] === id) {
                        f.properties = value.properties;
                        f.geometry = value.geometry;
                        this.service.calculateFeatureStyle(f);
                        this.service.updateFeature(f);
                        done = true;
                        this.service.$messageBusService.notify(this.layer.title, value.properties['Name'] + " updated");
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
                    this.service.$messageBusService.notify(this.layer.title, value.properties['Name'] + " added");
                }
            } catch (e) {
                console.log('error');
            }
        }

        private deleteFeatureByProperty(key, id, value: IFeature) {
            try {
                var features = <IFeature[]>(<any>this.layer.data).features;

                if (features == null) return;
                var done = false;

                features.some((f: IFeature) => {
                    if (f.properties != null && f.properties.hasOwnProperty(key) && f.properties[key] === id) {
                        f.properties = value.properties;
                        f.geometry = value.geometry;
                        this.service.calculateFeatureStyle(f);
                        this.service.updateFeature(f);
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
            layer.serverHandle = this.service.$messageBusService.serverSubscribe(layer.id, "layer", (topic: string, msg: ClientMessage) => {
                console.log("action:" + msg.action);
                switch (msg.action) {
                    case "unsubscribed":
                        this.service.$rootScope.$apply(() => {
                            layer.isConnected = false;
                        });
                        break;
                    case "subscribed":
                        layer.isConnected = true;
                        //console.log('sucesfully subscribed');
                        break;
                    case "layer":
                        if (msg.data != null) {
                            try {
                                var lu = <LayerUpdate>msg.data;
                                switch (lu.action) {
                                    case LayerUpdateAction.updateLog:
                                        // find feature
                                        var fId = lu.featureId;
                                        var logs: { [key: string]: Log[] } = lu.item;
                                        var ff = <IFeature[]>(<any>this.layer.data).features;
                                        ff.forEach((f: IFeature) => {
                                            if (f.id === fId) {
                                                if (!f.logs) f.logs = {};
                                                for (var k in logs) {
                                                    if (!f.logs.hasOwnProperty(k)) f.logs[k] = [];
                                                    logs[k].forEach((li: Log) => f.logs[k].push(li));
                                                }
                                                // update logs
                                                this.service.$rootScope.$apply(() => {
                                                    this.service.updateLog(f);
                                                });
                                                return true;
                                            }
                                            return false;
                                        })
                                        break;
                                    case LayerUpdateAction.updateFeature:
                                        var f = <Feature>lu.item;

                                        this.service.$rootScope.$apply(() => {
                                            this.updateFeatureByProperty("id", f.id, f);
                                        });
                                        break;
                                    case LayerUpdateAction.deleteFeature:
                                        var feature = this.service.findFeature(layer, lu.featureId);
                                        if (feature) {
                                            this.service.$messageBusService.notify(this.layer.title, feature.properties['Name'] + " removed");
                                            this.service.removeFeature(feature, false);
                                        }

                                        lu.featureId
                                        // lu.object.forEach((f) => {
                                        //
                                        //     //this.service.removeFeature(f);
                                        // });
                                        break;
                                }



                            }
                            catch (e) {
                                console.warn('Error updating feature: ' + JSON.stringify(e, null, 2));
                            }
                        }
                        break;

                }
            });
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            layer.isDynamic = true;
            this.baseAddLayer(layer, (layer: ProjectLayer) => {
                callback(layer);
                if (layer.enabled) {
                    this.initSubscriptions(layer);
                }
            });
        }


        removeLayer(layer: ProjectLayer) {
            layer.isConnected = false;
            if (layer.gui['editing']) this.stopAddingFeatures(layer);
            this.service.$messageBusService.serverUnsubscribe(layer.serverHandle);
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            var res: [[string, Function]] = [
                ["Fit map", (($itemScope) => this.fitMap(layer))]
            ];
            if (layer.gui["editing"]) {
                res.push(["Stop editing items", (($itemScope) => this.stopAddingFeatures(layer))]);
            }
            else {
                res.push(["Add items", (($itemScope) => this.startAddingFeatures(layer))]);
            }
            return res;
        }

        public startAddingFeatures(layer: csComp.Services.ProjectLayer) {
            this.service.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                var v = false;
                g.layers.forEach((l: csComp.Services.ProjectLayer) => {
                    if (l === layer) {
                        v = true;
                        l.gui['editing'] = true;
                    }
                    else {
                        l.gui['editing'] = false;
                    }
                })
                g.gui.editing = v;
            });
            this.service.editing = true;
            this.initAvailableFeatureTypes(layer);
        }

        public initAvailableFeatureTypes(layer: csComp.Services.ProjectLayer) {
            var featureTypes = {};

            if (layer) {
                if (layer.typeUrl && this.service.typesResources.hasOwnProperty(layer.typeUrl)) {
                    for (var ft in this.service.typesResources[this.layer.typeUrl].featureTypes) {
                        var t = this.service.typesResources[this.layer.typeUrl].featureTypes[ft];
                        if (t.style.drawingMode === "Point") {
                            featureTypes[ft] = this.service.typesResources[this.layer.typeUrl].featureTypes[ft];
                            featureTypes[ft].u = csComp.Helpers.getImageUri(ft);
                        }
                    }
                }
            }
            layer.gui["featureTypes"] = featureTypes;

        }

        public stopAddingFeatures(layer: csComp.Services.ProjectLayer) {
            delete layer.gui["featureTypes"];
            this.service.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                delete g.gui['editing'];
                g.layers.forEach((l: csComp.Services.ProjectLayer) => {
                    l.gui['editing'] = false;
                })
            });
            this.service.editing = false;
        }
    }

    export interface IOtpLeg {
        mode: string,
        start: string,
        arrive: string,
        duration: string,
        route?: string,
        routeName?: string,
        agency?: string
    }

    export class EsriJsonSource extends GeoJsonSource {
        title = "esrijson";
        connection: Connection;

        constructor(public service: LayerService) {
            super(service);
            // subscribe
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            layer.renderType = "geojson";
            // Open a layer URL

            layer.isLoading = true;
            $.getJSON('/api/proxy', {
                url: layer.url
            }, (data, textStatus) => {
                    var s = new esriJsonConverter.esriJsonConverter();
                    var geojson = s.toGeoJson(JSON.parse(data));
                    console.log(geojson);

                    layer.data = geojson;//csComp.Helpers.GeoExtensions.createFeatureCollection(features);

                    if (layer.data.geometries && !layer.data.features) {
                        layer.data.features = layer.data.geometries;
                    }
                    layer.data.features.forEach((f) => {
                        this.service.initFeature(f, layer, false, false);
                    });
                    this.service.$messageBusService.publish("timeline", "updateFeatures");

                    layer.isLoading = false;
                    callback(layer);

                });

            //this.baseAddLayer(layer, callback);
        }


    }
}
