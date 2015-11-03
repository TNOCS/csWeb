module Legend {
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
      * Directive to display a legend in a widget.
      */
    myModule.directive('legendDirective', [
        '$compile',
        function($compile) : ng.IDirective {
            return {
                terminal   : true,    // do not compile any other internal directives
                restrict   : 'E',     // E = elements, other options are A=attributes and C=classes
                scope      : {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Legend/Legend.tpl.html',
                compile    : el => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                    var fn = $compile(el);
                    //console.log('this is the compile function of legendDirective');
                    return scope => {
                        fn(scope);
                    }; 
                },
                replace      : true,    // Remove the directive from the DOM
                transclude   : true,    // Add elements and attributes to the template
                controller   : LegendCtrl
            }
        }
    ]);
}
