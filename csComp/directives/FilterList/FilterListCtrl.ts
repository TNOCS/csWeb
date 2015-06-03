module FilterList {
  export interface IFilterListScope extends ng.IScope {
    vm: FilterListCtrl;
  }

  export class FilterListCtrl {
    private scope: IFilterListScope;
    public noFilters: boolean;

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
      this.$messageBus.subscribe("filters", (action: string) => {
        console.log('update filters');
        this.noFilters = !this.$layerService.project.groups.some((g: csComp.Services.ProjectGroup) => g.filters.length > 0);
      });
    }

  }
}
