module Filters {


    export interface ITextFilterScope extends ng.IScope {
        vm: TextFilterCtrl;
        filter: csComp.Services.GroupFilter;
    }

    export class TextFilterCtrl {
        private scope: ITextFilterScope;
        private widget: csComp.Services.IWidget;

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
            public $scope: ITextFilterScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;

            var par = <any>$scope.$parent.$parent;

            if (par.hasOwnProperty('filter')) {
                $scope.filter = par['filter'];
            }
            else {

            }
            if ($scope && $scope.filter) {
                this.initTextFilter();
                //this.updateTextFilter();
                //this.widget = (par.widget);
                $scope.$watch('filter.stringValue', () => {
                    this.updateTextFilter();
                });

            }

        }

        public initTextFilter() {
            var filter = this.$scope.filter;
            var group = filter.group;

            var dcDim = group.ndx.dimension(d => {
                if (d.properties.hasOwnProperty(filter.property)) {
                    return d.properties[filter.property];
                } else return null;
            });
            filter.dimension = dcDim;
            filter.group = group;
            dcDim.filterFunction((d: string) => {
                if (d != null && typeof d.toLowerCase === 'function') return (d.toLowerCase().indexOf(filter.stringValue.toLowerCase()) > -1);
                return false;
            });
        }

        public updateTextFilter() {
            var f = this.$scope.filter;
            if (!f.dimension) return;
            var group = f.group;
            if (f.stringValue == null || f.stringValue === '') {
                f.dimension.filterAll();
            } else {
                f.dimension.filterFunction((d: string) => {
                    if (d != null && typeof d.toLowerCase === 'function') return (f.stringValue.toLowerCase().indexOf(d.toLowerCase()) > -1);
                    return false;
                });
            }

            group.filterResult = f.dimension.top(Infinity);
            console.log(`Filtered textfilter (${f.dimension.top(1000).length})`);

            this.$layerService.updateMapFilter(group);
            //dc.renderAll();
            dc.redrawAll();
        }

        public remove() {
            if (this.$scope.filter) {
                this.$layerService.removeFilter(this.$scope.filter);
            }
        }


    }
}
