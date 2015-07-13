module MapElement {
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
    myModule.directive('map', [
        '$window', '$compile',
        function($window, $compile): ng.IDirective {
            return {
                terminal: false, // do not compile any other internal directives
                restrict: 'E', // E = elements, other options are A=attributes and C=classes
                scope: {
                    mapid: '='
                }, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                //templateUrl: 'directives/MapElement/MapElement.tpl.html',
                templateUrl: 'directives/MapElement/MapElement.tpl.html',
                link: (scope: any, element, attrs) => {
                    //scope.mapid = attrs.mapid;
                    //var s = jQuery.parseJSON(attrs.param);
                    //scope.initDashboard();

                },
                replace: false,
                transclude: true, // Add elements and attributes to the template
                controller: MapElementCtrl
            }
        }
    ]);

}
