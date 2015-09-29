module Directives.Clock {
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
      * Directive to show the time.
      */
    myModule.directive('clock', ['dateFilter', function(dateFilter) {
        return {
            restrict: 'E',
            scope: {
                time: '=',
                format: '@'
            },
            link: function(scope, element, attrs) {
                element.html(dateFilter(scope.time, scope.format));
            }
        };
    }]);
}
