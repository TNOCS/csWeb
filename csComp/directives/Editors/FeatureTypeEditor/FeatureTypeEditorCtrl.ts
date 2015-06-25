module FeatureTypeEditor {

    import IFeature = csComp.Services.IFeature;

    export interface IFeatureTypeEditorScope extends ng.IScope {
        vm: FeatureTypeEditorCtrl;
        data: IFeature;
        featureType: csComp.Services.IFeatureType;
    }

    export class FeatureTypeEditorCtrl {
        private scope: IFeatureTypeEditorScope;

        public selectedResourceUrl: string;
        public selectedResource: csComp.Services.ITypesResource

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
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
            private $scope: IFeatureTypeEditorScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {
            this.$scope.vm = this;
            if (this.$scope.$root.hasOwnProperty('data')) {
                $scope.data = $scope.$root['data'];
                $scope.featureType = $scope.data.fType;

                console.log('feature type editor');
                console.log($scope.featureType);

            }
            else {
                console.log('no feature type');
            }


        }

        //** force features to be updated */
        public updateFeatureTypes(ft: csComp.Services.IFeatureType) {
            this.$layerService.updateFeatureTypes(ft);


        };


    }
}
