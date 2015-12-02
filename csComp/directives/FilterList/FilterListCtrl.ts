module FilterList {
    export interface IFilterListScope extends ng.IScope {
        vm: FilterListCtrl;
    }

    export class FilterListCtrl {
        private scope: IFilterListScope;
        public noFilters: boolean;
        public locationFilterActive: boolean;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IFilterListScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            this.noFilters = true;
            this.locationFilterActive = false;
            this.$messageBus.subscribe("filters", (action: string) => {
                console.log('update filters');
                this.noFilters = true;
                this.locationFilterActive = false;
                this.$layerService.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                    if (g.filters.length > 0 && this.noFilters) this.noFilters = false;
                    g.filters.forEach((f: csComp.Services.GroupFilter) => {
                        if (f.filterType === 'location' && this.locationFilterActive === false) this.locationFilterActive = true;
                    });
                });
            });
        }

        private setLocationFilter(group){
            if (!this.locationFilterActive) {
                this.$layerService.setLocationFilter(group);
            }
        }
    }
}
