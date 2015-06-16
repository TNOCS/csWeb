module Indicators {
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
    myModule.directive('indicatorsEdit', [
        '$compile',
        function($compile): ng.IDirective {
            return {
                terminal: true,    // do not compile any other internal directives
                restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                scope: {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Widgets/Indicators/Indicators-edit.tpl.html',
                compile: el => {    // I need to explicitly compile it in order to use interpolation like {{xxx}}
                    var fn = $compile(el);

                    return scope => {
                        fn(scope);
                    };
                },
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: IndicatorsEditCtrl
            }
        }
    ]);

    export interface IIndicatorsEditCtrl extends ng.IScope {
        vm: IndicatorsEditCtrl;

        data: indicatorData;
    }

    export class IndicatorsEditCtrl {
        private scope: IIndicatorsEditCtrl;
        private widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService', 'dashboardService'
        ];

        constructor(
            private $scope: IIndicatorsEditCtrl,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $dashboardService: csComp.Services.DashboardService
            ) {

            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;


            $scope.data = <indicatorData>this.widget.data;

        }



    }
}
