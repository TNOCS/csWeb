module LayersDirective {
    'use strict';

    export interface IAddLayerScope extends ng.IScope {
        vm: AddLayerCtrl;
    }



    export class AddLayerCtrl {

        public groupTitle: string;
        public groupDescription: string;
        public layerGroup: any;
        public layerTitle: string;

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
            public layerService: csComp.Services.LayerService,
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

        public addLayer() {
            var group = this.layerService.findGroupById(this.layerGroup);
            if (group) {
                var l = new csComp.Services.ProjectLayer();
                l.title = this.layerTitle;
                this.layerService.initLayer(group, l);
                group.layers.push(l);

                var rpt = csComp.Helpers.createRightPanelTab("edit", "layeredit", l, "Edit layer");
                this.messageBusService.publish("rightpanel", "activate", rpt);
            }

            this.$modalInstance.close("yes i'm done");
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
