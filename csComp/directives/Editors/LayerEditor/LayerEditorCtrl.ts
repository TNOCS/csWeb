module LayerEditor {

    export interface ILayerEditorScope extends ng.IScope {
        vm: LayerEditorCtrl;
    }

    export class LayerEditorCtrl {
        private scope: ILayerEditorScope;
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
            private $scope: ILayerEditorScope,
            private $http: ng.IHttpService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
        ) {
            this.scope = $scope;
            $scope.vm = this; 
            this.layer = $scope.$parent["data"];
            var ft = <csComp.Services.IFeatureType>{};
        }


    }
}
