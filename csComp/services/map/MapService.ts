module csComp.Services {
    'use strict';
 
    /*
     * Singleton service that holds a reference to the map.
     * In case other controllers need access to the map, they can inject this service.
     */
    export class MapService {
        private static expertModeKey = 'expertMode';
        private activeBaseLayer: L.ILayer;

        public static $inject = [
            'localStorageService',
            '$timeout',
            'messageBusService'
        ];

        map             : L.Map;
        baseLayers      : any;
        mapVisible      : boolean = true;
        timelineVisible : boolean = true;
        rightMenuVisible: boolean = true;
        expertMode      : Expertise;

        constructor(
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $timeout            : ng.ITimeoutService,
            private $messageBus         : csComp.Services.MessageBusService) {

            this.initExpertMode();
            this.baseLayers = {};
            this.initMap();

            $messageBus.subscribe('timeline',(title: string, data) => {
                switch (title) {
                    case 'isEnabled':
                        this.timelineVisible = data;
                        break;
                }
            });

            $messageBus.subscribe('leftmenu',(title: string, data) => {
                switch (title.toLowerCase()) {
                    case "toggle":
                        if ($('body').hasClass("leftpanel-collapsed")) {
                            $('body').removeClass("leftpanel-collapsed");
                        } else {
                            $('body').addClass("leftpanel-collapsed");
                        }
                        break;
                    case "hide":
                        if (!$('body').hasClass("leftpanel-collapsed")) $('body').addClass("leftpanel-collapsed");                        
                        break;
                    case "show":
                        if ($('body').hasClass("leftpanel-collapsed")) $('body').removeClass("leftpanel-collapsed");
                        break;
                }
            });
        }

        /**
        * The expert mode can either be set manually, e.g. using this directive, or by setting the expertMode property in the
        * project.json file. In neither are set, we assume that we are dealing with an expert, so all features should be enabled.
        * 
        * Precedence:
        * - when a declaration is absent, assume Expert.
        * - when the mode is set in local storage, take that value.
        * - when the mode is set in the project.json file, take that value. 
        */
        private initExpertMode() {
            this.expertMode = this.$localStorageService.get(MapService.expertModeKey);
            if (!this.expertMode) {
                this.expertMode = Expertise.Expert; // Default behaviour
                // When a project defines the expert mode, overrules default behaviour
                this.$messageBus.subscribe('project',(title: string, project: csComp.Services.Project) => {
                    switch (title) {
                        case 'loaded':
                            if (project != null && typeof project.expertMode !== 'undefined')
                                this.$messageBus.publish('expertMode', 'newExpertise', project.expertMode);
                            break;
                    }
                });
            }

            this.$messageBus.subscribe('expertMode',(title: string, expertMode: Expertise) => {
                if (title !== 'newExpertise') return;
                this.expertMode = expertMode;
                this.$localStorageService.set(csComp.Services.MapService.expertModeKey, expertMode); // You first need to set the key
                switch (expertMode) {
                    case Expertise.Intermediate:
                    case Expertise.Expert:
                        this.timelineVisible = true;
                        this.$timeout(() => {this.$messageBus.publish('timeline', 'loadProjectTimeRange')}, 100); 
                        break;
                    default:
                        this.timelineVisible = false;
                        break;
                }
            });
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
        public zoomTo(feature: IFeature,zoomLevel : number = 14) {
            var center: L.LatLng;
            if (feature.geometry.type.toUpperCase() == 'POINT') {
                center = new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                this.map.setView(center, zoomLevel);
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
            this.$messageBus.publish("sidebar", "show");
            this.$messageBus.publish("feature", "onFeatureSelect", feature);
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
