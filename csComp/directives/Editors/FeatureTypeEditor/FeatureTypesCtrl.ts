module FeatureTypes {

    import IFeature = csComp.Services.IFeature;

    export interface IFeatureTypesScope extends ng.IScope {
        vm: FeatureTypesCtrl;
    }

    export class FeatureTypesCtrl {
        private scope: IFeatureTypesScope;

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
            private $scope: IFeatureTypesScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {
            this.$scope.vm = this;
        }

        //** force features to be updated */
        public updateFeatureTypes(ft: csComp.Services.IFeatureType) {
            this.$layerService.updateFeatureTypes(ft);


        };

        //** select a typesResource collection from the dropdown */
        public selectResource() {
            if (this.$layerService.typesResources.hasOwnProperty(this.selectedResourceUrl)) {
                this.selectedResource = this.$layerService.typesResources[this.selectedResourceUrl];
            }
        }
    }
}
