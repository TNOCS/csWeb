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
        public layers: csComp.Services.ProjectLayer[];
        public selectedLayer: csComp.Services.ProjectLayer;

        static $inject = [
            '$scope',
            '$http',
            '$modalInstance',
            'layerService',
            '$translate',
            'messageBusService'
        ];

        public project: csComp.Services.Project;

        constructor(
            private $scope: IAddLayerScope,
            private $http: ng.IHttpService,
            private $modalInstance: any,
            public layerService: csComp.Services.LayerService,
            private translate: ng.translate.ITranslateService,
            private messageBusService: csComp.Services.MessageBusService
        ) {
            $scope.vm = this;
            this.project = this.layerService.project;
            if (this.project.layerDirectory) {
                $http.get(this.project.layerDirectory)
                    .success((result: any) => {
                        this.layers = result;
                    })
                    .error(() => { console.log('AddLayerCtrl: error calling $http'); });
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

        public selectProjectLayer(layer: csComp.Services.ProjectLayer) {
            this.selectedLayer = layer;
        }

        public addProjectLayer() {
            var group = this.layerService.findGroupById(this.layerGroup);
            if (group) {
                this.layerService.initLayer(group, this.selectedLayer);
                group.layers.push(this.selectedLayer);
            }
            this.done();
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
            this.done();
        }

        public done() {
            this.$modalInstance.close("done");
        }

        public cancel() {
            console.log('cancel');
            this.$modalInstance.dismiss('cancel');
        }
    }
}
