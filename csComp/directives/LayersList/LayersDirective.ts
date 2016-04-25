module LayersDirective {
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
    myModule.directive('layersDirective', [
        '$compile',
        function($compile): ng.IDirective {
            return {
                terminal: true,    // do not compile any other internal directives
                restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                scope: {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/LayersList/LayersDirective.tpl.html',
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: LayersDirectiveCtrl
            }
        }
    ]);
    
    myModule.directive('featureType',['$compile','layerService', ($compile,layerService : csComp.Services.LayerService) => {

        var getTemplate = ((type : csComp.Services.IFeatureType)=> {
            var f = <csComp.Services.Feature>{ };
            f.fType = type;
            f.featureTypeName = f.fType.name;
            f._gui = <csComp.Services.IGuiObject>{};
            f.effectiveStyle = f.fType.style;
            layerService.calculateFeatureStyle(f);
            switch (f.fType.style.drawingMode)
            {
                case "Point":
                    var html = csComp.Helpers.createIconHtml(f);
                    return html.html;
                case "Line":
                    return "<span>line</span>" 
                case "Polygon":
                    return "<span>polygon</span>"                                         
            }
            
                                     
        });
        
        return {
            restrict: 'E',
            scope: {
                featuretype: "="
            },
            link: function(scope, element, attrs) {
                var el = $compile(getTemplate(scope.featuretype))(scope);
                element.html(el);
            }
        }
    }]);    
    
    myModule.directive('featureType2', [
        '$compile',
        function($compile): ng.IDirective {
            return {
                terminal: true,    // do not compile any other internal directives
                restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                scope: { 
                    featuretype: "=featuretype"
                },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                template: '<h1>{{featuretype.name}}</h1>',                
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template                
                controller: ($scope)=>{                    
                    console.log($scope.featuretype);
                },
                link : (scope : any,element, attrs)=>{
                    
                    
                    
                }
                
            }
        }
    ]);
}
