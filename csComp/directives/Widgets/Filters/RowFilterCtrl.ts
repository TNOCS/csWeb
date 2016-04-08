module Filters {


    export interface IRowFilterScope extends ng.IScope {
        vm: RowFilterCtrl;
        filter: csComp.Services.GroupFilter;
        options: Function;
        removeString: string;
        createScatterString: string;
    }

    export class RowFilterCtrl {
        private scope: IRowFilterScope;
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
            public $scope: IRowFilterScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService,
            private $translate: ng.translate.ITranslateService
        ) {
            $scope.vm = this;

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
            else {

            }
            if ($scope && $scope.filter) {
                setTimeout(() => this.initRowFilter());
                //$timeout.call(()=>this.initBarFilter());

                $scope.options = (() => {
                    var res = [];
                    res.push([$scope.removeString, () => this.remove()]);
                    $scope.filter.group.filters.forEach((gf: csComp.Services.GroupFilter) => {
                        if (gf.filterType == "row" && gf.property != $scope.filter.property) {
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

        private dcChart: any;


        public initRowFilter() {
            var filter = this.$scope.filter;
            var group = filter.group;
            var divid = 'filter_' + filter.id;

            this.dcChart = <any>dc.rowChart('#' + divid);

            this.$scope.$apply();

            var pt : csComp.Services.IPropertyType;
            
           
            var dcDim = group.ndx.dimension(d => {
                if (!d.properties.hasOwnProperty(filter.property)) return null;
                else {
                    if (!pt) pt = this.$layerService.getPropertyType(d,filter.property);
                        if (d.properties[filter.property] != null) {
                            var a = d.properties[filter.property];
                            if (pt.type === 'options') {
                                var r;
                                if (pt && pt.options && pt.options.hasOwnProperty(a)) {
                                    r = a + "." + pt.options[a];
                                } else { r = a + "." + a}
                                return r;
                            } else if (pt.type === 'number') {
                                var label;
                                pt.legend.legendEntries.some((le) => {
                                    if (a >= le.interval.min && le.interval.max >= a) {
                                        label = le.label;
                                        return true;
                                    }
                                });
                                if (!label) label = 'other';
                                return label;
                            } else if (pt.type === 'text') {
                                return a;
                            }
                        }
                        return null;
                    }
            });
            filter.dimension = dcDim;
            var dcGroup = dcDim.group();

            this.dcChart.width(315)
                .height(210)                
                .dimension(dcDim)
                .group(dcGroup)
                .title(d=> {
                    return d.key })
                .elasticX(true)                
                .colors(d=>{
                    if (pt && pt.legend) {
                        if (pt.options) return csComp.Helpers.getColorFromLegend(parseInt(d.split('.')[0]), pt.legend);
                        if (!pt.options) {
                            var arr = pt.legend.legendEntries.filter((le => { return le.label === d }));
                            return (arr.length > 0 ? arr[0].color : '#000000');
                        }
                    }
                    else {
                        return "red";
                    }
                })
                .cap(10)
                .on('renderlet', (e) => {
                    dc.events.trigger(() => {
                        this.$layerService.updateFilterGroupCount(group);
                    }, 0);
                    dc.events.trigger(() => {
                        group.filterResult = dcDim.top(Infinity);
                        this.$layerService.updateMapFilter(group);
                    }, 100);
                }).on('filtered', (e) => {
                    console.log('Filtered rowchart');
                });
            this.dcChart.selectAll();
            this.updateRange();
            dc.renderAll();
        }

        private updateFilter() {
            setTimeout(() => {
                this.dcChart.filter(this.$scope.filter.filterLabel);
                this.dcChart.render();
                dc.renderAll();
                this.$layerService.updateMapFilter(this.$scope.filter.group);
            }, 10);
        }

        public updateRange() {
            setTimeout(() => {
                var filter = this.$scope.filter;
                var group = filter.group;
                this.dcChart.filterAll();
                this.dcChart.filter(this.$scope.filter.filterLabel);
                this.dcChart.render();
                dc.redrawAll();
                group.filterResult = filter.dimension.top(Infinity);
                this.$layerService.updateMapFilter(this.$scope.filter.group);
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
