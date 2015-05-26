module BaseMapList {
    export interface IBaseMapScope extends ng.IScope {
        vm: BaseMapListCtrl;
    }

    export class BaseMapListCtrl {
        private scope: IBaseMapScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'mapService',
            'messageBusService',
            'layerService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope             : IBaseMapScope,
            private $mapService        : csComp.Services.MapService,
            private $messageBusService : csComp.Services.MessageBusService,
            private $layerService      : csComp.Services.LayerService
            ) {
            $scope.vm = this;
        }

        public selectBaseLayer(key): void {
            var layer : csComp.Services.BaseLayer = this.$layerService.$mapService.getBaselayer(key);
            this.$layerService.activeMapRenderer.changeBaseLayer(layer);
            this.$layerService.$mapService.changeBaseLayer(key);
        }
    }
}
