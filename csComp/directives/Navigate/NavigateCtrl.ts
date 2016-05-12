module Navigate {
    export interface INavigateScope extends ng.IScope {
        vm: NavigateCtrl;
        search: string;
    }

    export class RecentFeature {
        public id: string;
        public name: string;
        public layerId: string;
        public feature: csComp.Services.IFeature;
    }

    export class NavigateCtrl {
        private scope: INavigateScope;
        /** The layer that holds the search results. */
        private searchResultLayer: csComp.Services.ProjectLayer;
        /** The group that holds the search results layer. */
        private searchResultGroup: csComp.Services.ProjectGroup;

        public RecentLayers: csComp.Services.ProjectLayer[] = [];
        public mobileLayers: csComp.Services.ProjectLayer[] = [];
        public mobileLayer: csComp.Services.ProjectLayer;
        public RecentFeatures: RecentFeature[] = [];
        public UserName: string;
        public MyFeature: csComp.Services.Feature;
        private lastPost = { longitude: 0, latitude: 0 };
        public searchResults: csComp.Services.ISearchResultItem[] = [];

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService',
            'localStorageService',
            'dashboardService',
            'geoService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: INavigateScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private localStorageService: ng.localStorage.ILocalStorageService,
            private $dashboardService: csComp.Services.DashboardService,
            private geoService: csComp.Services.GeoService
        ) {
            $scope.vm = this;

            this.$messageBus.subscribe('project', (a, p) => {
                if (a === 'loaded') {
                    this.createSearchResultLayer();
                    this.initRecentLayers();
                    this.initRecentFeatures();
                    if (this.$layerService.isMobile) this.initMobileLayers(p);
                }
            });

            this.$messageBus.subscribe('search', (title, search: csComp.Services.ISearch) => {
                this.searchResults = [];
                switch (title) {
                    case 'update':
                        this.doSearch(search.query);
                        break;
                    case 'reset':
                        this.$dashboardService._search.isActive = false;
                        this.clearSearchLayer();
                        break;
                }
            });
        }

        /** Create a new layer for the search results. Also create a group, if necessary, and a feature type for the search results. */
        private createSearchResultLayer() {
            const searchResultId = '_search';
            const searchResultGroupId = '_hidden';

            if (this.$layerService.findLayer(searchResultId)) return;
            this.searchResultGroup = this.$layerService.findGroupById(searchResultGroupId);
            if (!this.searchResultGroup) {
                this.searchResultGroup = new csComp.Services.ProjectGroup();
                this.searchResultGroup.title = searchResultGroupId;
                this.$layerService.project.groups.push(this.searchResultGroup);
                this.$layerService.initGroup(this.searchResultGroup);

                this.searchResultLayer = new csComp.Services.ProjectLayer();
                this.searchResultLayer.title = searchResultId;
                this.searchResultLayer.fitToMap = true;
                this.searchResultLayer.data = { features: [] };
                this.$layerService.initLayer(this.searchResultGroup, this.searchResultLayer);
                this.searchResultGroup.layers.push(this.searchResultLayer);

                var ft: csComp.Services.IFeatureType = <csComp.Services.IFeatureType>{};
                ft.id = searchResultId;
                ft.style = {
                    drawingMode: 'Point',
                    fillColor: '#00f',
                    opacity: 0.8,
                    //iconUri: 'bower_components/csweb/dist-bower/images/large-marker.png',
                    innerTextProperty: 'searchIndex',
                    innerTextSize: 24,
                    marker: 'pin'
                };
                this.$layerService.initFeatureType(ft, null);
                this.$layerService._featureTypes[`${this.$layerService.project.url}#${ft.id}`] = ft;
            }
        }

        /** Remove the search results from the map. */
        private clearSearchLayer() {
            if (this.searchResultLayer && this.searchResultLayer.data && this.searchResultLayer.data) {
                this.searchResultLayer.data.features.forEach(f => {
                    this.$layerService.activeMapRenderer.removeFeature(f);
                });
                this.searchResultLayer.data.features.length = 0;
            }
        }

        /**
         * Update the displayed search results on the map, basically creating a feature from each search result (that has a
         * location and isn't a feature already).
         */
        private updateSearchLayer() {
            // Clear layer
            // if (this.searchResultLayer.group) csComp.Services.GeojsonRenderer.remove(this.$layerService, this.searchResultLayer);
            this.clearSearchLayer();
            // Add results to the map
            var mark = 'A';
            var index = 0;
            this.searchResults.forEach(sr => {
                sr.searchIndex = mark;
                // if (sr.feature) return; // Is already on the map, so we don't need to add it.
                var feature = new csComp.Services.Feature();
                if (sr.feature && sr.feature.geometry) {
                    switch (sr.feature.geometry.type.toLowerCase()) {
                        case 'point':
                            feature.geometry = sr.feature.geometry;
                            break;
                        default:
                            feature.geometry = csComp.Helpers.GeoExtensions.getCentroid(sr.feature.geometry.coordinates);
                            break;
                    }
                } else {
                    feature.geometry = sr.location;
                }
                // feature.featureTypeName = '_search';
                feature.layer = this.searchResultLayer;
                feature.layerId = this.searchResultLayer.id;
                feature.index = index++;
                feature.id = csComp.Helpers.getGuid();
                feature.properties = {
                    Name: sr.title,
                    featureTypeId: '_search',
                    searchIndex: mark,
                };
                feature.fType = this.$layerService.getFeatureType(feature);
                this.$layerService.calculateFeatureStyle(feature);
                this.searchResultLayer.data.features.push(feature);
                // this.$layerService.initFeature(feature, this.searchResultLayer);
                mark = csComp.Helpers.nextChar(mark);
            });
            csComp.Services.GeojsonRenderer.render(this.$layerService, this.searchResultLayer, this.$layerService.activeMapRenderer);
            //this.fitMap(this.searchResultLayer);
        }

        /** Fit the search results, if any, to the map. */
        private fitMap(layer: csComp.Services.ProjectLayer) {
            if (this.searchResults.length === 0) return;
            var bounds = {
                xMin: NaN,
                xMax: NaN,
                yMin: NaN,
                yMax: NaN,
            };
            var bbox = <csComp.Services.IBoundingBox>{};
            layer.data.features.forEach(f => {
                let b = f.geometry.coordinates;
                bounds.xMin = bounds.xMin < b[0] ? bounds.xMin : b[0];
                bounds.xMax = bounds.xMax > b[0] ? bounds.xMax : b[0];
                bounds.yMin = bounds.yMin < b[1] ? bounds.yMin : b[1];
                bounds.yMax = bounds.yMax > b[1] ? bounds.yMax : b[1];
            });
            bbox.southWest = [bounds.yMin, bounds.xMin];
            bbox.northEast = [bounds.yMax, bounds.xMax];

            // var b = csComp.Helpers.GeoExtensions.getBoundingBox(layer.data);
            if (this.searchResults.length === 1 && this.searchResults[0].location.type.toLowerCase() === 'point') {
                this.$messageBus.publish('map', 'setzoom', { loc: bbox.southWest, zoom: 16 });
            } else {
                this.$messageBus.publish('map', 'setextent', bbox);
            }
        }

        public selectSearchResult(item: csComp.Services.ISearchResultItem) {
            if (item.click) item.click(item);
        }

        private doSearch(search: string) {
            this.$layerService.actionServices.forEach(as => {
                if (!as.search) return;
                as.search(<csComp.Services.ISearchQuery>{ query: search, results: this.searchResults }, (error, result) => {
                    this.searchResults = this.searchResults.filter(sr => { return sr.service !== as.id; });
                    this.searchResults = this.searchResults.concat(result).sort((a, b) => { return ((b.score - a.score) || -1); });
                    this.updateSearchLayer();
                    if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
                });
            });
        }

        private leave(l: csComp.Services.ProjectLayer) {
            if (this.mobileLayer && this.MyFeature) {
                this.$layerService.removeFeature(this.MyFeature, true);
                this.$layerService.activeMapRenderer.removeFeature(this.MyFeature);
                //this.$layerService.saveFeature(this.MyFeature);
                this.MyFeature = null;
            }
            this.mobileLayer = null;
        }

        private join(l: csComp.Services.ProjectLayer) {
            this.localStorageService.set('username', this.UserName);
            async.series([(cb) => {
                if (!l.enabled) {
                    this.$layerService.addLayer(l, () => {
                        cb();
                    });
                } else { cb(); }
            }, (cb) => {
                this.mobileLayer = l;
                var f = new csComp.Services.Feature();
                f.layerId = this.mobileLayer.id;
                f.geometry = {
                    type: 'Point', coordinates: []
                };
                // todo disable
                f.geometry.coordinates = [this.lastPost.longitude, this.lastPost.latitude]; //[0, 0]; //loc.coords.longitude, loc.coords.latitude];
                f.id = this.UserName;
                f.properties = { 'Name': this.UserName };
                //layer.data.features.push(f);
                this.$layerService.initFeature(f, this.mobileLayer);
                this.$layerService.activeMapRenderer.addFeature(f);
                this.$layerService.saveFeature(f);
                this.MyFeature = f;
            }]);
        }

        private initMobileLayers(p: csComp.Services.Project) {
            this.UserName = this.localStorageService.get('username');
            if (!this.UserName) this.UserName = 'mobile user';
            this.mobileLayers = [];

            p.groups.forEach((g => {
                g.layers.forEach((l) => {
                    if (l.tags && l.tags.indexOf('mobile') >= 0) this.mobileLayers.push(l);
                });
            }));

            if (this.$layerService.isMobile) {
                this.$messageBus.subscribe('geo', (action, loc: csComp.Services.Geoposition) => {
                    switch (action) {
                        case 'pos':
                            if (this.mobileLayer && this.MyFeature) {
                                this.lastPost = loc.coords;
                                this.MyFeature.geometry.coordinates = [loc.coords.longitude, loc.coords.latitude];
                                this.$layerService.activeMapRenderer.updateFeature(this.MyFeature);
                                this.$layerService.saveFeature(this.MyFeature);
                            }
                            break;
                    }
                });

                this.geoService.start({});
            }
        }

        private updateRecentFeaturesList() {
            setTimeout(() => {
                var ids = this.localStorageService.get('recentfeatures');
                if (ids) {
                    this.RecentFeatures = ids;
                    this.RecentFeatures.forEach((rf: RecentFeature) => {
                        var l = this.$layerService.findLayer(rf.layerId);
                        if (l && l.enabled) {
                            rf.feature = this.$layerService.findFeature(l, rf.id);
                        }
                    });
                }
            }, 0);
        }

        private selectFeature(feature: IFeature) {
            this.$layerService.selectFeature(feature, false, true);
        }

        private initRecentFeatures() {
            this.updateRecentFeaturesList();
            this.$messageBus.subscribe('feature', (a, feature: csComp.Services.IFeature) => {
                if (a === 'onFeatureSelect') {
                    this.RecentFeatures = this.RecentFeatures.filter(f => f.id !== feature.id);
                    var rf = <RecentFeature>{ id: feature.id, name: csComp.Helpers.getFeatureTitle(feature), layerId: feature.layerId, feature: feature };
                    this.RecentFeatures.splice(0, 0, rf);
                    if (this.RecentFeatures.length > 5) this.RecentFeatures.pop();
                    var save = [];
                    this.RecentFeatures.forEach((f) => save.push(<RecentFeature>{ id: f.id, name: f.name, layerId: f.layerId }));
                    this.localStorageService.set('recentfeatures', save);
                    if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                        this.$scope.$root.$apply();
                    }
                }
            });
        }

        public toggleLayer(layer: csComp.Services.ProjectLayer) {
            this.$layerService.toggleLayer(layer);
        }

        private initRecentLayers() {
            var ids = this.localStorageService.get('recentlayers');
            if (ids) ids.forEach(id => {
                var l = this.$layerService.findLayer(id);
                if (l) this.RecentLayers.push(l);
            });

            this.$messageBus.subscribe('layer', (a, layer: csComp.Services.ProjectLayer) => {
                if (a === 'activated') {
                    this.RecentLayers = this.RecentLayers.filter(f => f.id !== layer.id);
                    this.RecentLayers.splice(0, 0, layer);
                    if (this.RecentLayers.length > 5) this.RecentLayers.pop();
                    ids = []; this.RecentLayers.forEach(l => ids.push(l.id));
                    this.localStorageService.set('recentlayers', ids);
                    if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                        this.$scope.$apply();
                    }
                }
                this.updateRecentFeaturesList();
            });
        }
    }
}
