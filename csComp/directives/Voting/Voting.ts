module Voting {
    /**
      * Config
      */
    var moduleName = 'csWeb.voting';

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
      * Directive to display an MCA control. 
      */
    myModule.directive('voting', [(): ng.IDirective => {
                return {
                    restrict: 'EA',  // E = elements, other options are A=attributes and C=CSS classes
                    scope: {
                        min  : '=',
                        max  : '=',
                        value: '='
                    }, 
                    template: '<div style="line-height: 12px; vertical-align: top; margin: 0; background: rgba(0, 0, 0, 0.1); border-radius: 6px; padding: 4px 6px;">' +
                        '<a href="" data-ng-click="decrement()" data-ng-disabled="value <= min" style="float: left;"><i class="fa" data-ng-class="{true: \'fa-minus-square\', false: \'fa-minus-square-o\'}[value > min]"></i></a>' +
                        '<span style="float: left; width:25px; text-align: center;">{{value}}</span>' +
                        '<a href="" data-ng-click="increment()" data-ng-disabled="value >= max"><i class="fa" data-ng-class="{true: \'fa-plus-square\' , false: \'fa-plus-square-o\' }[value < max]"></i></a>' +
                        '</div>',
                    controller: ($scope) => {
                        $scope.increment = () => { if ($scope.value < $scope.max) $scope.value = $scope.value + 1; }; 
                        $scope.decrement = () => { if ($scope.value > $scope.min) $scope.value = $scope.value - 1; }; 
                    }
                }
            }
        ]);
}
 