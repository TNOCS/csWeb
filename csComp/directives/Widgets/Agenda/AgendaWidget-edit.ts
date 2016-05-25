module Agenda {
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
    myModule.directive('agendaEdit', [function(): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/Agenda/AgendaWidget-edit.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: AgendaWidgetEditCtrl
        };
    }
    ]);

    export interface IAgendaWidgetEditScope extends ng.IScope {
        vm: AgendaWidgetEditCtrl;
        data: AgendaData;
    }

    export interface AgendaData {
        selectedLayerId: string;
    }

    export class AgendaWidgetEditCtrl {
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
            private $scope: IAgendaWidgetEditScope,
            private $http: ng.IHttpService,
            public layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            this.widget = par.widget || par.data;

            if (!this.widget) return;

            $scope.data = <AgendaData>this.widget.data;

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
            if (this.selectedLayer) (<AgendaData>this.widget.data).selectedLayerId = this.selectedLayer.id;
        }

    }
}
