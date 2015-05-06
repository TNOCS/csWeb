module Voting {
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
      * Directive to display an MCA control.
      */
    myModule.directive('voting', ['$timeout', ($timeout: ng.ITimeoutService): ng.IDirective => {
                return {
                    restrict: 'EA',  // E = elements, other options are A=attributes and C=CSS classes
                    require : '^ngModel',
                    scope: {
                        min     : '=',
                        max     : '=',
                        ngModel : '=',
                        ngChange: '&'
                    },
                    template: '<div style="line-height: 12px; vertical-align: top; margin: 0; background: rgba(0, 0, 0, 0.1); border-radius: 6px; padding: 4px 6px;">' +
                        '<a href="" data-ng-click="decrement()" data-ng-disabled="ngModel <= min" style="float: left;"><i class="fa" data-ng-class="{true: \'fa-minus-square\', false: \'fa-minus-square-o\'}[ngModel > min]"></i></a>' +
                        '<span style="float: left; width:28px; text-align: center;">{{ngModel}}</span>' +
                        '<a href="" data-ng-click="increment()" data-ng-disabled="ngModel >= max"><i class="fa" data-ng-class="{true: \'fa-plus-square\' , false: \'fa-plus-square-o\' }[ngModel < max]"></i></a>' +
                        '</div>',
                    link: ($scope: any) => {
                        $scope.increment = () => {
                            if ($scope.ngModel >= $scope.max) return;
                            $scope.ngModel++;
                            $timeout($scope.ngChange, 0);
                        };
                        $scope.decrement = () => {
                            if ($scope.ngModel <= $scope.min) return;
                            $scope.ngModel--;
                            $timeout($scope.ngChange, 0);
                        };
                    }
                }
            }
        ]);
}
