module Indicators {
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
      * Directive to display the available map layers.
      */
    myModule.directive('indicators', [
        '$compile',
        function($compile): ng.IDirective {
            return {
                terminal: true,    // do not compile any other internal directives
                restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                scope: {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Widgets/Indicators/Indicators.tpl.html',
                compile: el => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                    var fn = $compile(el);
                    return scope => {
                        fn(scope);
                    };
                },
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: IndicatorsCtrl
            }
        }
    ]).filter('datasource', () => {
        return (input, scope: ng.IScope) => {
            if (!input) return "";
            var r = scope.$parent.$eval(input.replace('~', 'i._value'));
            return r;
        };
    });
}
