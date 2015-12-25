module Filters {
    export interface IBarFilterScope extends ng.IScope {
        vm:                  BarFilterCtrl;
        filter:              csComp.Services.GroupFilter;
        options:             Function;
        editMode:            boolean;
        removeString:        string;
        createScatterString: string;
    }

    export class BarFilterCtrl {
        private scope:  IBarFilterScope;
        private widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService',
            '$timeout',
            '$translate'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            public $scope:         IBarFilterScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus:   csComp.Services.MessageBusService,
            private $timeout:      ng.ITimeoutService,
            private $translate:    ng.translate.ITranslateService
            ) {
            $scope.vm = this;
            $scope.editMode = true;

            $translate('REMOVE').then((translation) => {
                $scope.removeString = translation;
            });
            $translate('CREATE_SCATTER').then((translation) => {
                $scope.createScatterString = translation;
            });

            var par = <any>$scope.$parent.$parent;

            if (par.hasOwnProperty('filter')) {
                $scope.filter = par['filter'];
            }
            if ($scope && $scope.filter) {
                setTimeout(() => this.initBarFilter());
                //$timeout.call(()=>this.initBarFilter());

                $scope.options = (() => {
                    var res = [];
                    res.push([$scope.removeString, () => this.remove()]);
                    $scope.filter.group.filters.forEach((gf: csComp.Services.GroupFilter) => {
                        if (gf.filterType === 'bar' && gf.property !== $scope.filter.property) {
                            res.push([$scope.createScatterString + ' ' + gf.title, () => this.createScatter(gf)]);
                        }
                    });
                    return res;
                });
            }
        }

        private createScatter(gf: csComp.Services.GroupFilter) {
            this.$layerService.createScatterFilter(this.$scope.filter.group, this.$scope.filter.property, gf.property);
        }

        private displayFilterRange(min, max) {
            if ((+min) > (+max)) {
                min = max;
            }
            var filter = this.$scope.filter;
            filter.from = filter.rangex[0] < min
                ? min
                : filter.rangex[0];
            filter.to = filter.rangex[1] > max
                ? max
                : filter.rangex[1];
            this.$scope.$apply();
        }

        private dcChart: any;

        public initBarFilter() {
            var filter = this.$scope.filter;
            var group = filter.group;
            var divid = 'filter_' + filter.id;

            this.dcChart = <any>dc.barChart('#' + divid);

            this.$scope.$apply();

            var info = this.$layerService.calculatePropertyInfo(group, filter.property);

            var nBins = Math.ceil(Math.sqrt(Object.keys(group.markers).length));
            var min = info.min; //filter.meta.min || info.min;
            var max = info.max; //filter.meta.max || info.max;
            var binWidth = Math.ceil(Math.abs(max - min) / nBins);
            //max  = min + nBins * binWidth;
            var dx = Math.round(binWidth / 2);
            filter.from = filter.rangex[0] = min - dx;
            filter.to   = filter.rangex[1] = min + nBins * binWidth;//max;

            var dcDim = group.ndx.dimension(d => {
                if (!d.properties.hasOwnProperty(filter.property)) return null;
                let prop = d.properties[filter.property];
                if (prop === null) return null;
                var a = parseFloat(prop) - min;
                return min + Math.floor(a / binWidth) * binWidth;
            });
            filter.dimension = dcDim;
            var dcGroup = dcDim.group();

            //var scale =
            this.dcChart
                .width(275)
                .height(110)
                .dimension(dcDim)
                .group(dcGroup)
                .transitionDuration(10)
                .centerBar(true)
                .gap(1) //d3.scale.quantize().domain([0, 10]).range(d3.range(1, 4));
                .elasticY(true)
                .x(d3.scale.linear().domain([min - dx, max]).range([-1, nBins + 1]))
                .filterPrinter(filters => {
                    var s = '';
                    if (filters.length > 0) {
                        var localFilter = filters[0];
                        this.displayFilterRange(parseFloat(localFilter[0]).toFixed(2), parseFloat(localFilter[1]).toFixed(2))
                        s += localFilter[0];
                    }
                    return s;
                }).on('renderlet', (e) => {
                    //var fil = e.hasFilter();
                    var s = '';
                    if (e.filters.length > 0) {
                        var localFilter = e.filters[0];
                        this.displayFilterRange(+(localFilter[0]).toFixed(2), (+localFilter[1]).toFixed(2))
                        s += localFilter[0];
                    }
                    dc.events.trigger(() => {
                        this.$layerService.updateFilterGroupCount(group);
                    }, 0);
                    dc.events.trigger(() => {
                        //console.log("yes");
                        group.filterResult = dcDim.top(Infinity);
                        this.$layerService.updateMapFilter(group);
                    }, 100);
                });
            this.dcChart.selectAll();
            //this.displayFilterRange(min,max);

            this.dcChart.xUnits(() => { return 100 / nBins; });

            this.dcChart.yAxis().ticks(5);
            this.dcChart.xAxis().ticks(5);
            //this.dcChart.mouseZoomable(true);
            dc.renderAll();
            this.updateRange();
            //  this.updateChartRange(this.dcChart,filter);
        }

        private updateFilter() {
            setTimeout(() => {
                this.dcChart.filter([this.$scope.filter.from, this.$scope.filter.to]);
                this.dcChart.render();
                dc.renderAll();
                this.$layerService.updateMapFilter(this.$scope.filter.group);
            }, 10);
        }

        public updateRange() {
            setTimeout(() => {
                var filter = this.$scope.filter;
                var group = filter.group;
                this.displayFilterRange(filter.from, filter.to);
                this.dcChart.filterAll();
                this.dcChart.filter((<any>dc).filters.RangedFilter(filter.from, filter.to));
                this.dcChart.render();
                dc.redrawAll();
                group.filterResult = filter.dimension.top(Infinity);
                this.$layerService.updateMapFilter(filter.group);
                this.$scope.$apply();
            }, 0);
        }

        public remove() {
            if (this.$scope.filter) {
                this.$layerService.removeFilter(this.$scope.filter);
            }
        }

    }
}
