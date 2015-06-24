module KanbanColumn {
    export interface IKanbanColumnScope extends ng.IScope {
        vm: KanbanColumnCtrl;
        column: Column;
        columnFilter: Function;
        query: string;
    }

    export class ColumnFilter {
        layerIds: string[];
        prio: number;
        roles: string[];
        tags: string[];
    }

    export class Column {
        filters: ColumnFilter;
    }



    export class KanbanColumnCtrl {
        public scope: IKanbanColumnScope;
        public column: Column;

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
            private $scope: IKanbanColumnScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            //var par = <any>$scope.$parent;
            //this.kanban = par.widget.data;
            this.column = $scope.column;
            this.initLayers();
            console.log('init column:' + this.column);

            $scope.columnFilter = (feature: csComp.Services.IFeature) => {
                var result = true;
                if (!$scope.column) return false;
                if (!_.contains(this.column.filters.layerIds, feature.layerId)) return false;
                if (this.column.filters.tags) {
                    if (!feature.properties.hasOwnProperty('tags')) return false;
                    this.column.filters.tags.forEach((tag: string) => {
                        if (!_.contains(feature.properties['tags'], tag))
                            result = false;
                        return;
                    })
                }
                return result;
            }

            setInterval(() => { this.updateTime() }, 1000);
        }

        public updateTime() {
            this.$layerService.project.features.forEach((feature: csComp.Services.IFeature) => {
                if (feature.properties.hasOwnProperty('date')) {

                    var d = feature.properties['date'];
                    if (!feature.hasOwnProperty('gui')) feature.gui = new Object;
                    feature.gui['relativeTime'] = moment(d).fromNow();
                }
                return "";
            })
        }

        public logFilter(feature: csComp.Services.IFeature) {

        }



        public getPrioColor(feature: csComp.Services.IFeature) {
            var colors = ["white", "green", "blue", "orange", "red", "black"];
            return {
                "background-color": colors[parseInt(feature.properties['prio'])]
            }
        }

        public updateFeature(feature: csComp.Services.Feature) {
            this.$layerService.saveFeature(feature);
        }




        selectFeature(feature: csComp.Services.IFeature) {
            this.$layerService.selectFeature(feature);
        }

        /** make sure all layers/feeds are loaded */
        initLayers() {
            var c = this.$scope.column;


            if (c.filters.layerIds) {
                c.filters.layerIds.forEach((layer: string) => {
                    var l = this.$layerService.findLayer(layer);
                    if (l) {
                        this.$layerService.addLayer(l, (t) => {

                        });
                    }
                });


            };
        }
    }
}
