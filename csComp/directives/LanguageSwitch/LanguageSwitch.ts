module LanguageSwitch {
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

    myModule.directive('languageSwitch', [ '$compile', function ($compile): ng.IDirective {
                return {
                    terminal: true,    // do not compile any other internal directives
                    restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                    scope: {},         // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                    templateUrl: 'directives/LanguageSwitch/LanguageSwitch.tpl.html',
                    compile: (el => {   // I need to explicitly compile it in order to use interpolation like {{xxx}}
                        var fn = $compile(el);
                        return scope => {
                            fn(scope);
                        };
                    }) as ng.IDirectiveCompileFn,
                    replace   : true,     // Remove the directive from the DOM
                    transclude: true,     // Add elements and attributes to the template
                    controller: LanguageSwitchCtrl
                }
            }
        ])
        // The provider allows you to configure the GUI languages that you wish to use.
        .provider('$languages', function() {
            this.languages = [];
            this.$get = function () {
                return this.languages;
            };

            this.setLanguages = function (languages) {
                this.languages = languages;
            };
        });
}
