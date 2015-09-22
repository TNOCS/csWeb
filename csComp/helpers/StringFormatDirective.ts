module StringFormat {
    /**
     * Config
     */
    var moduleName = 'csComp';

    declare var String;

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
    myModule.directive('stringy', ['$compile',
        function($compile): ng.IDirective {
            return {
                require: "ngModel",
                terminal: false, // do not compile any other internal directives
                restrict: 'A', // E = elements, other options are A=attributes and C=classes
                scope: {}, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                link: (scope: ng.IScope, element, attr, ngModel: any) => {
                    scope.$watch(() => {
                        return ngModel.$modelValue;
                    }, (modelValue) => {
                            element[0].innerText = String.format("{0:0,0}", ngModel.$modelValue);
                        });

                }
            }
        }
    ]);

}
