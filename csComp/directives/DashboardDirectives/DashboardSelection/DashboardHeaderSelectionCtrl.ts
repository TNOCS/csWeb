module DashboarHeaderdSelection {
    export interface IDashboardHeaderSelectionScope extends ng.IScope {
        vm: any; //DashboardSelectionCtrl;
        addWidget: Function;
        title: string;
    }

    export class DashboardHeaderSelectionCtrl {
        public scope: any;
        public project: csComp.Services.SolutionProject;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'dashboardService',
            'mapService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: any,
            private $layerService: csComp.Services.LayerService,
            public $dashboardService: csComp.Services.DashboardService,
            private $mapService: csComp.Services.MapService,
            public $messageBusService: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
        }

        public childDashboards(db: csComp.Services.Dashboard): csComp.Services.Dashboard[] {
            var res = this.$layerService.project.dashboards.filter((d: csComp.Services.Dashboard) => { return (d.parents && d.parents.indexOf(db.id) > -1); });
            return res;
        }
    }
}
