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
    declare var ace;

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
        editor: any;

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
            private $compile: ng.ICompileService,
            private $layerService: csComp.Services.LayerService,
            private $templateCache: ng.ITemplateCacheService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $dashboardService: csComp.Services.DashboardService
            ) {

            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = <csComp.Services.IWidget>par.data;
            $scope.data = <ChartData>this.widget.data;
            this.loadChart();
        }

        public setupEditor() {
            this.editor = ace.edit("vegaeditor");
            //editor.setTheme("ace/theme/monokai");
            this.editor.getSession().setMode("ace/mode/json");
            this.editor.setValue(JSON.stringify(this.$scope.data.spec, null, '\t'));
            this.editor.clearSelection();
            this.editor.focus();
        }

        public loadChart() {
            this.$scope.spec = JSON.stringify(this.$scope.data.spec);
        }

        public updateChart() {
            this.$scope.data.spec = JSON.parse(this.editor.getValue());
            this.refreshChart();
            this.editor.focus();
        }

        public refreshChart() {
            vg.parse.spec(this.$scope.data.spec, (chart) => { chart({ el: "#vis" + this.$scope.data._id }).update(); });
        }
    }
}
