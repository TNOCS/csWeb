module Presentation {
    /** Config */
    var moduleName = 'csComp';

    /** Module */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    /** Directive to send a message to a REST endpoint. Similar in goal to the Chrome plugin POSTMAN. */
    myModule.directive('presentationEdit', [function(): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/Presentation/PresentationWidget-edit.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: PresentationWidgetEditCtrl
        };
    }
    ]);

    export interface IPresentationWidgetEditScope extends ng.IScope {
        vm: PresentationWidgetEditCtrl;
        data: PresentationData;
    }

    export interface PresentationData {
    }

    export class PresentationWidgetEditCtrl {
        private widget: csComp.Services.IWidget;

        private selectedLayer: csComp.Services.ProjectLayer;
        private layers: csComp.Services.ProjectLayer[] = [];

        public static $inject = [
            '$scope',
            '$http',
            'layerService',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: IPresentationWidgetEditScope,
            private $http: ng.IHttpService,
            public layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            this.widget = par.widget || par.data;

            $scope.data = <PresentationData>this.widget.data;
            let selectedLayerId = $scope.data.selectedLayerId;

            layerService.project.groups.forEach(g => {
                g.layers.forEach(l => {
                    this.layers.push(l);
                    if (l.id === selectedLayerId) {
                        this.selectedLayer = l;
                    }
                });
            });
        }

        update() {
            if (this.selectedLayer) (<PresentationData>this.widget.data).selectedLayerId = this.selectedLayer.id;
        }
    }
}
