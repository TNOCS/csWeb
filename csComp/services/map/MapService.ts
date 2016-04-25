module csComp.Services {
    'use strict';

    declare var L;

    /*
     * Singleton service that holds a reference to the map.
     * In case other controllers need access to the map, they can inject this service.
     */
    export class MapService {
        private static expertModeKey = 'expertMode';
        private scale: any;
        private showLocation = false;

        public static $inject = [
            'localStorageService',
            '$timeout',
            'messageBusService'
        ];

        public map: L.Map;
        public baseLayers: any;
        public drawingLayer: ProjectLayer;
        public drawingFeatureType: csComp.Services.IFeatureType
        public activeBaseLayer: BaseLayer;
        public activeBaseLayerId: string;
        public mapVisible: boolean = true;
        public rightMenuVisible: boolean = true;
        public maxBounds: IBoundingBox;
        public drawInstance: any;
        public featureGroup: L.ILayer;
        public drawingNotification : any;

        private _timelineVisible: boolean = false;
        public get timelineVisible() { return this._timelineVisible; }
        public set timelineVisible(val: boolean) {
            this._timelineVisible = val;
            setTimeout(() => {
                let windowHeight = $(window).height();
                $('#map').height(windowHeight - (this._timelineVisible ? $('#timeline').height() : 0));
            }, 300);
        }

        expertMode: Expertise;

        constructor(
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $timeout: ng.ITimeoutService,
            private $messageBusService: csComp.Services.MessageBusService
        ) {

            this.initExpertMode();
            this.baseLayers = {};

            $messageBusService.subscribe('timeline', (title: string, data) => {
                switch (title) {
                    case 'isEnabled':
                        this.timelineVisible = data;
                        if (this.timelineVisible) {
                            this.$timeout(() => {
                                this.$messageBusService.publish('timeline', 'loadProjectTimeRange');
                            }, 100);
                        }
                        break;
                }
            });

            $messageBusService.subscribe('map', (action: string, data) => {
                switch (action.toLowerCase()) {
                    case 'setextent':
                        // console.log(data);
                        // take the navbar and leftpanel into account using padding (50px height, 370px left)
                        this.map.fitBounds(new L.LatLngBounds(data.southWest, data.northEast), { paddingTopLeft: new L.Point(370, 50) });
                        break;
                    case 'setzoom':
                        // Zoom to a location on the map.
                        this.map.setZoomAround(data.loc, data.zoom || 16);
                        break;
                    case 'showscale':
                        if (data) {
                            this.scale = L.control.scale({
                                // Position, i.e. bottomleft, topright, topleft, bottomright
                                position: 'bottomleft',
                                maxWidth: 100,
                                metric: true,
                                imperial: false,
                                // If true, the control is updated on moveend, otherwise it's always up-to-date (updated on move).
                                updateWhenIdle: true
                            }).addTo(this.map);
                        } else if (this.scale) {
                            this.map.removeControl(this.scale);
                        }
                        break;
                    case 'showlocation':
                        if (this.showLocation) {
                            this.showLocation = false;
                            this.map.on('click', null);
                        } else {
                            this.showLocation = true;
                            this.map.on('click', (e: L.LeafletMouseEvent) => {
                                this.$messageBusService.publish('geocoding', 'reverselookup', e.latlng);
                            });
                        }
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
                this.$messageBusService.subscribe('project', (title: string, project: csComp.Services.Project) => {
                    switch (title) {
                        case 'loaded':
                            if (project != null && typeof project.expertMode !== 'undefined')
                                this.$messageBusService.publish('expertMode', 'newExpertise', project.expertMode);
                            break;
                    }
                });
            }

            this.$messageBusService.subscribe('expertMode', (title: string, expertMode: Expertise) => {
                if (title !== 'newExpertise') return;
                this.expertMode = expertMode;
                this.$localStorageService.set(csComp.Services.MapService.expertModeKey, expertMode); // You first need to set the key
            });
        }

        get isExpert(): boolean {
            return this.expertMode === Expertise.Expert || this.expertMode === Expertise.Admin;
        }

        get isIntermediate(): boolean {
            return this.expertMode === Expertise.Expert
                || this.expertMode === Expertise.Intermediate || this.expertMode === Expertise.Admin;
        }

        get isAdminExpert(): boolean {
            return this.expertMode === Expertise.Admin;
        }

        public getBaselayer(layer: string) {
            var layerObj: BaseLayer = this.baseLayers[layer];
            return layerObj;
        }

        public changeBaseLayer(layer: string) {
            var layerObj: BaseLayer = this.getBaselayer(layer);
            this.activeBaseLayer = layerObj;
            this.activeBaseLayerId = layer;
            this.$messageBusService.publish("baselayer", "activated", layer);
        }

        public invalidate() {
            this.map.invalidateSize(true);
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
        public zoomTo(feature: IFeature, zoomLevel: number = 14) {
            try {
                var center: L.LatLng;
                if (feature.geometry.type.toUpperCase() === 'POINT') {
                    center = new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                    this.map.setView(center, zoomLevel);
                } else {
                    var bb: Array<number>;
                    if (feature.geometry.type.toUpperCase().indexOf('MULTI') < 0) {
                        bb = this.getBoundingBox(feature.geometry.coordinates[0]);
                    } else { // MULTIPOLYGON or MULTILINESTRING
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
                this.$messageBusService.publish('sidebar', 'show');
                this.$messageBusService.publish('feature', 'onFeatureSelect', feature);
            } catch (e) {
                console.log('error zooming to feature');
            }
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


        public initDraw(layerService: csComp.Services.LayerService) {
            this.map.on('draw:created', (e: any) => {

                if (this.drawingLayer) {
                    if (this.drawingNotification) this.drawingNotification.remove();
                    var geometryType = "Point";

                    var c = [];
                    switch (this.drawingFeatureType.style.drawingMode) {
                        case "Line":
                            geometryType = "LineString";
                            e.layer._latlngs.forEach(ll => {
                                    c.push([ll.lng, ll.lat]);
                            });
                            break;
                        case "Polygon":
                            geometryType = "Polygon";
                            e.layer._latlngs.forEach(g => {
                                var inner = [];
                                g.forEach(ll=>{
                                    inner.push([ll.lng, ll.lat]);}
                                );
                                //Make sure first and last point are the same
                                if (inner.length > 1 && !_.isEqual(_.first(inner), _.last(inner))) {
                                    inner.push(_.first(inner));
                                }
                                c.push(inner);
                            });
                            break;
                    }

                    var f = <csComp.Services.Feature>{
                        type: "Feature",
                        geometry: { type: geometryType, "coordinates": c },
                        fType: this.drawingFeatureType,
                        properties: {}
                    };

                    f.properties["featureTypeId"] = csComp.Helpers.getFeatureTypeName(this.drawingFeatureType.id);

                    // Initialize properties
                    if (_.isArray(this.drawingFeatureType._propertyTypeData)) {
                        for (var k in this.drawingFeatureType._propertyTypeData) {
                            var pt = this.drawingFeatureType._propertyTypeData[k];
                            this.drawingFeatureType._propertyTypeData.forEach(pt => {
                                f.properties[pt.label] = _.isUndefined(pt.defaultValue) ? "" : pt.defaultValue;
                            })
                        }
                    }

                    var l = this.drawingLayer;
                    if (!l.data) l.data = {};
                    if (!l.data.features) l.data.features = [];
                    l.data.features.push(f);
                    layerService.initFeature(f, l);
                    layerService.calculateFeatureStyle(f);
                    layerService.activeMapRenderer.addFeature(f);
                    f.type = "Feature";
                    layerService.saveFeature(f);
                    console.log(f);
                }

                this.drawInstance.removeHooks();
                this.drawingFeatureType = null;

            });
        }

        /** start drawing line/polygon */
        public startDraw(layer: csComp.Services.ProjectLayer, featureType: csComp.Services.IFeatureType) {
            if (this.drawingFeatureType) return;
            this.drawingLayer = layer;
            this.drawingFeatureType = featureType;

            var opts = <any>{
                stroke: true,
                color: this.drawingFeatureType.style.strokeColor,
                weight: 4,
                opacity: 0.5,
                fill: false,
                clickable: true
            };
            switch (featureType.style.drawingMode)
            {
                case "Line":
                    this.drawInstance = new L.Draw.Polyline(this.map, opts);
                    break;
                case "Polygon":
                    opts.showArea = true;
                    this.drawInstance = new L.Draw.Polygon(this.map, opts);
                    opts.fill = true;
                    break;
            }

            this.drawInstance.addHooks();
            this.drawingNotification = this.$messageBusService.confirm("Drawing started","Use double-click or one of these options to end your drawing",(r)=>{
                if (r)
                {
                    this.drawInstance.completeShape();
                }
                else
                {
                    this.drawInstance.removeHooks();
                    this.drawingFeatureType = null;
                }
            });
        }
    }

    /**
      * Register service
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    myModule.service('mapService', csComp.Services.MapService);
}
