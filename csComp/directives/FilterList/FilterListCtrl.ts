module FilterList {
    export interface IFilterListScope extends ng.IScope {
        vm: FilterListCtrl;
    }

    export class FilterListCtrl {
        private scope: IFilterListScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope       : IFilterListScope,
            private $layerService: csComp.Services.LayerService
            ) {
            $scope.vm = this;
            
        }

    }
}
