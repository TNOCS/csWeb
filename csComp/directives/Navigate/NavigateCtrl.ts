module Navigate {
    export interface INavigateScope extends ng.IScope {
        vm: NavigateCtrl;
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
        public RecentFeatures: RecentFeature[] = [];

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService', 'localStorageService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: INavigateScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private localStorageService: ng.localStorage.ILocalStorageService
            ) {
            $scope.vm = this;

            this.$messageBus.subscribe('project', (a, p) => {
                if (a === 'loaded') {
                    this.initRecentLayers();
                    this.initRecentFeatures();
                }
            });
        }

        private updateRecentFeaturesList() {
            setTimeout(() => {
                var ids = this.localStorageService.get("recentfeatures");
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

        private initRecentFeatures() {
            this.updateRecentFeaturesList();
            this.$messageBus.subscribe('feature', (a, feature: csComp.Services.IFeature) => {
                if (a === 'onFeatureSelect') {
                    this.RecentFeatures = this.RecentFeatures.filter(f=> f.id != feature.id);
                    var rf = <RecentFeature>{ id: feature.id, name: csComp.Helpers.getFeatureTitle(feature), layerId: feature.layerId, feature: feature };
                    this.RecentFeatures.splice(0, 0, rf);
                    if (this.RecentFeatures.length > 5) this.RecentFeatures.pop();
                    var save = [];
                    this.RecentFeatures.forEach((f) => save.push(<RecentFeature>{ id: f.id, name: f.name, layerId: f.layerId }))
                    this.localStorageService.set("recentfeatures", save);
                    if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                        this.$scope.$apply();
                    }
                }
            });
        }

        public toggleLayer(layer: csComp.Services.ProjectLayer) {
            this.$layerService.toggleLayer(layer);
        }

        private initRecentLayers() {
            var ids = this.localStorageService.get("recentlayers");
            if (ids) ids.forEach(id=> {
                var l = this.$layerService.findLayer(id);
                if (l) this.RecentLayers.push(l);
            })

            this.$messageBus.subscribe('layer', (a, layer: csComp.Services.ProjectLayer) => {
                if (a === 'activated') {
                    this.RecentLayers = this.RecentLayers.filter(f=> f.id != layer.id);
                    this.RecentLayers.splice(0, 0, layer);
                    if (this.RecentLayers.length > 5) this.RecentLayers.pop();
                    ids = []; this.RecentLayers.forEach(l=> ids.push(l.id));
                    this.localStorageService.set("recentlayers", ids);
                    if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                        this.$scope.$apply();
                    }
                }
                this.updateRecentFeaturesList();
            });
        }

    }
}
