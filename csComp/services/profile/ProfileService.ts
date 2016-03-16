module csComp.Services {
    'use strict';

    /*
     * Singleton service that holds a reference to the map.
     * In case other controllers need access to the map, they can inject this service.
     */
    export class ProfileService {
        
        public static $inject = [
            
            'localStorageService',
            '$timeout',
            'messageBusService'

        ];

        
        constructor(            
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $timeout: ng.ITimeoutService,
            private $messageBusService: csComp.Services.MessageBusService
        ) {

         
            
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

    myModule.service('profileService', csComp.Services.ProfileService);
}
