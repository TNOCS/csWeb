module csComp.Services {
    export interface IMapLayersScope extends ng.IScope {
        map: L.Map;
        vm : MapCtrl;
    }

    export class MapCtrl {
        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$location',
            'mapService'//,
            //'layerService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope      : IMapLayersScope,
            private $location   : ng.ILocationService,
            private $mapService : MapService//,
            //private $layerService  : LayerService.LayerService
            ) {
            // 'vm' stands for 'view model'. We're adding a reference to the controller to the scope
            // for its methods to be accessible from view / HTML
            $scope.vm = this;

            this.$mapService.baseLayers = { };

            var map = $scope.map = $mapService.getMap();
            //Den Haag
            //map.setView(new L.LatLng(52.555193, 5.438660), 10);
            //Amsterdam
            //map.setView(new L.LatLng(52.3978949803545, 4.90466079148125), 14);

            map.invalidateSize();

            // Zoom in/out layer control (above, I've turned it off, as the default location is top left).
            L.control.zoom({
                position: "bottomleft"
            }).addTo(map);

            // GPS enabled geolocation control set to follow the user's location 
            L.control.locate({
                position:                "bottomleft",
                drawCircle:              true,
                follow:                  true,
                setView:                 true,
                keepCurrentZoomLevel:    true,
                markerStyle:             {
                    weight:              1,
                    opacity:             0.8,
                    fillOpacity:         0.8
                },
                circleStyle:             {
                    weight:              1,
                    clickable:           false
                },
                icon:                    "icon-direction",
                metric:                  true,
                strings:                 {
                    title:               "My location",
                    popup:               "You are within {distance} {unit} from this point",
                    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
                },
                locateOptions:           {
                    maxZoom:             18,
                    watch:               true,
                    enableHighAccuracy:  true,
                    maximumAge:          10000,
                    timeout:             10000
                }
            }).addTo(map);

            //L.control.groupedLayers(this.$mapService.baseLayers, $layerService.overlays, {
            //    collapsed: true
            //}).addTo(map);
            
        }

        //private popUp(f,l) : void {
        //    var out = [];
        //    if (f.properties) {
        //        for (var key in f.properties) {
        //            out.push(key + ": " + f.properties[key]);
        //        }
        //        l.bindPopup(out.join("<br />"));
        //    }
        //}
    }
}

//export = MapLayersCtrl;