module Mca {
    export interface IMcaEditorScope extends ng.IScope {
        vm: McaEditorCtrl;
    }

    export class McaEditorCtrl {
        public static $inject = [
            '$scope',
            '$modal',
            'layerService',
            'messageBusService'
        ];

        constructor(
            private $scope           : IMcaEditorScope,
            private $modal           : any,
            private $layerService    : csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService
        ) {
            $scope.vm = this;
            console.log("McaEditorCtlr");
        }
    }
} 