module csComp.Services {
    'use strict';

    export class Coordinates {
        public accuracy: number;
        public latitude: number;
        public longitude: number;
    }

    export class Geoposition {
        public coords: Coordinates;
        public timestamp: number;
    }


    export class GeoService {



        public position: Geoposition;

        public geolocation_msgs = {
            'errors.location.unsupportedBrowser': 'Browser does not support location services',
            'errors.location.permissionDenied': 'You have rejected access to your location',
            'errors.location.positionUnavailable': 'Unable to determine your location',
            'errors.location.timeout': 'Service timeout has been reached'
        }

        static $inject = [
            'messageBusService',
            '$rootScope',
            '$window',
            '$q'
        ];

        constructor(
            public bus: Services.MessageBusService,
            public $rootScope: ng.IRootScopeService,
            public $window: ng.IWindowService,
            public $q: ng.IQService
            ) {

        }

        public getLocation(): any {
            return this.position;
        }

        public start() {
            var opts = {
                enableHighAccuracy: true,
                maximumAge: 3000
            };
            if (this.$window.navigator && this.$window.navigator.geolocation) {
                this.$window.navigator.geolocation.watchPosition((position: Geoposition) => {
                    this.position = position;
                    this.bus.publish('geo', 'pos', position);
                }, (error) => {
                        alert(error);
                        switch (error.code) {
                            case 1:
                                // this.$rootScope.$broadcast('error', this.geolocation_msgs['errors.location.permissionDenied']);
                                // this.$rootScope.$apply(function() {
                                //     deferred.reject(this.geolocation_msgs['errors.location.permissionDenied']);
                                // });
                                break;
                            case 2:
                                // this.$rootScope.$broadcast('error', this.geolocation_msgs['errors.location.positionUnavailable']);
                                // this.$rootScope.$apply(function() {
                                //     deferred.reject(this.geolocation_msgs['errors.location.positionUnavailable']);
                                // });
                                break;
                            case 3:
                                // this.$rootScope.$broadcast('error', this.geolocation_msgs['errors.location.timeout']);
                                // this.$rootScope.$apply(function() {
                                //     deferred.reject(this.geolocation_msgs['errors.location.timeout']);
                                // });
                                break;
                        }
                    }, opts);
            }
            else {
                // this.$rootScope.$broadcast('error', this.geolocation_msgs['errors.location.unsupportedBrowser']);
                // this.$rootScope.$apply(function() { deferred.reject(this.geolocation_msgs['errors.location.unsupportedBrowser']); });
            }
            return;
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

    myModule.service('geoService', csComp.Services.GeoService)
}
