module csComp.Services {
    'use strict';

    /*
     * Singleton service that holds a reference to the map.
     * In case other controllers need access to the map, they can inject this service.
     */
    export class ProfileService {
        
        public loggedIn : boolean;
        public validate : Function;
        public logout : Function;
        
        public static $inject = [
            
            'localStorageService',
            '$timeout',
            'messageBusService'

        ];
        
        
        public startLogin()
        {
            var rpt = csComp.Helpers.createRightPanelTab('profile', 'profiletab', null, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'user',true,false);
            this.$messageBusService.publish('rightpanel', 'activate', rpt); 
        }
        
        public validateUser(userName, userPassword)
        {
           if (_.isFunction(this.validate))
           {
               this.validate(userName, userPassword,(status : boolean,profile)=>{
                   this.loggedIn = status;
                   if (!this.loggedIn)
                   {
                       this.$messageBusService.notify("Login Result","Login Failed");
                   }
               })
           } 
        }
        
        public logoutUser()
        {
            this.loggedIn = false;
            if (_.isFunction(this.logout))
            {
               this.logout();
            }
        }

        
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
