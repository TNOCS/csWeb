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
        layerId: string;
        prio: number;
        roles: string[];
        tags: string[];
    }

    export class Column {
        id: string;
        filters: ColumnFilter;
        roles: string[];
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
        public layer: csComp.Services.ProjectLayer;

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
            if ($scope.fields.hasOwnProperty('updated')) this.sortOptions = this.sortOptions.concat(['Updated']);
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
                // Check that the layerId is applicable.
                if (result && this.column.filters.layerId !== feature.layerId) return false;
                // Role filter: is a simple AND filter.
                if (this.column.filters.roles && this.column.filters.roles.length > 0 && feature.properties.hasOwnProperty('roles')) {
                    this.column.filters.roles.forEach((r: string) => {
                        if (!_.contains(feature.properties['roles'], r)) result = false;
                    });
                }
                // Tag filter: complex filter, combines AND (nothing or +), OR (-), and NOT (~) operations. Based on first character:
                if (result && this.column.filters.tags && this.column.filters.tags.length > 0 && this.column.filters.tags.length > 0) {
                    if (!feature.properties.hasOwnProperty('tags')) return false;
                    var tags = feature.properties['tags'];
                    var or = false;
                    this.column.filters.tags.some((tag: string) => {
                        switch (tag[0]) {
                            case '!':
                            case '~':
                                var t = tag.substr(1, tag.length - 1);
                                if (_.contains(tags, t)) result = false;
                                break;
                            case '-':
                                or = true;
                                break;
                            default:
                                if (!_.contains(tags, tag)) result = false;
                                break;
                        }
                        return !result;
                    });
                    // Add the OR features: if any of the OR tags are true, the result is true
                    if (result && or) {
                        or = false;
                        // Only check if there are OR tags (or === true), and we are still showing this item (result === true).
                        this.column.filters.tags.some((tag: string) => {
                            switch (tag[0]) {
                                case '-':
                                    var t = tag.substr(1, tag.length - 1);
                                    if (_.contains(tags, t)) or = true;
                                    break;
                                default:
                                    break;
                            }
                            return or;
                        });
                    } else {
                        or = true;
                    }
                    result = result && or;
                }
                return result;
            }
            setInterval(() => { this.updateTime() }, 1000);
        }

        public getClass(feature: csComp.Services.IFeature) {
            if (typeof feature.properties === 'undefined') return "";
            if (!feature.properties.hasOwnProperty("question")) return "";
            return (feature.properties.hasOwnProperty("answered") && feature.properties["answered"] === true)
                ? "isAnsweredQuestion"
                : "isQuestion";
        }

        public clickPrio($event) {
            // var dropdown: any = $($event.target, "> ul");
            // dropdown.css('top', angular.element($event.target).prop('offsetLeft') + "px");
            // dropdown.css('left', angular.element($event.target).prop('offsetTop') + "px");
        }

        public createForm(feature: csComp.Services.IFeature) {
            if (feature.gui["questions"]) {
                delete feature.gui["questions"];
                this.$layerService.unlockFeature(feature);
            }
            else if (this.$layerService.lockFeature(feature)) {
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

        public toggleRole(feature: csComp.Services.IFeature, role: string) {
            if (!feature.properties.hasOwnProperty('roles')) feature.properties['roles'] = [];
            if (feature.properties['roles'].indexOf(role) === -1) { feature.properties['roles'].push(role); }
            else {
                feature.properties['roles'] = feature.properties['roles'].filter((s: string) => s != role);
            }
            this.$layerService.saveFeature(feature, true);
        }

        public logFilter(feature: csComp.Services.IFeature) {
        }

        public startAction(action: string, feature: csComp.Services.IFeature) {
            this.$messageBus.publish("kanbanaction", action, feature);
        }

        public getPrioColor(feature: csComp.Services.IFeature): any {
            var colors = ["white", "black", "red", "orange", "blue", "green"];
            if (feature.properties.hasOwnProperty(this.column.fields['prio']))
                return {
                    "background-color": colors[parseInt(feature.properties[this.column.fields['prio']])]
                };
            return { "background-color": "white" };
        }

        public setOrder(order: string) {
            this.$scope.columnOrderTitle = order;
            this.column.orderBy = order;
            switch (order) {
                case 'High priority': this.$scope.columnOrderBy = "properties." + this.$scope.fields['prio']; break;
                case 'Low Priority': this.$scope.columnOrderBy = "-properties." + this.$scope.fields['prio']; break;
                case 'New': this.$scope.columnOrderBy = "-properties." + this.$scope.fields['date']; break;
                case 'Old': this.$scope.columnOrderBy = "properties." + this.$scope.fields['date']; break;
                case 'Updated': this.$scope.columnOrderBy = "-properties." + this.$scope.fields['updated']; break;
                case 'Title': this.$scope.columnOrderBy = "properties." + this.$scope.fields['title']; break;
            }
        }

        public updateFeature(feature: csComp.Services.Feature) {
            this.$layerService.saveFeature(feature, true);
        }

        selectFeature(feature: csComp.Services.IFeature) {
            this.$messageBus.publish('kanban', 'onItemSelect', feature);
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

        /** make sure all layers/feeds are loaded
        we only use the first one for now
         */
        initLayers() {
            var c = this.$scope.column;


            var lid = c.filters.layerId;
            this.layer = this.$layerService.findLayer(lid);
            if (this.layer) {
                this.$layerService.addLayer(this.layer, (t) => {
                });
            }

        }
    }
}
