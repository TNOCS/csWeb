module Heatmap {
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
     * Directive to display a heatmap control.
     */
    myModule
        .directive('heatmap', [
            '$window', '$compile',
            function ($window, $compile, $templateCache): ng.IDirective {
                return {
                    terminal: true,  // do not compile any other internal directives
                    restrict: 'EA',  // E = elements, other options are A=attributes and C=CSS classes
                    scope: {},       // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                    templateUrl: 'directives/Heatmap/Heatmap.tpl.html',
                    compile: el => { // I need to explicitly compile it in order to use interpolation like {{xxx}}
                        var fn = $compile(el);
                        return scope => {
                            fn(scope);
                        };
                    },
                    replace: true,    // Remove the directive from the DOM
                    transclude: true, // Add elements and attributes to the template
                    controller: HeatmapCtrl
                }
            }
        ]);
}
