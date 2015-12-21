module csComp.Search {
    export interface ISearchFormScope extends ng.IScope {
        vm      : SearchFormCtrl;
        location: L.LatLng;
    }

    export class SearchFormCtrl {
        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'mapService'
        ];

        constructor(private $scope: ISearchFormScope, private $mapService: csComp.Services.MapService) {
            $scope.vm = this;
            $scope.location = new L.LatLng(0, 0);
        }

        public doSearch() : void {
            if (this.$scope.location.lat === 0 && this.$scope.location.lng === 0) {
                alert('Directive did not update the location property in parent controller.');
            } else {
                //alert('Yay. Location: ' + this.$scope.location);
                var center = new L.LatLng(this.$scope.location.lat, this.$scope.location.lng);
                this.$mapService.zoomToLocation(center);
            }            
        }
    }
} 