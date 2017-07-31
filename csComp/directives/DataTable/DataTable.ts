module DataTable {
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
     * @seealso : http://www.youtube.com/watch?v=gjJ5vLRK8R8&list=UUGD_0i6L48hucTiiyhb5QzQ
     * @seealso : http://plnkr.co/edit/HyBP9d?p=preview
     */
    myModule.directive('datatable', ['$compile',
        function ($compile): ng.IDirective {
            return {
                terminal: false, // do not compile any other internal directives
                restrict: 'E', // E = elements, other options are A=attributes and C=classes
                scope: {}, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/DataTable/DataTable.tpl.html',
                replace: true, // Remove the directive from the DOM
                transclude: true, // Add elements and attributes to the template
                controller: DataTableCtrl
            }
        }
    ]);

    myModule.filter('filterRows', [function () {
        return (input, query) => {
            if (!query || typeof query !== 'string') return input;
            let lcQuery = query.toLowerCase();
            return input.filter((cols: TableField[]) => {
                return cols.some((i: TableField) => { return i && typeof i.displayValue === 'string' && i.displayValue.toLowerCase().indexOf(lcQuery) >= 0; });
            });
        };
    }]);

    myModule.directive('fitRows', ['$window',
        function ($window): ng.IDirective {
            return {
                terminal: false, // do not compile any other internal directives
                // E = elements, A=attributes and C=css classes. Can be compined, e.g. EAC
                restrict: 'A',
                // Name if optional. Text Binding (Prefix: @), One-way Binding (Prefix: &), Two-way Binding (Prefix: =)
                scope: {
                    rowheight: '@',
                    tablepadding: '@'
                },
                // Directives that want to modify the DOM typically use the link option.link takes a function with the following signature, function link(scope, element, attrs) { ... } where:
                // * scope is an Angular scope object.
                // * element is the jqLite wrapped element that this directive matches.
                // * attrs is a hash object with key-value pairs of normalized attribute names and their corresponding attribute values.
                link: (scope: any, element, attrs) => {
                    scope.onResizeFunction = () => {
                        if (scope.rowheight) {
                            var windowHeight = $window.innerHeight;
                            var tableHeight = windowHeight - +scope.tablepadding;
                            if (scope.$parent && scope.$parent.$parent && scope.$parent.$parent.vm) {
                                scope.$parent.$parent.vm.numberOfItems = (+tableHeight / +scope.rowheight).toFixed(0);
                            }
                        }
                    };

                    // Call to the function when the page is first loaded
                    scope.onResizeFunction();

                    // Listen to the resize event.
                    angular.element($window).bind('resize', () => {
                        scope.onResizeFunction();
                        scope.$apply();
                    });
                }
            };
        }
    ]);
}
