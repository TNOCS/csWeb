module ProfileHeader {
    import Expertise = csComp.Services.Expertise;

    export interface IProfileHeaderScope extends ng.IScope {
        vm: ProfileHeaderCtrl;
        enabled: boolean;
    }

    export class ProfileHeaderCtrl {
        public static $inject = [
            '$scope',
            'localStorageService',
            'layerService',
            'mapService',
            'messageBusService',
            'profileService'
        ];

        public startLogin() {
            this.profileService.startLogin();
        }

        public logout() {
            this.profileService.logoutUser();
        }

        constructor(
            private $scope: IProfileHeaderScope,
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBus: csComp.Services.MessageBusService,
            public profileService: csComp.Services.ProfileService
        ) {
            $scope.vm = this;
            console.log('init profile service');

            $messageBus.subscribe('project', (action, value) => {
                if (this.$layerService.project) {
                    this.$scope.enabled = this.$layerService.project.profile.authenticationMethod !== csComp.Services.authMethods.none;
                    console.log(this.$layerService.project.profile.authenticationMethod);
                    switch (this.$layerService.project.profile.authenticationMethod) {
                    }
                }
            });
        }
    }

    /**
* Config
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

    /**
      * Directive to set the expert mode, so we can determine what the user should see (degree of difficulty).
      * The expert mode can either be set manually, e.g. using this directive, or by setting the expertMode property in the
      * project.json file. In neither are set, we assume that we are dealing with an expert, so all features should be enabled.
      *
      * Precedence:
      * - when a declaration is absent, assume Expert.
      * - when the mode is set in local storage, take that value.
      * - when the mode is set in the project.json file, take that value.
      *
      * As we want the expertMode to be always available, we have added it to the MapService service.
      */
    myModule
        .directive('profileHeader', [
            '$compile',
            function ($compile): ng.IDirective {
                return {
                    terminal: true,
                    restrict: 'E',
                    scope: {},
                    templateUrl: 'directives/Profile/ProfileHeader.tpl.html',
                    compile: el => {  // I need to explicitly compile it in order to use interpolation like {{xxx}}
                        var fn = $compile(el);
                        return scope => {
                            fn(scope);
                        };
                    },
                    //link: function (scope, element, attrs) {
                    //     // Since we are wrapping the rating directive in this directive, I couldn't use transclude,
                    //     // so I copy the existing attributes manually.
                    //     var attributeString = '';
                    //     for (var key in attrs) {
                    //         if (key.substr(0, 1) !== '$' && attrs.hasOwnProperty(key)) attributeString += key + '="' + attrs[key] + '" ';
                    //     }
                    //     var html = '<rating ng-model="expertMode" '
                    //         + attributeString
                    //         + 'tooltip-html-unsafe="{{\'EXPERTMODE.EXPLANATION\' | translate}}" tooltip-placement="bottom" tooltip-trigger="'mouseenter'" tooltip-append-to-body="false"'
                    //         + 'max="3"></rating>';
                    //     var e = $compile(html)(scope);
                    //     element.replaceWith(e);
                    // },
                    replace: true,     // Remove the directive from the DOM
                    transclude: true,  // Add elements and attributes to the template
                    controller: ProfileHeaderCtrl
                };
            }
        ]);
}
