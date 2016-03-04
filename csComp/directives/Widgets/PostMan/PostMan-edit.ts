module PostMan {
    /** Config */
    var moduleName = 'csComp';

    /** Module */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    /**
     * Directive (editor) to send a message to a REST endpoint. Similar in goal to the Chrome plugin POSTMAN.
     * Since this is an editor, the name of the directive is a convention: always use main directive name, plus Edit!
     */
    myModule.directive('postmanEdit', [function() : ng.IDirective {
            return {
                restrict   : 'E',     // E = elements, other options are A=attributes and C=classes
                scope      : {
                },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Widgets/PostMan/PostMan-edit.tpl.html',
                replace      : true,    // Remove the directive from the DOM
                transclude   : false,   // Add elements and attributes to the template
                controller   : PostManEditCtrl
            }
        }
    ]);
}
