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
            'geoService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: INavigateScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private localStorageService: ng.localStorage.ILocalStorageService,
            private geoService: csComp.Services.GeoService
        ) {
            $scope.vm = this;


            this.$messageBus.subscribe('project', (a, p) => {
                if (a === 'loaded') {
                    this.initRecentLayers();
                    this.initRecentFeatures();
                    if (this.$layerService.isMobile) this.initMobileLayers(p);
                }
            });

            $scope.$watch('search', _.throttle((search) => {
                // This code will be invoked after 1 second from the last time 'id' has changed.
                if (search && search.length > 0) {
                    this.doSearch(search);
                } else {
                    this.searchResults = [];
                }
                // Code that does something based on $scope.id                
            }, 500));
        }

        public selectSearchResult(item : csComp.Services.ISearchResultItem) {
            if (item.click) item.click(item);
        }

        private doSearch(search: string) {
            this.$layerService.actionServices.forEach(as => {
                if (as.search) {
                    as.search(<csComp.Services.ISearchQuery>{ query: search, results: this.searchResults }, (error, result) => {
                        this.searchResults = this.searchResults.filter(sr => { return sr.service !== as.id; });
                        this.searchResults = this.searchResults.concat(result);
                        if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
                    });
                }
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
                        this.$scope.$apply();
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
