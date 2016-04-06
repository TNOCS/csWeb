module Search {

    
    declare var interact;

    export interface ISearchScope extends ng.IScope {
        vm: SearchCtrl;
       
    }

    export interface IWidgetScope extends ng.IScope {
        data: any;
    }

    export class SearchCtrl {
        private scope: ISearchScope;
        private project: csComp.Services.Project;

        //public dashboard: csComp.Services.Dashboard;

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$compile',
            'layerService',
            'mapService',
            'messageBusService',
            'dashboardService',
            '$templateCache', '$timeout'
        ];


        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ISearchScope,
            private $compile: any,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService,
            private $templateCache: any,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

           
           
        }
        
    }
}
