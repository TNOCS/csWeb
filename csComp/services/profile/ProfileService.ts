module csComp.Services {
    export interface IProfile {
        [key: string]: string | number | boolean | Object;
    }

    /*
     * Singleton service that holds a reference to the map.
     * In case other controllers need access to the map, they can inject this service.
     */
    export class ProfileService {
        public loggedIn: boolean;
        /**
         * Validate the user. The function must be configured explicitly.
         * @memberOf ProfileService
         */
        public validate?: (username: string, password: string, cb: (success: boolean, token?: string, profile?: IProfile) => void) => void;
        /**
         * Update the user profile. The function must be configured explicitly.
         * @memberOf ProfileService
         */
        public update?: (profile: IProfile, cb: (error: Error) => void) => void;
        public logout: Function;
        private isValidating: boolean;
        private profile?: IProfile;

        public static $inject = [
            'localStorageService',
            '$timeout',
            'messageBusService'
        ];

        constructor(
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $timeout: ng.ITimeoutService,
            private $messageBusService: csComp.Services.MessageBusService
        ) { }

        /**
         * Returns the user profile when logged in successfully.
         * @memberOf ProfileService
         */
        public get userProfile(): IProfile {
            return this.loggedIn ? this.profile : {};
        }
        public set userProfile(profile: IProfile) {
            this.update(profile, error => {
                if (error) {
                    this.$messageBusService.notify('profile', `update_failed: ${error.message}`);
                } else {
                    this.profile = profile;
                    this.$messageBusService.notify('profile', 'update_ok');
                }
            });
        }

        public startLogin() {
            var rpt = csComp.Helpers.createRightPanelTab('profile', 'profiletab', null, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'user', true, false);
            this.$messageBusService.publish('rightpanel', 'activate', rpt);
        }

        public validateUser(userName, userPassword) {
            if (_.isFunction(this.validate) && !this.isValidating) {
                this.isValidating = true;
                this.validate(userName, userPassword, (success: boolean, token?: string, profile?: IProfile) => {
                    this.isValidating = false;
                    this.loggedIn = success;
                    if (this.loggedIn) {
                        this.profile = profile;
                    } else {
                        this.$messageBusService.notify('Login Result', 'Login Failed');
                    }
                });
            }
        }

        public logoutUser() {
            this.loggedIn = false;
            if (_.isFunction(this.logout)) {
                this.logout();
            }
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
