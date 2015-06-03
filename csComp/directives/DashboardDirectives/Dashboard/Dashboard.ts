module Dashboard {
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


    myModule.directive('whenReady', ['$interpolate', function($interpolate) {
      return {
        restrict: 'A',
        priority: Number.MIN_VALUE, // execute last, after all other directives if any.
        link: function($scope, $element, $attributes) {
          var expressions = $attributes.whenReady.split(';');
          var waitForInterpolation = false;
          var hasReadyCheckExpression = false;

          function evalExpressions(expressions) {
            expressions.forEach(function(expression) {
              $scope.$eval(expression);
            });
          }

          if ($attributes.whenReady.trim().length === 0) { return; }

        if ($attributes.waitForInterpolation && $scope.$eval($attributes.waitForInterpolation)) {
            waitForInterpolation = true;
        }

          if ($attributes.readyCheck) {
            hasReadyCheckExpression = true;
          }

          if (waitForInterpolation || hasReadyCheckExpression) {
            requestAnimationFrame(function checkIfReady() {
              var isInterpolated = false;
              var isReadyCheckTrue = false;

              if (waitForInterpolation && $element.text().indexOf($interpolate.startSymbol()) >= 0) { // if the text still has {{placeholders}}
                isInterpolated = false;
              }
              else {
                isInterpolated = true;
              }

              if (hasReadyCheckExpression && !$scope.$eval($attributes.readyCheck)) { // if the ready check expression returns false
                isReadyCheckTrue = false;
              }
              else {
                isReadyCheckTrue = true;
              }

              if (isInterpolated && isReadyCheckTrue) { evalExpressions(expressions); }
              else { requestAnimationFrame(checkIfReady); }

            });
          }
          else {
            evalExpressions(expressions);
          }
        }
      };
    }]);

    /**
      * Directive to display the available map layers.
      */
    myModule.directive('dashboardirective', [
        '$window', '$compile',
        function($window, $compile): ng.IDirective {
            return {
                terminal: false, // do not compile any other internal directives
                restrict: 'E', // E = elements, other options are A=attributes and C=classes
                scope: {
                    container: '='
                }, // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                //template: html, // I use gulp automatian to compile the FeatureProperties.tpl.html to a simple TS file, FeatureProperties.tpl.ts, which contains the html as string. The advantage is that you can use HTML intellisence in the html file.
                templateUrl: 'directives/DashboardDirectives/Dashboard/Dashboard.tpl.html',
                link: (scope: any, element, attrs) => {
                    // Deal with resizing the element list
                    angular.element($window).bind('resize', () => {
                        //scope.onResizeFunction();
                        scope.$apply();
                    });

                    scope.container = attrs.container;
                    //var s = jQuery.parseJSON(attrs.param);
                    scope.initDashboard();
                },
                replace:false,
                transclude: true, // Add elements and attributes to the template
                controller: DashboardCtrl
            }
        }
    ]);

}
