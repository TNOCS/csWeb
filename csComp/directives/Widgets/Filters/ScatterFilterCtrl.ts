module Filters {
    export interface IScatterFilterScope extends ng.IScope {
        vm: ScatterFilterCtrl;
        filter: csComp.Services.GroupFilter;
        options: Function;
        editMode: boolean;
    }

    export class ScatterFilterCtrl {
        private scope: IScatterFilterScope;
        private widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService',
            '$timeout'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            public $scope: IScatterFilterScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
            ) {
            $scope.vm = this;

            var par = <any>$scope.$parent.$parent;

            if (par.hasOwnProperty('filter')) {
                $scope.filter = par['filter'];
            }
            if ($scope && $scope.filter) {
                setTimeout(() => this.addScatterFilter());
                //$timeout.call(()=>this.initBarFilter());

                $scope.options = (() => {
                    var res = [];
                    res.push(['remove', () => this.remove()]);
                    $scope.filter.group.filters.forEach((gf: csComp.Services.GroupFilter) => {
                        if (gf.filterType === 'bar' && gf.property !== $scope.filter.property) {
                            res.push(['create scatter with ' + gf.title, () => this.remove()]);
                        }
                    });
                    return res;
                });
            }
        }

        private displayFilterRange(min, max) {
            var filter  = this.$scope.filter;
            filter.from = min;
            filter.to   = max;
            this.$scope.$apply();
        }

        private dcChart: any;

        private addScatterFilter() {
            var filter = this.$scope.filter;
            var group = filter.group;

            var info = this.$layerService.calculatePropertyInfo(group, filter.property);
            var info2 = this.$layerService.calculatePropertyInfo(group, filter.property2);

            var divid = 'filter_' + filter.id;

            this.dcChart = <any>dc.scatterPlot('#' + divid);

            var prop1 = group.ndx.dimension(d => {
                if (!d.properties.hasOwnProperty(filter.property)) return null;
                if (d.properties[filter.property] != null) {

                    var a = parseFloat(d.properties[filter.property]);
                    var b = parseFloat(d.properties[filter.property2]);
                    if (a >= info.min && a <= info.max) {
                        return [a, b];
                    }
                }
                return [0, 0];
            });

            filter.dimension = prop1;
            var dcGroup1 = prop1.group();

            this.dcChart.width(275)
                .height(190)
                .dimension(prop1)
                .group(dcGroup1)
                .x(d3.scale.linear().domain([info.min, info.max]))
                .yAxisLabel(filter.property2)
                .xAxisLabel(filter.property)
                .on('filtered', (e) => {
                var fil = e.hasFilter();
                dc.events.trigger(() => {
                    group.filterResult = prop1.top(Infinity);
                    this.$layerService.updateFilterGroupCount(group);
                }, 0);
                dc.events.trigger(() => {
                    this.$layerService.updateMapFilter(group);
                }, 100);
            });

            this.dcChart.xUnits(() => { return 13; });

            this.dcChart.yAxis().ticks(15);
            this.dcChart.xAxis().ticks(15);
            this.dcChart.render();
        }

        private updateFilter() {
            setTimeout(() => {
                this.dcChart.filter([(<any>this.$scope.filter).from, (<any>this.$scope.filter).to]);
                this.dcChart.render();
                dc.renderAll();
                this.$layerService.updateMapFilter(this.$scope.filter.group);
                console.log('update filter');
            }, 10);
        }

        public updateRange() {
            setTimeout(() => {
                this.dcChart.filter([(<any>this.$scope.filter).from, (<any>this.$scope.filter).to]);
                this.dcChart.render();
                this.$layerService.updateMapFilter(this.$scope.filter.group);
                console.log('update filter');
            }, 10);
        }

        public remove() {
            if (this.$scope.filter) {
                this.$layerService.removeFilter(this.$scope.filter);
            }
        }
    }
}
