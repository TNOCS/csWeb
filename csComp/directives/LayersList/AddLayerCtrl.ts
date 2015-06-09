module LayersDirective {
    'use strict';

    export interface IAddLayerScope extends ng.IScope {
        vm: AddLayerCtrl;
    }



    export class AddLayerCtrl {

        static $inject = [
            '$scope',
            '$modalInstance',
            'layerService',
            '$translate',
            'messageBusService'
        ];

        public project: csComp.Services.Project;

        constructor(
            private $scope: IAddLayerScope,
            private $modalInstance: any,
            private layerService: csComp.Services.LayerService,
            private translate: ng.translate.ITranslateService,
            private messageBusService: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            this.project = this.layerService.project;
            if (this.project.layerDirectory) {
                $.getJSON(this.project.layerDirectory, (result) => {
                    console.log("done");
                });
            }
        }

        public done() {
            this.$modalInstance.close("yes i'm done");
        }

        public cancel() {
            console.log('cancel');
            this.$modalInstance.dismiss('cancel');
        }


    }
}
