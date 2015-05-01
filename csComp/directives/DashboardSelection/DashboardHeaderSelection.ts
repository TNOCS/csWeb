module DashboarHeaderdSelection {
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
    myModule.directive('dashboardHeaderSelection', [
        '$window', '$compile',
        function ($window, $compile): ng.IDirective {
            return {
                terminal: false,  // do not compile any other internal directives
                restrict: 'E',    // E = elements, other options are A=attributes and C=classes
                scope: {},     // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/DashboardSelection/DashboardHeaderSelection.tpl.html',
                link: (scope: any, element, attrs) => {


                },
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: DashboardHeaderSelectionCtrl
            }
        }
    ]);

}
