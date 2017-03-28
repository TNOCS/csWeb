module csComp.Services {
    export interface IProfile {
        [key: string]: string | number | boolean | Object;
    }

    export interface IJwtToken {
        _id?: string;
        name?: string;
        email?: string;
        createdAt?: string;
        expires?: string;
        subscribed?: string;
        verified?: string;
        admin?: string;
        iat?: number;
        exp?: number;
    }

    /**
     * Helper class to decode a JWT token (public part)
     *
     * Source extracted from: https://github.com/auth0/jwt-decode
     *
     * @export
     * @class JwtDecoder
     */
    export class JwtDecoder {
        /**
         * Decode the JWT and return the public info.
         *
         * @static
         * @param {string} token JWT token
         * @param {boolean} [containsHeader=true] In case it also contains non-public info
         * @returns {IJwtToken}
         *
         * @memberOf JwtDecoder
         */
        public static decode(token: string, containsHeader = true): IJwtToken {
            const atob = (input: string) => {
                let message: string;
                /**
                 * The code was extracted from:
                 * https://github.com/davidchambers/Base64.js
                 */
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

                const InvalidCharacterError = (newMessage) => {
                    message = newMessage;
                };

                InvalidCharacterError.prototype = new Error();
                InvalidCharacterError.prototype.name = 'InvalidCharacterError';

                const polyfill = (input) => {
                    var str = String(input).replace(/=+$/, '');
                    if (str.length % 4 === 1) {
                        throw new InvalidCharacterError('"atob" failed: The string to be decoded is not correctly encoded.');
                    }
                    for (
                        // initialize result and counters
                        var bc = 0, bs, buffer, idx = 0, output = '';
                        // get next character
                        buffer = str.charAt(idx++);
                        // character found in table? initialize bit storage and add its ascii value;
                        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
                            // and if not first of each 4 characters,
                            // convert the first 8 bits to one ascii character
                            bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
                    ) {
                        // try to find character in table (0-63, not found => -1)
                        buffer = chars.indexOf(buffer);
                    }
                    return output;
                };

                return polyfill(input);
            };

            const decodeURIComponent = (str: string, containsHeader = true) => {
                str = str.split('.')[containsHeader ? 1 : 0];
                let output = str.replace(/-/g, '+').replace(/_/g, '/');
                switch (output.length % 4) {
                    case 0:
                        break;
                    case 2:
                        output += '==';
                        break;
                    case 3:
                        output += '=';
                        break;
                    default:
                        throw 'Illegal base64url string!';
                }
                return atob(output);
            };
            if (!token) { return <IJwtToken>{}; }
            return JSON.parse(decodeURIComponent(token, containsHeader));
        }
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
        public validate?: (username: string, password: string, cb: (success: boolean, profile?: IProfile) => void) => void;
        /**
         * Update the user profile. The function must be configured explicitly.
         * @memberOf ProfileService
         */
        public update?: (profile: IProfile, cb: (error: Error) => void) => void;
        public logout: Function;
        public signup: Function;
        private isValidating: boolean;
        private isSignupping: boolean;
        private profile?: IProfile;
        private jwtToken: string;
        private jwtDecoded: IJwtToken;

        public static $inject = [
            'localStorageService',
            '$timeout',
            '$http',
            'messageBusService'
        ];

        constructor(
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $timeout: ng.ITimeoutService,
            private $http: ng.IHttpService,
            private $messageBusService: csComp.Services.MessageBusService
        ) {
            this.jwtDecoded = JwtDecoder.decode(this.token);
            if (this.jwtDecoded.exp) {
                const expiresInMsec = Date.parse(this.jwtDecoded.expires) - Date.now();
                if (expiresInMsec > 0) {
                    this.addJwtToHeader();
                    this.loggedIn = true;
                    this.userProfile = this.$localStorageService.get('profile');
                    setTimeout(() => this.validateUser(), expiresInMsec - 5 * 60 * 1000);
                }
            }
        }

        /**
         * Returns the user profile when logged in successfully.
         * @memberOf ProfileService
         */
        public get userProfile(): IProfile {
            return this.loggedIn ? this.profile : {};
        }

        public set userProfile(profile: IProfile) {
            this.profile = profile;
            this.$localStorageService.set('profile', profile);
            if (!_.isFunction(this.update)) return;
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

        public validateUser(userName?: string, userPassword?: string) {
            if (_.isFunction(this.validate) && !this.isValidating) {
                this.isValidating = true;
                this.validate(userName, userPassword, (success: boolean, profile?: IProfile) => {
                    this.isValidating = false;
                    this.loggedIn = success;
                    if (this.loggedIn) {
                        this.userProfile = profile;
                        this.$messageBusService.publish('profileservice', 'login', profile);
                    } else {
                        this.$messageBusService.notify('Login Result', 'Login Failed');
                    }
                });
            }
        }

        public signupUser(name?: string, userName?: string, userPassword?: string) {
            if (_.isFunction(this.signup) && !this.isSignupping) {
                this.isSignupping = true;
                this.signup(name, userName, userPassword, (success: boolean, profile?: IProfile) => {
                    this.isSignupping = false;
                    this.loggedIn = success;
                    if (this.loggedIn) {
                        this.userProfile = profile;
                        this.$messageBusService.publish('profileservice', 'login', profile);
                        this.$messageBusService.notify('Login Result', 'Signed up and logged in successfully');
                    } else {
                        this.$messageBusService.notify('Login Result', 'Signup Failed');
                    }
                });
            }
        }

        public logoutUser() {
            this.loggedIn = false;
            this.clearToken();
            this.$messageBusService.publish('profileservice', 'logout');
            if (_.isFunction(this.logout)) {
                this.logout();
            }
        }

        /**
         * Returns the JSON Web Token, if available.
         *
         * @memberOf ProfileService
         */
        public get token() {
            if (this.jwtToken) { return this.jwtToken; }
            this.jwtToken = this.$localStorageService.get('jwt') || '';
            return this.jwtToken;
        }

        /**
         * Sets the JSON Web Token
         *
         * @memberOf ProfileService
         */
        public set token(myToken: string) {
            this.addJwtToHeader();
            this.jwtToken = myToken;
            this.$localStorageService.set('jwt', myToken);
        }

        /**
         * Clears the token in the localStorage
         *
         * @memberOf ProfileService
         */
        public clearToken() {
            this.token = '';
            this.userProfile = {};
        }

        /**
         * Add JSON Web Token to the http header.
         * See also: https://docs.angularjs.org/api/ng/service/$http
         *
         * @private
         * @returns
         *
         * @memberOf ProfileService
         */
        private addJwtToHeader() {
            const token = this.token;
            if (!token) { return; }
            this.$http.defaults.headers.common.Authorization = token;
            console.log('Security token set.');
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
