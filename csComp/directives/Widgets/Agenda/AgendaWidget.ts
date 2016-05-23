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
    myModule.directive('agenda', [function (): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/Agenda/AgendaWidget.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: AgendaWidgetCtrl
        };
    }
    ]);

    export interface IAgendaWidgetScope extends ng.IScope {
        vm: AgendaWidgetCtrl;
        data: AgendaData;
    }

    export interface IAgendaItem {
        title: string;
        description: string;
        startTime: Date;
        endTime: Date;
    }

    /**
     * The agenda widget does two things:
     * - it shows the relations of the currently selected feature, if any, as an agenda.
     * - it analyses a layer, if the 'agenda' tag is present in the ProjectLayer, for all events, i.e.
     *   features with a start and end time, and displays them on the timeline.
     */
    export class AgendaWidgetCtrl {
        private widget: csComp.Services.IWidget;
        private selectedLayer: csComp.Services.ProjectLayer;
        private agenda: IAgendaItem[] = [];
        private title: string;

        public static $inject = [
            '$scope',
            '$http',
            'layerService',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: IAgendaWidgetScope,
            private $http: ng.IHttpService,
            public layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            this.widget = par.widget;

            if (this.widget) {
                $scope.data = <AgendaData>this.widget.data;
            } else {
                $scope.data = <AgendaData>par.data;
            }

            let selectedLayerId = $scope.data.selectedLayerId;
            if (layerService.project) {
                this.selectedLayer = layerService.findLayer(selectedLayerId);
            } else {
                messageBusService.subscribe('project', (title) => {
                    this.selectedLayer = layerService.findLayer(selectedLayerId);
                });
            }

            messageBusService.subscribe('feature', (action, feature) => {
                switch (action) {
                    case 'onFeatureSelect':
                    case 'onRelationsUpdated':
                        this.updateAgenda(feature);
                        break;
                    case 'onFeatureDeselect':
                        this.clearAgenda();
                        break;
                }
            });
        }

        private clearAgenda() {
            this.title = '';
            this.agenda.length = 0;
        }

        private updateAgenda(feature: csComp.Services.Feature) {
            if (!feature || !feature._gui) return;
            var eventStyle = feature.fType.eventStyle;
            if (!eventStyle || !feature._gui.hasOwnProperty('relations') || !feature._gui['relations'].hasOwnProperty(eventStyle.relationName)) return;
            this.clearAgenda();
            this.title = feature.properties['Name'];
            var titleProp = eventStyle.title || 'Name',
                descProp = eventStyle.description || 'description',
                startProp = eventStyle.startTime || 'startTime',
                endProp = eventStyle.endTime || 'endTime';
            var eventList: csComp.Services.Feature[] = feature._gui['relations'][eventStyle.relationName];
            eventList.forEach(e => {
                this.agenda.push(<IAgendaItem> {
                    title: this.getProperty(e, titleProp),
                    description: this.getProperty(e, descProp),
                    startTime: this.getProperty(e, startProp),
                    endTime: this.getProperty(e, endProp)
                });
            });
        }

        private getProperty(feature: csComp.Services.Feature, prop: string, defaultValue = '') {
            let props = feature.properties;
            let propValue = props.hasOwnProperty(prop)
                ? props[prop]
                : defaultValue;
            feature.fType._propertyTypeData.some(pt => {
                if (pt.label !== prop) return false;
                propValue = csComp.Helpers.convertPropertyInfo(pt, propValue);
                return true;
            });
            return propValue;
        }
    }
}
