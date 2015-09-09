module ChartsWidget {
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

    declare var vg;

    /**
      * Directive to display the available map layers.
      */
    myModule.directive('chartsEdit', [
        '$compile',
        function($compile): ng.IDirective {
            return {
                terminal: true,    // do not compile any other internal directives
                restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                scope: {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Widgets/Charts/Charts-edit.tpl.html',
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: ChartsEditCtrl
            }
        }
    ]);


    export interface IChartsEditCtrl extends ng.IScope {
        vm: ChartsEditCtrl;
        data: any;
        spec: string;
    }

    export class ChartsEditCtrl {
        private scope: IChartsEditCtrl;
        public widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$timeout',
            '$compile',
            'layerService',
            '$templateCache',
            'messageBusService',
            'mapService', 'dashboardService'
        ];

        constructor(
            private $scope: IChartsEditCtrl,
            private $timeout: ng.ITimeoutService,
            private $compile: any,
            private $layerService: csComp.Services.LayerService,
            private $templateCache: any,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $dashboardService: csComp.Services.DashboardService
            ) {

            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = <csComp.Services.IWidget>par.data;
            $scope.data = <ChartData>this.widget.data;

            this.$scope.spec = JSON.stringify(this.$scope.data.spec);
            console.log(this.$scope.spec);


        }

        public updateChart() {
            this.$scope.data.spec = JSON.parse(this.$scope.spec);
            this.$scope.data._spec = JSON.parse(this.$scope.spec);
            vg.parse.spec(this.$scope.data._spec, (chart) => { chart({ el: "#vis" + this.$scope.data._id }).update(); });            
            // vg.embed('#vis', this.$scope.data.spec, (view, vega_spec) => {
            //     console.log('chart');
            //     console.log(view);
            //     // Callback receiving the View instance and parsed Vega spec...
            //     // The View resides under the '#vis' element
            // });
        }


    }
}
