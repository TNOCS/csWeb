module WidgetEdit {
    import IFeature          = csComp.Services.IFeature;
    import IFeatureType      = csComp.Services.IFeatureType;
    import IPropertyType     = csComp.Services.IPropertyType;
    import IPropertyTypeData = csComp.Services.IPropertyTypeData;


    export interface IWidgetEditScope extends ng.IScope {
        vm                              : WidgetEditCtrl;

    }



    export class WidgetEditCtrl {
        private scope: IWidgetEditScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'mapService',
            'layerService',
            'messageBusService',
            'dashboardService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope             : IWidgetEditScope,
            private $mapService        : csComp.Services.MapService,
            private $layerService      : csComp.Services.LayerService,
            private $messageBusService : csComp.Services.MessageBusService,
            private $dashboardService : csComp.Services.DashboardService
            ) {
            this.scope = $scope;
            $scope.vm = this;

        }

        
    }
}
