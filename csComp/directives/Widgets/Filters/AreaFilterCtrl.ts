module Filters {


    export interface IAreaFilterScope extends ng.IScope {
        vm: AreaFilterCtrl;
        filter: csComp.Services.GroupFilter;
        options: Function;
        removeString: string;
    }

    export class AreaFilterCtrl {
        private scope: IAreaFilterScope;
        private widget: csComp.Services.IWidget;
        private dcChart: any;
        private helperDim: any;
        private helperGroup: any;
        private isInsideFunction: Function;

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
            public $scope: IAreaFilterScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService,
            private $translate: ng.translate.ITranslateService
            ) {
            $scope.vm = this;

            $translate('REMOVE').then((translation) => {
                $scope.removeString = translation;
            });

            var par = <any>$scope.$parent.$parent;

            if (par.hasOwnProperty('filter')) {
                $scope.filter = par['filter'];
            }
            else {

            }
            if ($scope && $scope.filter) {
                setTimeout(() => this.initAreaFilter());
                //$timeout.call(()=>this.initAreaFilter());

                $scope.options = (() => {
                    var res = [];
                    res.push([$scope.removeString, () => this.remove()]);
                    return res;
                });
            }
        }

        setAreaFilter(f) {
            if (f.geometry.type === 'Polygon') {
                this.isInsideFunction = csComp.Helpers.GeoExtensions.pointInsidePolygon;
            } else if (f.geometry.type === 'MultiPolygon') {
                this.isInsideFunction = csComp.Helpers.GeoExtensions.pointInsideMultiPolygon;
            } else {
                this.isInsideFunction = () => { return false };
            }
        }

        public initAreaFilter() {
            var filter = this.$scope.filter;
            var feature = filter.value;
            var group = filter.group;
            var divid = 'filter_' + filter.id;
            this.setAreaFilter(filter.value);

            this.dcChart = <any>dc.pieChart('#' + divid);

            this.$scope.$apply();

            var dcDim = group.ndx.dimension(d => {
                if (d.id && d.layer && d.layer.group && d.layer.group.markers && d.layer.group.markers.hasOwnProperty(d.id)) {
                    var marker = d.layer.group.markers[d.id];
                    return (marker.feature.geometry.coordinates);
                    group.filterResult.push(feature);
                }
                return null;
            });
            filter.dimension = dcDim;

            this.helperDim = crossfilter([
                { title: "inside" },
                { title: "outside" }
            ]).dimension(d => { return d.title });
            this.helperGroup = this.helperDim.group((d) => {
                return d;
            });

            this.dcChart
                .width(200)
                .height(225)
                .slicesCap(4)
                .innerRadius(0)
                .dimension(this.helperDim)
                .group(this.helperGroup) // by default, pie charts will use group.key as the label
                .legend((<any>dc).legend())
                .renderLabel(true)
                .label(function(d) { return d.value; })
                .on('renderlet', (e) => {
                this.updateAreaFilter(this.$scope.filter.value, false);
            });
            this.updateAreaFilter(this.$scope.filter.value);
        }

        public updateAreaFilter(bounds, triggerRender: boolean = true) {
            var f = this.$scope.filter;
            var feat: csComp.Services.IFeature = f.value;
            if (!f.dimension) return;
            var group = f.group;

            f.dimension.filterFunction((d) => {
                if (d != null) {
                    return (this.isInsideFunction(d, feat.geometry.coordinates));
                }
                return false;
            });

            this.helperGroup.all().forEach((hg) => {
                if (hg.key === "inside") {
                    hg.value = f.dimension.top(Infinity).length;
                }
                if (hg.key === "outside") {
                    hg.value = f.dimension.groupAll().value() - f.dimension.top(Infinity).length;
                }
            });

            group.filterResult = f.dimension.top(Infinity);

            if (triggerRender) {
                this.$layerService.updateMapFilter(group);
                dc.renderAll();
            }
        }

        public remove() {
            if (this.$scope.filter) {
                this.$layerService.removeFilter(this.$scope.filter);
            }
        }
    }
}
