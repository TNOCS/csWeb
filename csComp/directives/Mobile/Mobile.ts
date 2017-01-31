module Mobile {
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
    myModule.directive('mobile', [
        '$window', '$compile',
        function($window, $compile): ng.IDirective {
            return {
                terminal: true,  // do not compile any other internal directives
                restrict: 'E',    // E = elements, other options are A=attributes and C=classes
                scope: {},     // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Mobile/Mobile.tpl.html',
                link: (scope: any, element, attrs) => { },
                replace: false,    // Remove the directive from the DOM
                transclude: false,    // Add elements and attributes to the template
                controller: MobileCtrl
            }
        }
    ]);

}
