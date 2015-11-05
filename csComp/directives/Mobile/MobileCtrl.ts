module Mobile {
    export interface IMobileScope extends ng.IScope {
        vm: MobileCtrl;
    }


    export class MobileCtrl {
        private scope: IMobileScope;

        private availableLayers: csComp.Services.ProjectLayer[];

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

            this.$messageBus.subscribe('project', (a, p: csComp.Services.Project) => {
                if (a === 'loaded') {
                    this.availableLayers = [];
                    p.groups.forEach((g=> {
                        g.layers.forEach((l) => {

                            if (l.tags && l.tags.indexOf('mobile') >= 0) this.availableLayers.push(l);
                        });
                    }))
                    // find mobile layer
                    console.log('available layers');
                    console.log(this.availableLayers);
                }
            });
            $messageBus.subscribe("geo", (action, loc: csComp.Services.Geoposition) => {
                switch (action) {
                    case "pos":
                        var f = new csComp.Services.Feature();
                        //f.layerId = layer.id;
                        f.geometry = {
                            type: 'Point', coordinates: []
                        };
                        f.geometry.coordinates = [loc.coords.longitude, loc.coords.latitude];
                        f.properties = { "Name": "test" };
                        //layer.data.features.push(f);
                        //this.$layerService.initFeature(f, layer);
                        this.$layerService.activeMapRenderer.addFeature(f);
                        this.$layerService.saveFeature(f);
                        break;
                }
            });


            this.geoService.start({});
        }





    }
}
