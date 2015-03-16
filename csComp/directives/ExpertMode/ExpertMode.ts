module ExpertMode {
    /**  
  * Config
  */
    var moduleName = 'csWeb.expertMode';

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
      * Directive to set the expert mode, so we can determine what the user should see (degree of difficulty).
      * The expert mode can either be set manually, e.g. using this directive, or by setting the expertMode property in the
      * project.json file. In neither are set, we assume that we are dealing with an expert, so all features should be enabled.
      * 
      * Precedence:
      * - when a declaration is absent, assume Expert.
      * - when the mode is set in local storage, take that value.
      * - when the mode is set in the project.json file, take that value. 
      * 
      * As we want the expertMode to be always available, we have added it to the MapService service. 
      */
    myModule
        .directive('expertMode', [
            '$compile',
            function ($compile): ng.IDirective {
                return {
                    terminal: true,    
                    restrict: 'E',     
                    scope: {},       
                    link: function (scope, element, attrs) {
                        // Since we are wrapping the rating directive in this directive, I couldn't use transclude,
                        // so I copy the existing attributes manually.
                        var attributeString = ''; 
                        for (var key in attrs) {
                            if (key.substr(0, 1) !== '$' && attrs.hasOwnProperty(key)) attributeString += key + '="' + attrs[key] + '" ';
                        }
                        var html = '<rating ng-model="expertMode" '
                            + attributeString
                            + 'tooltip-html-unsafe="{{\'EXPERTMODE.EXPLANATION\' | translate}}" tooltip-placement="bottom" tooltip-trigger="mouseenter" tooltip-append-to-body="false"'
                            + 'max="3"></rating>';
                        var e = $compile(html)(scope);
                        element.replaceWith(e);
                    },  
                    //template: '<div><rating ng-model="expertise" max="3"></rating></div>',
                    replace: true,     // Remove the directive from the DOM
                    transclude: true,  // Add elements and attributes to the template
                    controller: ExpertModeCtrl
                }
            }
        ]);
} 