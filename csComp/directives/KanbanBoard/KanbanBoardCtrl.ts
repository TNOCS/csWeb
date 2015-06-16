module KanbanBoard {
    export interface IKanbanBoardScope extends ng.IScope {
        vm: KanbanBoardCtrl;
    }

    export class Column {
        layerId: string;
        layer: csComp.Services.ProjectLayer;
    }

    export class KanbanConfig {
        columns: Column[];
    }

    export class KanbanBoardCtrl {
        private scope: IKanbanBoardScope;
        public feeds: csComp.Services.Feed[] = [];

        public kanban: KanbanConfig;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
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
            private $scope: IKanbanBoardScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.kanban = par.widget.data;
            this.initLayers();
            console.log(this.kanban);

        }

        selectFeature(feature: csComp.Services.IFeature) {
            console.log(feature);
        }

        /** make sure all layers/feeds are loaded */
        initLayers() {
            this.kanban.columns.forEach((c: Column) => {
                var l = this.$layerService.findLayer(c.layerId);
                this.$layerService.addLayer(l, (t) => {
                    setTimeout(() => {
                        c.layer = t;
                        console.log(c.layer.data.features);
                    }, 0);
                });
            });
        }
    }
}
