module KanbanColumn {
    export interface IKanbanBoardScope extends ng.IScope {
        vm: KanbanBoardCtrl;
    }

    export class KanbanConfig {
        featureTypesToAdd: string[];
        columns: Column[];
    }

    export class KanbanBoardCtrl {
        private scope: IKanbanBoardScope;
        public feeds: csComp.Services.Feed[] = [];
        public layer: csComp.Services.ProjectLayer;
        public featureTypes: { [key: string]: csComp.Services.IFeatureType } = {};

        public kanban: KanbanColumn.KanbanConfig;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        public addFeature(key: string) {
            var f = new csComp.Services.Feature();
            f.properties = {};
            var ft = this.featureTypes[key];
            if (ft.properties) {
                for (var k in ft.properties) {
                    f.properties[k] = JSON.parse(JSON.stringify(ft.properties[k]));
                }
            }
            f.properties["date"] = new Date();
            f.properties["updated"] = new Date();
            f.properties["featureTypeId"] = key;
            if (!f.properties.hasOwnProperty('Name')) f.properties['Name'] = ft.name;
            this.layer.data.features.push(f);
            this.$layerService.initFeature(f, this.layer);
            this.$layerService.editFeature(f);
        }

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IKanbanBoardScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.kanban = par.widget.data;

            this.$messageBus.subscribe("typesource", (s: string) => {
                this.initLayer();
            });

            this.initLayer();
        }

        private initLayer() {
            console.log('kanban:loaded project');
            if (this.kanban && this.kanban.columns && this.kanban.columns.length > 0) {
                var layerId = this.kanban.columns[0].filters.layerIds[0];
                this.layer = this.$layerService.findLayer(layerId);
                if (this.layer) {
                    if (this.layer.typeUrl && this.$layerService.typesResources.hasOwnProperty(this.layer.typeUrl)) {
                        if (this.kanban.featureTypesToAdd) {
                            this.featureTypes = {};
                            for (var ft in this.$layerService.typesResources[this.layer.typeUrl].featureTypes) {
                                if (this.kanban.featureTypesToAdd.indexOf(ft) > -1) this.featureTypes[ft] = this.$layerService.typesResources[this.layer.typeUrl].featureTypes[ft];
                            }
                        }
                        else {
                            this.featureTypes = this.$layerService.typesResources[this.layer.typeUrl].featureTypes;
                        }
                        console.log('feature types');
                        console.log(this.featureTypes);
                    }
                }
            }
        }
    }
}
