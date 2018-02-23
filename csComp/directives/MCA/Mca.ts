module Mca {
    'use strict';

    /**
     * Config
     */
    var moduleName = 'csComp';

    /**
     * Module
     */
    export var myModule : ng.IModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    /**
     * Directive to display an MCA control.
     */
    myModule
        .directive('mca', [
            '$window', '$compile', '$templateCache',
            function ($window, $compile): ng.IDirective {
                return {
                    terminal: true,  // do not compile any other internal directives
                    restrict: 'EA',  // E = elements, other options are A=attributes and C=CSS classes
                    scope: {},       // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                    templateUrl: 'directives/MCA/Mca.tpl.html',
                    compile: (el => { // I need to explicitly compile it in order to use interpolation like {{xxx}}
                        var fn = $compile(el);
                        return scope => {
                            fn(scope);
                        };
                    }) as ng.IDirectiveCompileFn,
                    replace: true,    // Remove the directive from the DOM
                    transclude: true, // Add elements and attributes to the template
                    controller: McaCtrl
                }
            }
        ]);
}
