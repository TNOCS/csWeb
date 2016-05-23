module csComp.Services {

    export class GeoJsonSource implements ILayerSource {
        title = 'geojson';
        layer: ProjectLayer;
        requiresLayer = false;
        $http: ng.IHttpService;

        public constructor(public service: LayerService, $http: ng.IHttpService) {
            this.$http = $http;
        }

        public refreshLayer(layer: ProjectLayer) {
            var isEnabled = layer.enabled;
            this.service.removeLayer(layer);
            this.service.addLayer(layer);
            layer.enabled = isEnabled;
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void, data = null) {
            this.baseAddLayer(layer, callback, data);
        }

        /** zoom to boundaries of layer */
        public fitMap(layer: ProjectLayer) {
            var b = Helpers.GeoExtensions.getBoundingBox(layer.data);
            this.service.$messageBusService.publish('map', 'setextent', b);
        }

        /** zoom to boundaries of layer */
        public fitTimeline(layer: ProjectLayer) {
            if (layer.hasSensorData && layer.timestamps && layer.timestamps.length > 0) {
                var min = layer.timestamps[0];
                var max = layer.timestamps[layer.timestamps.length - 1];
                this.service.$messageBusService.publish('timeline', 'updateTimerange', { start: min, end: max });
            }
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            var result: [[string, Function]] = [
                ['Fit map', (($itemScope) => this.fitMap(layer))]];
            if (layer.hasSensorData && layer.timestamps) result.push(['Fit time', (($itemScope) => this.fitTimeline(layer))]);
            result.push(null);
            result.push(['Refresh', (($itemScope) => this.refreshLayer(layer))]);
            return result;
        }

        protected baseAddLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void, data = null) {
            this.layer = layer;
            async.series([
                (cb) => {
                    layer.renderType = 'geojson';
                    // already got data (propably from drop action)
                    if (data) {
                        layer.enabled = true;
                        this.initLayer(data, layer);
                        cb(null, null);
                    } else if (!layer.url && layer.data && layer.data.type) {
                        if (!layer.count) layer.count = 0;
                        layer.enabled = true;
                        layer.isLoading = false;
                        layer.isConnected = false;
                        this.initLayer(layer.data, layer);
                        cb(null, null);
                    } else {
                        // Open a layer URL
                        layer.isLoading = true;
                        // get data
                        var u = layer.url.replace('[BBOX]', layer.BBOX);
                        // check proxy
                        if (layer.useProxy) u = '/api/proxy?url=' + u;

                        this.$http.get(u)
                            .success((data) => {
                                layer.count = 0;
                                layer.isLoading = false;
                                layer.enabled = true;
                                this.initLayer(data, layer);
                                if (layer.hasSensorData) this.fitTimeline(layer);
                                cb(null, null);
                            })
                            .error(() => {
                                layer.count = 0;
                                layer.isLoading = false;
                                layer.enabled = false;
                                layer.isConnected = false;
                                this.service.$messageBusService.notify('ERROR loading ' + layer.title, '\nwhile loading: ' + u);
                                this.service.$messageBusService.publish('layer', 'error', layer);
                                cb(null, null);
                            });
                    }
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
                });
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
            if (!_.isUndefined(layer.data)) {
                if (layer.data.geometries && !layer.data.features) {
                    layer.data.features = layer.data.geometries;
                }

                if (!_.isUndefined(layer.data.features)) {
                    layer.data.features.forEach((f) => {
                        this.service.initFeature(f, layer, false, false);
                    });
                    if (data.features.length > 0) {
                        var firstFeature = data.features[0];
                        var resource = this.service.findResourceByFeature(firstFeature);
                        csComp.Helpers.addPropertyTypes(firstFeature, firstFeature.fType, resource);
                    }
                }
            }

            layer.isTransparent = false;
            // Subscribe to zoom events
            if (layer.minZoom || layer.maxZoom) {
                if (!layer.minZoom) layer.minZoom = 0;
                if (!layer.maxZoom) layer.maxZoom = 25;
                layer.zoomHandle = this.service.$messageBusService.subscribe('map', (topic, level) => {
                    if (!topic || !level || topic !== 'zoom' || level < 0) return;
                    if ((level < layer.minZoom || level > layer.maxZoom)) {
                        if (!layer.isTransparent) {
                            layer.isTransparent = true;
                            this.service.updateLayerFeatures(layer);
                        }
                    } else {
                        if (layer.isTransparent) {
                            layer.isTransparent = false;
                            this.service.updateLayerFeatures(layer);
                        }
                    }
                });
            }


            if (layer.timeAware) this.service.$messageBusService.publish('timeline', 'updateFeatures');
        }

        removeLayer(layer: ProjectLayer) {
            layer.isTransparent = false;
            if (layer.zoomHandle) this.service.$messageBusService.unsubscribe(layer.zoomHandle);
            //Reset the default zoom when deactivating a layer with the parameter 'fitToMap' set to true.
            // if (layer.fitToMap) {
            //     if (!this.service.project.viewBounds) return;
            //     this.service.$messageBusService.publish('map', 'setextent', this.service.project.viewBounds);
            // }
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
                            duration: csComp.Helpers.convertPropertyInfo({ type: 'duration' }, (+leg.duration) * 1000)
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

    export class EditableGeoJsonSource extends GeoJsonSource {
        title = 'editablegeojson';

        constructor(public service: LayerService, $http: ng.IHttpService) {
            super(service, $http);
            // subscribe
        }

        public updateFeatureByProperty(key, id, value: IFeature, layer: ProjectLayer = null) {
            var configSettings = {};
            if (layer.id === 'newsfeed') {
                configSettings = { titleKey: 'Name', descriptionKey: 'news_title', dateKey: 'news_date' };
            };
            try {
                var features = (<any>layer.data).features;
                if (features == null)
                    return;
                var done = false;
                features.some((f: IFeature) => {
                    if (f.hasOwnProperty(key) && f[key] === id) {
                        f.properties = value.properties;
                        f.geometry = value.geometry;                        
                        this.service.updateFeature(f);
                        done = true;
                        if (this.service.project.eventTab) {
                            this.service.$messageBusService.publish('eventtab', 'updated', { feature: f, config: configSettings });
                        } else {
                            if (layer.showFeatureNotifications) this.service.$messageBusService.notify(layer.title, f.properties['Name'] + ' updated');
                        }
                        //  console.log('updating feature');
                        return true;
                    } else {
                        return false;
                    }
                });
                if (!done) {
                    // console.log('adding feature');
                    if (layer && layer.data && layer.data.features) {
                        layer.data.features.push(value);
                        this.service.initFeature(value, layer, false);
                        var m = this.service.activeMapRenderer.addFeature(value);
                        if (this.service.project.eventTab) {
                            this.service.$messageBusService.publish('eventtab', 'added', { feature: value, config: configSettings });
                        } else {
                            if (layer.showFeatureNotifications) this.service.$messageBusService.notify(layer.title, value.properties['Name'] + ' added');
                        }
                    } else {
                        features.push(value);
                        this.service.initFeature(value, layer);
                        var m = this.service.activeMapRenderer.addFeature(value);
                        if (this.service.project.eventTab) {
                            this.service.$messageBusService.publish('eventtab', 'added', { feature: value, config: configSettings });
                        } else {
                            if (layer.showFeatureNotifications) this.service.$messageBusService.notify(layer.title, value.properties['Name'] + ' added');
                        }
                    }
                }
            } catch (e) {
                console.log('error');
            }
        }

        public deleteFeatureByProperty(key, id, value: IFeature, layer: ProjectLayer) {
            try {
                var feature = this.service.findFeature(layer, id);
                if (feature) {
                    if (layer.showFeatureNotifications) this.service.$messageBusService.notify(layer.title, feature.properties['Name'] + ' removed');
                    this.service.removeFeature(feature, false);
                }
            } catch (e) {
                console.log('error');
            }
        }




        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void, data = null) {
            layer.isEditable = true;
            this.baseAddLayer(layer, (layer: ProjectLayer) => {
                callback(layer);

            }, data);
        }

        removeLayer(layer: ProjectLayer) {
            layer.isConnected = false;
            if (layer._gui['editing']) this.service.stopEditingLayer(layer);
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            var result: [[string, Function]] = [
                ['Fit map', (($itemScope) => this.fitMap(layer))]];
            if (layer.hasSensorData && layer.timestamps) result.push(['Fit time', (($itemScope) => this.fitTimeline(layer))]);
            result.push(null);
            result.push(['Refresh', (($itemScope) => this.refreshLayer(layer))]);
            return result;
        }

        /** enable edit mode for @layer and disable it for the others */
        public startEditing(layer: csComp.Services.ProjectLayer) {
            this.service.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                var v = false;
                g.layers.forEach((l: csComp.Services.ProjectLayer) => {
                    if (l === layer) {
                        v = true;
                        l._gui['editing'] = true;
                    } else {
                        delete l._gui['editing'];
                    }
                });
                g._gui.editing = v;
            });
            this.service.editing = true;
            this.initAvailableFeatureTypesEditing(layer);
        }

        public stopEditing(layer : csComp.Services.ProjectLayer)
        {
            this.service.stopEditingLayer(layer);
        }



        /** prepare layer for editing, add featuretypes to temp. _gui object */
        public initAvailableFeatureTypesEditing(layer: csComp.Services.ProjectLayer) {
            var featureTypes = {};
            layer._gui['featureTypes'] = featureTypes;

            if (!layer || !layer.typeUrl || !this.service.typesResources.hasOwnProperty(layer.typeUrl)) return;
            for (var ft in this.service.typesResources[layer.typeUrl].featureTypes) {
                var t = this.service.typesResources[layer.typeUrl].featureTypes[ft];
                if (!t.style.drawingMode) t.style.drawingMode = 'Point';                
                featureTypes[ft] = this.service.typesResources[layer.typeUrl].featureTypes[ft];
                featureTypes[ft].u = csComp.Helpers.getImageUri(ft);
                featureTypes[ft]._guid = csComp.Helpers.getGuid();
                
            }
        }

    }

    export class DynamicGeoJsonSource extends EditableGeoJsonSource {
        title: "dynamicgeojson";
        connection: Connection;

        constructor(public service: LayerService, $http: ng.IHttpService) {
            super(service, $http);
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void, data = null) {
            layer.isDynamic = true;
            super.addLayer(layer, callback, data);
            if (layer.enabled) {
                this.initSubscriptions(layer);
            }
        }

        removeLayer(layer: ProjectLayer) {
            super.removeLayer(layer);
            this.service.$messageBusService.serverUnsubscribe(layer.serverHandle);
        }

        public initSubscriptions(layer: ProjectLayer) {
            layer.serverHandle = this.service.$messageBusService.serverSubscribe(layer.id, 'layer', (topic: string, msg: ClientMessage) => {
                console.log('action:' + msg.action);
                switch (msg.action) {
                    case 'unsubscribed':
                        this.service.$rootScope.$apply(() => {
                            layer.isConnected = false;
                        });
                        break;
                    case 'subscribed':
                        layer.isConnected = true;
                        //console.log('sucesfully subscribed');
                        break;
                    case 'msg':
                        var d = msg.data;
                        if (d.hasOwnProperty('message')) {
                            this.service.$messageBusService.notify(layer.title, d.message);
                        }
                        break;
                    case 'layer':
                        if (msg.data != null) {
                            try {
                                var lu = <LayerUpdate>msg.data;
                                switch (lu.action) {
                                    case LayerUpdateAction.updateLog:
                                        // find feature
                                        var fId = lu.featureId;
                                        var logs: { [key: string]: Log[] } = lu.item;
                                        var ff = <IFeature[]>(<any>layer.data).features;
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
                                        break;
                                    case LayerUpdateAction.updateFeature:
                                        var f = <Feature>lu.item;
                                        if (layer.id === lu.layerId) {
                                            this.service.$rootScope.$apply(() => {
                                                this.updateFeatureByProperty('id', f.id, f, layer);
                                            });
                                        }
                                        break;
                                    case LayerUpdateAction.addUpdateFeatureBatch:
                                        var fChanges: IChangeEvent[] = lu.item;
                                        if (layer.id === lu.layerId && fChanges && fChanges.length > 0) {
                                            this.service.$rootScope.$apply(() => {
                                                fChanges.forEach((fc) => {
                                                    switch (fc.type) {
                                                        case ChangeType.Create:
                                                        case ChangeType.Update:
                                                            this.updateFeatureByProperty('id', fc.id, <Feature>fc.value, layer);
                                                            break;
                                                        case ChangeType.Delete:
                                                            this.deleteFeatureByProperty('id', fc.id, <Feature>fc.value, layer);
                                                            break;
                                                    }
                                                })
                                            });
                                        }
                                        break;
                                    case LayerUpdateAction.deleteFeature:
                                        var feature = this.service.findFeature(layer, lu.featureId);
                                        if (feature) {
                                            if (layer.showFeatureNotifications) this.service.$messageBusService.notify(layer.title, feature.properties['Name'] + ' removed');
                                            this.service.removeFeature(feature, false);
                                        }

                                        // lu.featureId
                                        // lu.object.forEach((f) => {
                                        //
                                        //     //this.service.removeFeature(f);
                                        // });
                                        break;
                                }
                            } catch (e) {
                                console.warn('Error updating feature: ' + JSON.stringify(e, null, 2));
                            }
                            this.service.$messageBusService.publish('layer', 'updated', layer);
                        }
                        break;

                }
            });
        }
    }

    export interface IOtpLeg {
        mode: string;
        start: string;
        arrive: string;
        duration: string;
        route?: string;
        routeName?: string;
        agency?: string;
    }

    export class EsriJsonSource extends GeoJsonSource {
        title = 'esrijson';
        connection: Connection;
        $http: ng.IHttpService;

        constructor(public service: LayerService, $http: ng.IHttpService) {
            super(service, $http);
            // subscribe
        }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            layer.renderType = 'geojson';
            // Open a layer URL

            layer.isLoading = true;
            var url = (layer.useProxy) ? '/api/proxy' : layer.url;
            this.$http({
                url: url,
                method: 'GET',
                params: { url: layer.url }
            }).success((data: any) => {
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                var s = new esriJsonConverter.esriJsonConverter();
                var geojson = s.toGeoJson(data);

                layer.data = geojson; //csComp.Helpers.GeoExtensions.createFeatureCollection(features);

                if (layer.data.geometries && !layer.data.features) {
                    layer.data.features = layer.data.geometries;
                }
                if (layer.dataSourceParameters && layer.dataSourceParameters['convertFromRD']) {
                    csComp.Helpers.GeoExtensions.convertRDFeaturesToWGS84(layer.data.features);
                }
                layer.data.features.forEach((f) => {
                    this.service.initFeature(f, layer, false, false);
                });
                if (layer.timeAware) this.service.$messageBusService.publish('timeline', 'updateFeatures');
            }).error((e) => {
                console.log('EsriJsonSource called $HTTP with errors: ' + e);
            }).finally(() => {
                layer.isLoading = false;
                callback(layer);
            });
        }
    }
}
