module Helpers.Resize {
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
    };

    /**
      * Directive to resize an element by settings its width or height,
      * for example to make sure that the scrollbar appears.
      * Typical usage:
      * <div style="overflow-y: auto; overflow-x: hidden" resize resize-x="20" resize-y="250">...</div>
      * Load the directive in your module, e.g.
      * angular.module('myWebApp', ['csWeb.resize'])
      */
    myModule.directive('resize', [ '$window',
        function ($window): ng.IDirective {
            return {
                terminal: false, // do not compile any other internal directives
                // E = elements, A=attributes and C=css classes. Can be compined, e.g. EAC
                restrict: 'A',
                // Name if optional. Text Binding (Prefix: @), One-way Binding (Prefix: &), Two-way Binding (Prefix: =)
                scope: {
                    resizeX: '@',
                    resizeY: '@',
                    resizeRelativeToParent: '@'
                },
                // Directives that want to modify the DOM typically use the link option.link takes a function with the following signature, function link(scope, element, attrs) { ... } where:
                // * scope is an Angular scope object.
                // * element is the jqLite wrapped element that this directive matches.
                // * attrs is a hash object with key-value pairs of normalized attribute names and their corresponding attribute values.
                link: (scope: any, element, attrs) => {
                    scope.onResizeFunction = () => {
                        // console.log(scope.resizeX + "-" + scope.resizeY);
                        let height, width;
                        if (scope.resizeRelativeToParent) {
                            height = element.parent().innerHeight();
                            width = element.parent().innerWidth();
                        } else {
                            height = $window.innerHeight;
                            width = $window.innerWidth;
                        }
                        if (scope.resizeX) {
                            element.width((width - +scope.resizeX) + 'px');
                        }
                        if (scope.resizeY) {
                            element.height((height - +scope.resizeY) + 'px');
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

    var inputresizerApp = angular.module('inputresizer', []);

myModule.directive('expandTo', ()=> {
    return {
      restrict: 'A',
      link: ($scope, $element, $attributes)=> {
        var expandsize = $attributes['expandTo'] || '50px';
        var original = $element.width();
        $element.on('focus', ()=>{
          $element.animate({
            width: expandsize
          }, 500, () => {
            // Animation complete.
          });
        }).on('blur', ()=>{
          $element.animate({
            width: original + 'px'
          }, 500, ()=> {
            // Animation complete.
          });
        });
      }
    }
  })
}
