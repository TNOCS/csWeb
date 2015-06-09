module LayersDirective {
    'use strict';

    export interface IAddLayerScope extends ng.IScope {
        vm: AddLayerCtrl;
    }



    export class AddLayerCtrl {

        public groupTitle: string;
        public groupDescription: string;

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

        public addGroup() {
            if (!this.layerService.project.groups.some((g: csComp.Services.ProjectGroup) => g.title == this.groupTitle)) {
                var gr = new csComp.Services.ProjectGroup();
                gr.title = this.groupTitle;
                gr.description = this.groupDescription;
                this.layerService.project.groups.push(gr);
                this.layerService.initGroup(gr);
                this.done();
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
