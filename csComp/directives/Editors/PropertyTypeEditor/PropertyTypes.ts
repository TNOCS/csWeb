module PropertyTypes {
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
      * Directive to display a feature's properties in a panel.
      *
      * @seealso          : http://www.youtube.com/watch?v=gjJ5vLRK8R8&list=UUGD_0i6L48hucTiiyhb5QzQ
      * @seealso          : http://plnkr.co/edit/HyBP9d?p=preview
      */
    myModule.directive('propertytypes', ['$compile',
        function($compile): ng.IDirective {
            return {
                terminal: false,       // do not compile any other internal directives
                restrict: 'E',        // E = elements, other options are A=attributes and C=classes
                scope: {},         // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Editors/PropertyTypeEditor/PropertyTypes.tpl.html',
                replace: true,   // Remove the directive from the DOM
                transclude: true,   // Add elements and attributes to the template
                controller: PropertyTypesCtrl
            }
        }
    ])
        .directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });
}
