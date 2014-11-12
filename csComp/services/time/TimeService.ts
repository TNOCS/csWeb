module csComp.Services {
    'use strict';


    /*
     * Singleton service that holds a reference to the map. 
     * In case other controllers need access to the map, they can inject this service. 
     */
    export class TimeService {
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
            
        }

    }
}