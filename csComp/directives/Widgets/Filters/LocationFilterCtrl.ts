module Filters {


    export interface ILocationFilterScope extends ng.IScope {
        vm: LocationFilterCtrl;
        filter: csComp.Services.GroupFilter;
        options: Function;
        removeString: string;
    }

    export class LocationFilterCtrl {
        private scope: ILocationFilterScope;
        private widget: csComp.Services.IWidget;
        private locationFilter: L.LocationFilter;

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
            public $scope: ILocationFilterScope,
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
                setTimeout(() => this.initLocationFilter());
                //$timeout.call(()=>this.initLocationFilter());

                $scope.options = (() => {
                    var res = [];
                    res.push([$scope.removeString, () => this.remove()]);
                    return res;
                });
            }
        }

        setLocationFilter() {
            if (!this.locationFilter) {
                var bounds = this.$layerService.map.map.getBounds();
                bounds = bounds.pad(-0.75);
                this.locationFilter = new L.LocationFilter({ bounds: bounds }).addTo(this.$layerService.map.map);
                this.locationFilter.on('change', (e) => {
                    this.updateLocationFilter(e.bounds);
                });
                this.locationFilter.on('enabled', (e) => {
                    this.updateLocationFilter(e.bounds);
                });
                this.locationFilter.on('disabled', (e) => {
                });
                this.locationFilter.enable();
                this.updateLocationFilter(this.locationFilter.getBounds());
            } else if (this.locationFilter.isEnabled()) {
                this.locationFilter.disable();
            } else {
                this.locationFilter.enable();
            }
        }

        public initLocationFilter() {
            var filter = this.$scope.filter;
            var group = filter.group;
            this.setLocationFilter();

            var dcDim = group.ndx.dimension(d => {
                if (d.id && d.layer && d.layer.group && d.layer.group.markers && d.layer.group.markers.hasOwnProperty(d.id)) {
                    var marker = d.layer.group.markers[d.id];
                    if (marker.getBounds) {
                        return marker.getBounds();
                    } else if (marker.getLatLng) {
                        return (new L.LatLngBounds(marker.getLatLng(), marker.getLatLng()));
                    } else {
                        //what else?
                        null;
                    }
                }
                return null;
            });
            filter.dimension = dcDim;
            filter.group = group;
            this.$scope.$digest();
            this.updateLocationFilter(this.$layerService.map.map.getBounds());
        }

        public updateLocationFilter(bounds) {
            var f = this.$scope.filter;
            if (!f.dimension) return;
            var group = f.group;

            f.dimension.filterFunction((d: L.LatLngBounds) => {
                if (d != null) {
                    return (bounds.contains(d));
                }
                return false;
            });


            group.filterResult = f.dimension.top(Infinity);
            this.$layerService.updateMapFilter(group);
            dc.renderAll();
        }

        public remove() {
            if (this.$scope.filter) {
                this.locationFilter.disable();
                this.$layerService.removeFilter(this.$scope.filter);
            }
        }
    }
}
