module MapElement {
    declare var links;
    declare var Cesium;

    export interface IMapElementScope extends ng.IScope {
        vm: MapElementCtrl;
        mapid: string;
        initMap: Function;
    }

    export class MapElementCtrl {
        private scope: IMapElementScope;
        private locale = "en-us";
        public options = ["test", "boe"];

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'mapService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IMapElementScope,
            private $layerService: csComp.Services.LayerService,
            private mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
          
            this.initMap();
            

            $scope.initMap = () => this.initMap();
        }

        public initMap() {
            this.$layerService.selectRenderer("leaflet");
            //alert(this.$scope.mapId);
        }
    }
}
