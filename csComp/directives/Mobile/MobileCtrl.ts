module Mobile {
    export interface IMobileScope extends ng.IScope {
        vm: MobileCtrl;
    }


    export class MobileCtrl {
        private scope: IMobileScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService', 'localStorageService', 'geoService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IMobileScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private localStorageService: ng.localStorage.ILocalStorageService,
            private geoService: csComp.Services.GeoService
            ) {
            $scope.vm = this;

            this.$messageBus.subscribe('project', (a, p) => {
                if (a === 'loaded') {

                }
            });
            $messageBus.subscribe("geo", (action, loc: csComp.Services.Geoposition) => {
                switch (action) {
                    case "pos":
                        if (this.$layerService.project.features.length > 0) {
                            var f = this.$layerService.project.features[0];
                            f.geometry.coordinates = [loc.coords.longitude, loc.coords.latitude];
                            this.$layerService.updateFeature(f);
                            this.$layerService.saveFeature(f);

                        };
                        //alert(loc.coords.latitude + " - " + loc.coords.longitude);
                        break;
                }
            });


            this.geoService.start({});
        }





    }
}
