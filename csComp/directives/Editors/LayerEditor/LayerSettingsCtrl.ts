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
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            this.layer = $scope.$parent["data"];
            this.getTypes();
            var ft = <csComp.Services.IFeatureType>{};
        }

        public addLayer() {
        }

        public removeLayer() {
            this.$layerService.removeLayer(this.layer, true);
        }

        public addFeatureType() {
            if (this.layer.typeUrl) {
                this.$layerService.loadTypeResources(this.layer.typeUrl, this.layer.dynamicResource || false, () => {
                    if (this.$layerService.typesResources.hasOwnProperty(this.layer.typeUrl)) {
                        var r = this.$layerService.typesResources[this.layer.typeUrl];
                        var ft = <csComp.Services.IFeatureType>{};
                        var id = this.layer.typeUrl + "#" + this.layer.defaultFeatureType;
                        ft.id = this.layer.defaultFeatureType;
                        ft.name = ft.id;
                        ft.style = csComp.Helpers.getDefaultFeatureStyle(null);
                        if (!r.featureTypes.hasOwnProperty(id)) {
                            var ft = <csComp.Services.IFeatureType>{};
                            ft.id = this.layer.defaultFeatureType;
                            ft.name = ft.id;
                            ft.style = <csComp.Services.IFeatureTypeStyle>{};
                            ft.style.drawingMode = "Point"; 
                            // EV already called before.
                            //ft.style = csComp.Helpers.getDefaultFeatureStyle();
                            //if (ft.name.toLowerCase().startsWith("http://")) id = ft.name;
                            //if (csComp.Helpers.startsWith(name.toLowerCase(), "http://")) return name;
                            this.$layerService._featureTypes[id] = ft;
                            r.featureTypes[ft.id] = ft;
                        }
                    }
                });
            }
        }

        public getTypes() {
            console.log('its me babe');
            this.$http.get(this.layer.typeUrl)
                .success((response: any) => {
                    setTimeout(() => {
                        this.availabeTypes = response.featureTypes;
                        console.log(this.availabeTypes);
                    }, 0);
                })
                .error(() => { console.log('LayerEditCtl: error with $http'); });
        };
    }
}