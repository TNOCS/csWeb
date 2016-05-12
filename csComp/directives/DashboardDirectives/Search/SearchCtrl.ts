module Search {
    declare var interact;

    export interface ISearchScope extends ng.IScope {
        vm: SearchCtrl;
        // search visible
        sv: boolean;

    }

    export interface IWidgetScope extends ng.IScope {
        data: any;
    }

    export class SearchCtrl {
        private scope: ISearchScope;
        private project: csComp.Services.Project;
        private query; string;

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
            '$templateCache',
            '$timeout'
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

            $scope.$watch('vm.query', _.throttle(search => {
                this.$dashboardService.search = { query: search };
            }, 700, { leading: false }));

            this.$messageBusService.subscribe('search', (title, search: csComp.Services.ISearch) => {
                switch (title) {
                    case 'reset':
                        this.closeSearch();
                        break;
                }
            });
        }

        startSearch() {
            if (this.$scope.sv) {
                setTimeout(() => {
                    $('#searchInput').focus();
                }, 100);
            }
        }

        closeSearch() {
            this.$timeout(() => {
                $('#searchInput').val('');
                this.$scope.sv = false;
            }, 0);
        }
    }
}
