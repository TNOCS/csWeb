module KanbanColumn {
    export interface IKanbanColumnScope extends ng.IScope {
        vm: KanbanColumnCtrl;
        column: Column;
        columnFilter: Function;
        columnOrderTitle: string;
        columnOrderBy: string;
        query: string;
        fields: any;
    }

    export class ColumnFilter {
        layerIds: string[];
        prio: number;
        roles: string[];
        tags: string[];
    }

    export class Column {
        filters: ColumnFilter;
        fields: any;
        orderBy: string;
        actions: string[];
    }

    declare var _;

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
            'messageBusService',
            'mapService'
        ];

        public sortOptions = [];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IKanbanColumnScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private mapService: csComp.Services.MapService
            ) {
            $scope.vm = this;

            //var par = <any>$scope.$parent;
            //this.kanban = par.widget.data;
            this.column = $scope.column;
            $scope.fields = this.column.fields;

            if ($scope.fields.hasOwnProperty('prio')) this.sortOptions = this.sortOptions.concat(['High priority', 'Low Priority']);
            if ($scope.fields.hasOwnProperty('date')) this.sortOptions = this.sortOptions.concat(['New', 'Old']);
            this.sortOptions = this.sortOptions.concat(['Title']);

            // check if layers should be enabled
            this.initLayers();

            if (this.column.orderBy)
                this.setOrder(this.column.orderBy)
            else
                this.setOrder(this.sortOptions[0]);

            $scope.columnFilter = (feature: csComp.Services.IFeature) => {
                var result = true;
                if (!$scope.column) return false;
                if (this.column.filters.roles && feature.properties.hasOwnProperty('roles')) {
                    this.column.filters.roles.forEach((r: string) => {
                        if (!_.contains(feature.properties['roles'], r)) result = false;
                    });
                }
                if (result && !_.contains(this.column.filters.layerIds, feature.layerId)) return false;
                if (result && this.column.filters.tags) {
                    if (!feature.properties.hasOwnProperty('tags')) return false;
                    this.column.filters.tags.forEach((tag: string) => {
                        if (tag[0] === "!") {
                            var t = tag.slice(1, tag.length);
                            if (_.contains(feature.properties['tags'], t)) result = false;
                        }
                        else if (!_.contains(feature.properties['tags'], tag)) result = false;
                        return;
                    })
                }
                return result;
            }
            setInterval(() => { this.updateTime() }, 1000);
        }

        public clickPrio($event) {


            // var dropdown: any = $($event.target, "> ul");
            // dropdown.css('top', angular.element($event.target).prop('offsetLeft') + "px");
            // dropdown.css('left', angular.element($event.target).prop('offsetTop') + "px");

        }

        public createForm(feature: csComp.Services.IFeature) {
            if (this.$layerService.lockFeature(feature)) {
                feature.gui["questions"] = [];
                feature.properties[this.column.fields['question']].forEach((s: string) => {
                    var pt = this.$layerService.getPropertyType(feature, s);

                    feature.gui["questions"].push({ property: s, ptype: pt });
                });
            }
        }

        public sendForm(feature: csComp.Services.IFeature) {
            feature.properties["answered"] = true;
            delete feature.gui["questions"];
            this.$layerService.unlockFeature(feature);
            this.$layerService.saveFeature(feature, true);

        }

        public saveCategory(feature: csComp.Services.IFeature, property: string, value: string) {
            feature.properties["answered"] = true;
            feature.properties[property] = value;
            delete feature.gui["questions"];
            this.$layerService.unlockFeature(feature);
            this.$layerService.saveFeature(feature, true);
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

        public addRole(feature: csComp.Services.IFeature, role: string) {
            if (!feature.properties.hasOwnProperty('roles')) feature.properties['roles'] = [];
            if (feature.properties['roles'].indexOf(role) === -1) feature.properties['roles'].push(role);
            this.$layerService.saveFeature(feature, true);
        }

        public logFilter(feature: csComp.Services.IFeature) {

        }

        public startAction(action: string, feature: csComp.Services.IFeature) {
            this.$messageBus.publish("kanbanaction", action, feature);
        }

        public getPrioColor(feature: csComp.Services.IFeature) {
            var colors = ["white", "black", "red", "orange", "blue", "green"];
            if (feature.properties.hasOwnProperty(this.column.fields['prio']))
                return {
                    "background-color": colors[parseInt(feature.properties[this.column.fields['prio']])]
                }
            return {};
        }

        public setOrder(order: string) {
            this.$scope.columnOrderTitle = order;
            this.column.orderBy = order;
            switch (order) {
                case 'High priority': this.$scope.columnOrderBy = "properties." + this.$scope.fields['prio']; break;
                case 'Low Priority': this.$scope.columnOrderBy = "-properties." + this.$scope.fields['prio']; break;
                case 'New': this.$scope.columnOrderBy = "-properties." + this.$scope.fields['date']; break;
                case 'Old': this.$scope.columnOrderBy = "properties." + this.$scope.fields['date']; break;
                case 'Title': this.$scope.columnOrderBy = "properties." + this.$scope.fields['title']; break;
            }
        }

        public updateFeature(feature: csComp.Services.Feature) {
            this.$layerService.saveFeature(feature, true);
        }

        selectFeature(feature: csComp.Services.IFeature) {
            if (feature.properties.hasOwnProperty(this.column.fields['question'])) {
                this.createForm(feature);
            } else {
                this.$layerService.selectFeature(feature);
            }

        }

        editFeature(feature: csComp.Services.IFeature) {
            this.$layerService.editFeature(feature);
        }

        public searchFeature(feature: csComp.Services.IFeature) {
            this.mapService.zoomTo(feature, 15);
            //this.$mapService.
            //this.$layerService.selectFeature(feature);
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
