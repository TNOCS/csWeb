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

                    d3.json(u, (error, data) => {
                        layer.count = 0;
                        layer.isLoading = false;
                        // check if loaded correctly
                        if (error) {
                            this.service.$messageBusService.notify('ERROR loading ' + layer.title, error);
                            this.service.$messageBusService.publish('layer', 'error', layer);
                        } else {
                            // if this is a topojson layer, convert to geojson first
                            if (layer.type.toLowerCase() === 'topojson') {
                                data = csComp.Helpers.GeoExtensions.convertTopoToGeoJson(data);
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
                    if (f.hasOwnProperty(key) && f[key] === id) {
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

                if (features == null) return;
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
            layer.serverHandle = this.service.$messageBusService.serverSubscribe(layer.id, "layer", (topic: string, msg: any) => {
                console.log("action:" + msg.action);
                switch (msg.action) {
                    case "subscribed":
                        console.log('sucesfully subscribed');
                        break;
                    case "logs-update":
                        console.log('receiving feature updates');
                        if (msg.data != null) {
                            try {
                                msg.data.forEach((data: any) => {
                                    // find feature
                                    var fId = data.featureId;
                                    var logs: { [key: string]: Log[] } = data.logs;
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
                                    });

                                    // calculate active properties
                                    console.log(data);
                                })
                            }
                            catch (e) {
                                console.warn('Error updating feature: ' + JSON.stringify(e, null, 2));
                            }
                        }
                        break;
                    case "feature-update":
                        if (msg.data != null) {
                            try {
                                msg.data.forEach((f: IFeature) => {
                                    this.service.$rootScope.$apply(() => {
                                        this.updateFeatureByProperty("id", f.id, f);
                                    });
                                });
                            }
                            catch (e) {
                                console.warn('error updating feature');
                            }
                        }
                        break;
                    case "feature-delete":
                        if (msg.data != null) {
                            try {
                                msg.data.forEach((f) => {
                                    //this.service.removeFeature(f);
                                });
                            } catch (e) {
                                console.warn('error deleting feature');
                            }
                        }
                        break;
                }
            });
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            layer.isDynamic = true;
            this.baseAddLayer(layer, callback);
            this.initSubscriptions(layer);
            //this.connection = this.service.$messageBusService.getConnection("");
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
            this.service.$messageBusService.serverUnsubscribe(layer.serverHandle);
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            return [
                ["Fit map", (($itemScope) => this.fitMap(layer))], null
            ];
        }
    }

    export class AccessibilityDataSource extends GeoJsonSource {
        title = "Accessibility datasource";
        private routers;
        private isInitialized = false;

        constructor(public service: csComp.Services.LayerService) {
            super(service);
        }

        public init() {
            this.routers = {};
            if (this.service.project.otpServer && this.service.project.otpServer !== '') {
                //Get a list of OTP routers and the geographic area they cover
                $.getJSON('/api/accessibility', {
                    url: this.service.project.otpServer
                }, ((data, textStatus) => { this.initRouters(data, textStatus) }))
            }
            this.isInitialized = true;
        }

        private initRouters(data, textStatus) {
            var parsedData = JSON.parse(data.body);
            if (parsedData.hasOwnProperty('error')) {
                console.log('Error initializing routers: ' + parsedData['error'].msg);
            }
            else { // There is data
                if (parsedData.hasOwnProperty('routerInfo')) {
                    var routerInfo = parsedData['routerInfo'];
                    var initCount = 0;
                    routerInfo.forEach((ri) => {
                        if (ri.hasOwnProperty('routerId') && ri.hasOwnProperty('polygon')) {
                            var poly = new L.Polygon([]);
                            var coords = ri.polygon.coordinates;
                            coords[0].forEach((c) => {
                                poly.addLatLng(new L.LatLng(c[1], c[0]));
                            });
                            this.routers[ri.routerId] = poly;
                            initCount += 1;
                        }
                    });
                    console.log('OTP server initialized ' + initCount + '/' + routerInfo.length + ' routers');
                }
            }
        }

        public addLayer(layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void) {
            if (!this.isInitialized) this.init();
            this.layer = layer;
            layer.type = 'accessibility';
            // Open a layer URL
            layer.isLoading = true;

            // Find suitable router
            layer.url = this.chooseRouter(layer.url);

            $.getJSON('/api/accessibility', {
                url: layer.url
            }, ((data, textStatus) => { this.processReply(data, textStatus, callback) }))

        }

        private chooseRouter(url: string): string {
            var urlParameters = csComp.Helpers.parseUrlParameters(this.layer.url, '?', '&', '=');
            if (urlParameters.hasOwnProperty('fromPlace')) {
                var coords = urlParameters['fromPlace'].split('%2C');
                if (isNaN(+coords[0]) || isNaN(+coords[1])) return url;
                var latlng = new L.LatLng(+coords[0], +coords[1]);
                for (var key in this.routers) {
                    if (this.routers.hasOwnProperty(key)) {
                        var polygon: L.Polygon = this.routers[key];
                        if (polygon.getBounds().contains(latlng)) {
                            url = url.replace(this.getCurrentRouter(urlParameters['baseUrl']), key);
                        }
                    }
                }
            }
            return url;
        }

        private getCurrentRouter(base: string) {
            var splitted = base.split('/');
            var routerIndex = -1;
            splitted.some((s, index) => {
                if (s === 'routers') {
                    routerIndex = index + 1;
                    return true;
                }
                return false;
            });
            return splitted[routerIndex];
        }

        private processReply(data, textStatus, clbk) {
            var parsedData = JSON.parse(data.body);
            if (parsedData.hasOwnProperty('error')) {
                console.log('Error: ' + parsedData['error'].msg);
            }
            else { // There is data
                if (parsedData.hasOwnProperty('features')) { // Reply is in geoJson format
                    //Add arrival times when leaving now
                    var startTime = new Date(Date.now());
                    parsedData.features.forEach((f) => {
                        f.properties['time'] = f.properties['time'] * 1000;
                        f.properties['arriveTime'] = (new Date(startTime.getTime() + f.properties['time'])).toISOString();
                    });
                    if (this.layer.hasOwnProperty('data') && this.layer.data.hasOwnProperty('features')) {
                        parsedData.features.forEach((f) => {
                            this.layer.data.features.push(f);
                        });
                    } else {
                        this.layer.count = 0;
                        this.layer.data = parsedData;
                    }
                } else { // Reply is in routeplanner format
                    var fromLoc = parsedData.plan.from;
                    var toLoc = parsedData.plan.to;
                    this.layer.data = {};
                    this.layer.data.type = 'FeatureCollection';
                    this.layer.data.features = [];
                    parsedData.plan.itineraries.forEach((it) => {
                        var route = new L.Polyline([]);
                        it.legs.forEach((leg) => {
                            var polyLeg: L.Polyline = L.Polyline.fromEncoded(leg.legGeometry.points);
                            polyLeg.getLatLngs().forEach((ll) => {
                                route.addLatLng(ll);
                            });
                        });
                        var geoRoute = route.toGeoJSON();
                        this.layer.data.features.push(csComp.Helpers.GeoExtensions.createLineFeature(geoRoute.geometry.coordinates,
                            { fromLoc: fromLoc.name, toLoc: toLoc.name, duration: (+it.duration)*1000, arriveTime: new Date(it.endTime).toISOString(), startTime: new Date(it.startTime).toISOString() }));
                    });
                }
                this.layer.data.features.forEach((f: IFeature) => {
                    f.isInitialized = false;
                    this.service.initFeature(f, this.layer);
                });
            }
            this.layer.isLoading = false;
            clbk(this.layer);
        }
    }

    export class EsriJsonSource extends GeoJsonSource {
        title = "esrijson";
        connection: Connection;

        constructor(public service: LayerService) {
            super(service);
            // subscribe
        }


    }
}
