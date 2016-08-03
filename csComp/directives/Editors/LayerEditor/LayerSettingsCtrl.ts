module LayerSettings {

    export interface ILayerSettingsScope extends ng.IScope {
        vm: LayerSettingsCtrl;
    }

    export class LayerSettingsCtrl {
        private scope: ILayerSettingsScope;
        public layer: csComp.Services.ProjectLayer;
        public availabeTypes: { (key: string): csComp.Services.IFeatureType };

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$http',
            '$timeout',
            'mapService',
            'layerService',
            'messageBusService',
            'dashboardService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ILayerSettingsScope,
            private $http: ng.IHttpService,
            private $timeout: ng.ITimeoutService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            this.layer = $scope.$parent['data'];
            this.getTypes();
            var ft = <csComp.Services.IFeatureType>{};
        }

        // public addLayer() {
        // }

        public saveLayer() {
            this.$layerService.saveProject();
        }

        public removeLayer() {
            this.$layerService.removeLayer(this.layer, true);
        }

        public addFeatureType() {
            if (!this.layer.typeUrl) return;
            this.$layerService.loadTypeResources(this.layer.typeUrl, this.layer.dynamicResource || false, () => {
                if (this.$layerService.typesResources.hasOwnProperty(this.layer.typeUrl)) {
                    var r = this.$layerService.typesResources[this.layer.typeUrl];
                    var ft = <csComp.Services.IFeatureType>{};
                    var id = this.layer.typeUrl + '#' + this.layer.defaultFeatureType;
                    ft.id = this.layer.defaultFeatureType;
                    ft.name = ft.id;
                    ft.style = csComp.Helpers.getDefaultFeatureStyle(null);
                    if (!r.featureTypes.hasOwnProperty(id)) {
                        var ft = <csComp.Services.IFeatureType>{};
                        ft.id = this.layer.defaultFeatureType;
                        ft.name = ft.id;
                        ft.style = <csComp.Services.IFeatureTypeStyle>{};
                        ft.style.drawingMode = 'Point';
                        this.$layerService._featureTypes[id] = ft;
                        r.featureTypes[ft.id] = ft;
                    }
                }
            });
        }

        public getTypes() {
            if (!this.layer.typeUrl) return;
            this.$http.get(this.layer.typeUrl)
                .then((res: {data: any}) => {
                    let response = res.data;
                    this.$timeout(() => this.availabeTypes = response.featureTypes);
                })
                .catch(() => { console.log('LayerEditCtl.getTypes: error with $http'); });
        };
    }
}
