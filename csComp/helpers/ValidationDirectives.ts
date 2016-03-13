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

    myModule.directive('validtitle', () => {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: (scope, elm, attrs, ctrl) => {
                var validator = (value) => {

                    var v = (typeof value === 'undefined') || (value.length === 0);
                    if (!v) {
                        if (value.match(/^[a-zA-Z0-9\s]*$/)) {
                            ctrl.$setValidity('validtitle', true);
                            return value;
                        }
                        else {
                            ctrl.$setValidity('validtitle', false);
                            return undefined;
                        }
                    }
                    else {
                        ctrl.$setValidity('validtitle', false);
                        return undefined;
                    }

                };
                ctrl.$parsers.unshift(validator);
                ctrl.$formatters.unshift(validator);
            }
        };
    });

    myModule.directive('duplicategroup', ()=> {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: (scope, elm, attrs, ctrl) => {
                
                    var validate = (viewValue)=>{
                        if (typeof viewValue === 'undefined' || viewValue === "") { ctrl.$setValidity('duplicategroup', false); return undefined }
                        var noduplicate = scope.$parent.vm.groups.every((g: csComp.Services.ProjectGroup) => g.title !== viewValue);
                        ctrl.$setValidity('duplicategroup', noduplicate);    
                        return viewValue;
                    }                    
                ctrl.$parsers.unshift(validate);
                ctrl.$formatters.unshift(validate);
                
            }
        };
    });

}


