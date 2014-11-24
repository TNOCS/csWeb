module csComp.Services {
    'use strict';

    import IFeature = csComp.GeoJson.IFeature;

    /*
     * Singleton service that holds a reference to the map. 
     * In case other controllers need access to the map, they can inject this service. 
     */
    export class MapService {
        public static $inject = [
            'messageBusService'
        ];

        public map: L.Map;

        public baseLayers: any;
        private activeBaseLayer: L.ILayer;

        constructor(private $messageBusService: csComp.Services.MessageBusService) {
            //this.map = L.map("map", {
            //    zoomControl        : false,
            //    attributionControl : true
            //});
            //this.activeBaseLayer;
            this.baseLayers = {};
            this.initMap();
        }

        public initMap() {
            this.map = L.map("map", {
                zoomControl: false,
                attributionControl: true
            });
        }

        public changeBaseLayer(layerObj: L.ILayer) {
            this.map.addLayer(layerObj);
            if (this.activeBaseLayer)
                this.map.removeLayer(this.activeBaseLayer);
            this.map.setZoom(this.map.getZoom());
            this.map.fire('baselayerchange', { layer: layerObj });
            this.activeBaseLayer = layerObj;
        }

        public invalidate() {
            this.map.invalidateSize();
        }

        /**
         * Zoom to a location on the map.
         */
        public zoomToLocation(center: L.LatLng, zoomFactor?: number) {
            this.map.setView(center, zoomFactor || 14);
        }

        /**
         * Zoom to a feature on the map.
         */
        public zoomTo(feature: IFeature) {
            var center: L.LatLng;
            if (feature.geometry.type.toUpperCase() == 'POINT') {
                center = new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                this.map.setView(center, 14);
            } else {
                var bb : Array<number>;
                if (feature.geometry.type.toUpperCase().indexOf("MULTI") < 0)
                    bb = this.getBoundingBox(feature.geometry.coordinates[0]);
                else { // MULTIPOLYGON or MULTILINESTRING
                    bb = [1000, -1000, 1000, -1000];
                    feature.geometry.coordinates.forEach((c) => {
                        var b = this.getBoundingBox(c[0]);
                        bb = [Math.min(bb[0], b[0]), Math.max(bb[1], b[1]), Math.min(bb[2], b[2]), Math.max(bb[3], b[3])];
                    });
                }
                var spacingLon = 0.05; // extra spacing left and right, where the menus are. 
                var southWest = L.latLng(Math.min(bb[2], bb[3]), Math.min(bb[0], bb[1]) - spacingLon);
                var northEast = L.latLng(Math.max(bb[2], bb[3]), Math.max(bb[0], bb[1]) + spacingLon);
                this.map.fitBounds(new L.LatLngBounds(southWest, northEast));
            }
            this.$messageBusService.publish("sidebar", "show");
            this.$messageBusService.publish("feature", "onFeatureSelect", feature);
        }

        //private getCentroid(arr) {
        //    return arr.reduce((x, y) => [x[0] + y[0] / arr.length, x[1] + y[1] / arr.length], [0, 0]);
        //}

        /** 
         * Compute the bounding box.
         * Returns [min_x, max_x, min_y, max_y]
         */
        private getBoundingBox(arr) {
            // p is the previous value of the callback, c the current element of the array.
            return arr.reduce((p, c) => [Math.min(p[0], c[0]), Math.max(p[1], c[0]), Math.min(p[2], c[1]), Math.max(p[3], c[1])], [1000, -1000, 1000, -1000]);
        }

        getMap(): L.Map { return this.map; }
    }
}