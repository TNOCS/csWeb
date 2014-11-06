module LegendList {
    export interface ILegendListScope extends ng.IScope {
        vm: LegendListCtrl;
        numberOfItems: number;
        legendImage: Function;
        legendName : Function;
    }

    export class LegendListCtrl {
        private scope: ILegendListScope;
        
        // $inject annotation.   
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'mapService'
        ];

        // dependencies are injected via AngularJS $injector 
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ILegendListScope,
            private $layerService: csComp.Services.LayerService,
            private $mapService  : csComp.Services.MapService
            ) {
            $scope.vm = this;   

            $scope.numberOfItems = 10;  // This is being reset in the directive upon receiving a resize.
            $scope.legendImage = (ft: csComp.GeoJson.IFeatureType) => {
                if (ft.style != null && ft.style.drawingMode.toLowerCase() != "point") {
                    if (ft.style.iconUri && ft.style.iconUri.indexOf('_Media') < 0)
                        return ft.style.iconUri;
                    else
                        return "includes/images/polygon.png";
                }
                else if (ft.style != null && ft.style.iconUri != null) {
                    return ft.style.iconUri;     
                }
                else
                {
                    return "includes/images/marker.png";
                }
            }

            $scope.legendName = (key : string, ft: csComp.GeoJson.IFeatureType) => {
                if (ft.name != null) {
                    return ft.name;
                }
                else {
                    return key;
                }
            }
        }

    }
} 