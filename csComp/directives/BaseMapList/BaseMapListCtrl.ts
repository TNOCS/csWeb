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
            'layerService',
            'mapService',
            'messageBusService',
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope       : IBaseMapScope,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService : csComp.Services.MessageBusService


            ) {
            $scope.vm = this;
        }

        public selectBaseLayer(key): void {
          //this.$layerService.activeMapRenderer
          this.$messageBusService.publish("map","setbaselayer",key);
          console.log('yes select');
        }
    }
}
