module FeatureList {
    /**
      * Config
      */
    var moduleName = 'csWeb.featureList';   

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
    myModule.directive('featureList', [
        '$window', '$compile',
        function ($window, $compile)  : ng.IDirective {
            return {
                terminal              : false, // do not compile any other internal directives 
                restrict              : 'E', // E   = elements, other options are A=attributes and C=classes
                scope                 : {}, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                template              : html, // I use gulp automatian to compile the FeatureProperties.tpl.html to a simple TS file, FeatureProperties.tpl.ts, which contains the html as string. The advantage is that you can use HTML intellisence in the html file.
                //compile             : el          => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                //    var fn                        = $compile(el);
                //    return scope                  => { 
                //        fn(scope);
                //    };
                //},

                // Directives that want to modify the DOM typically use the link option.link takes a function with the following signature, function link(scope, element, attrs) { ... } where:
                // scope is an Angular scope object.
                // element is the jqLite - wrapped element that this directive matches.
                // attrs is a hash object with key - value pairs of normalized attribute names and their corresponding attribute values.
                link : (scope: any, element, attrs) => {
                    // Deal with resizing the element list
                    scope.onResizeFunction          = () => {
                        var filterHeight            = 50;
                        var paginationCtrlHeight    = 100;
                        var itemHeight              = 60;
                        //scope.windowHeight          = $window.innerHeight;
                        //scope.windowWidth           = $window.innerWidth;
                        scope.numberOfItems         = Math.floor(($window.innerHeight - filterHeight - paginationCtrlHeight) / itemHeight);
                    };
                    
                    // Call to the function when the page is first loaded
                    scope.onResizeFunction();

                    angular.element($window).bind('resize', () => {
                        scope.onResizeFunction();
                        scope.$apply();
                    });
                },
                replace      : true,    // Remove the directive from the DOM
                transclude   : true,    // Add elements and attributes to the template
                controller   : FeatureListCtrl
            }
        }
    ]).directive('bsPopover', () => {
            return (scope, element, attrs) => {
                element.find("a[rel=popover]").popover({ placement: 'right', html: 'true' });
            };
        });

}  