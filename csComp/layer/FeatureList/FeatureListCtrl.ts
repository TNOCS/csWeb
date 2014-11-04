module FeatureList {
    export interface IFeatureListScope extends ng.IScope {
        vm: FeatureListCtrl;
        numberOfItems: number;
    }

    export class FeatureListCtrl {
        private scope: IFeatureListScope;
        
        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'mapService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope       : IFeatureListScope,
            private $layerService: csComp.Services.LayerService,
            private $mapService  : csComp.Services.MapService
            ) {
            $scope.vm = this;
            $scope.numberOfItems = 10;  // This is being reset in the directive upon receiving a resize.
        }

    }
} 