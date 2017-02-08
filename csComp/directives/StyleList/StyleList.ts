module StyleList {
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
    myModule
        .filter('sortLegend', function() {
            return (legendItems: csComp.Services.LegendEntry[]) => {
                if (_.pluck(legendItems, 'sortKey').filter( function(item) {return item != undefined; }).length === legendItems.length) {
                    return legendItems.sort((a, b) => { return a.sortKey.localeCompare(b.sortKey); });
                } else {
                    return legendItems.slice().reverse();
                }
            };
        })
        .directive('styleList', ['$window', '$compile', function ($window, $compile)  : ng.IDirective {
            return {
                terminal  : false,  // do not compile any other internal directives
                restrict  : 'E',    // E = elements, other options are A=attributes and C=classes
                scope     : {},     // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/StyleList/StyleList.tpl.html',
                //compile             : el          => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                //    var fn                        = $compile(el);
                //    return scope                  => {
                //        fn(scope);
                //    };
                //},
                link: (scope: any, element, attrs) => { },
                replace   : true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: StyleListCtrl
            }
        }
    ]);
}
