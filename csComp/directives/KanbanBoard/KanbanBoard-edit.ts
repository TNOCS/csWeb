module KanbanBoard {

    export class kanboardData {

    }
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
    myModule.directive('kanbanboardEdit', [
        '$compile',
        function($compile): ng.IDirective {
            return {
                terminal: true,    // do not compile any other internal directives
                restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                scope: {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/KanbanBoard/KanbanBoard-edit.tpl.html',

                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: KanbanBoardEditCtrl
            }
        }
    ]);

    export interface IVisualType {
        id: string;
        title: string;
    }

    export interface IKanbanBoardEditCtrl extends ng.IScope {
        vm: KanbanBoardEditCtrl;

        data: kanboardData;
    }

    export class KanbanBoardEditCtrl {
        private scope: IKanbanBoardEditCtrl;
        private widget: csComp.Services.IWidget;
        private selectedIndicatorVisual: string;
        public indicatorVisuals: { [key: string]: IVisualType; };
        private featureType: csComp.Services.IFeatureType;
        private propertyTypes: csComp.Services.IPropertyType[];

        public allLayers: csComp.Services.ProjectLayer[];
        public layer: string;

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
            private $scope: IKanbanBoardEditCtrl,
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
            this.propertyTypes = [];
            var p: csComp.Services.ProjectLayer;

            $scope.data = <kanboardData>this.widget.data;

            this.allLayers = $layerService.allLayers();



        }

        public selectLayer() {
            console.log(this.layer);
        }
        //
        // //** select a typesResource collection from the dropdown */
        public colorUpdated(c: any, i: any) {
            i.color = c;
        }

    }
}
