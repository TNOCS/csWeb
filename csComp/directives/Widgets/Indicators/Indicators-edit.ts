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
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: IndicatorsEditCtrl
            }
        }
    ]);

    export interface IVisualInput {
        type: string;
        default: Object;
    }

    export interface IVisualType {
        id: string;
        title: string;
        input: any;
    }

    export interface IIndicatorsEditCtrl extends ng.IScope {
        vm: IndicatorsEditCtrl;

        data: indicatorData;
    }

    export class IndicatorsEditCtrl {
        private scope: IIndicatorsEditCtrl;
        private widget: csComp.Services.IWidget;
        private selectedIndicatorVisual: string;
        public indicatorVisuals: { [key: string]: IVisualType; };
        private featureType: csComp.Services.IFeatureType;
        private propertyTypes: csComp.Services.IPropertyType[];
        private propertyTypeData: csComp.Services.IPropertyType[];

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
            private $scope: IIndicatorsEditCtrl,
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

            $scope.data = <indicatorData>this.widget.data;

            this.indicatorVisuals = {};
            this.indicatorVisuals["bullet"] = { id: "bullet", title: "Bullet chart", input: {} };
            this.indicatorVisuals["circular"] = { id: "circular", title: "Circular", input: { value: { type: "expression", default: "~['value']" }, min: { type: "expression", default: 0 }, max: { type: "expression", default: 0 } } };
            this.indicatorVisuals["sparkline"] = { id: "sparkline", title: "Sparkline", input: { property: { type: "string", default: "value" }, height: { type: "string", default: "50" } } };
            this.indicatorVisuals["bar"] = { id: "bar", title: "Bar chart", input: {} };
            this.indicatorVisuals["singlevalue"] = { id: "singlevalue", title: "Value", input: { value: { type: "expression", default: "~['value']" } } };
        }
        //
        // //** select a typesResource collection from the dropdown */
        public colorUpdated(c: any, i: any) {
            i.color = c;
        }

        public updatePropertyTypes(indic: indicator) {
            var fType = this.$layerService._featureTypes[indic.featureTypeName];
            if (fType) this.propertyTypeData = csComp.Helpers.getPropertyTypes(fType, this.$layerService.propertyTypeData);
        }

        public moveUp(i: indicator) {
            var pos = this.$scope.data.indicators.indexOf(i);
            //this.$scope.data.indicators.move()
        }

        public deleteIndicator(i: string) {
            this.$scope.data.indicators = this.$scope.data.indicators.filter((ind: indicator) => { return ind.id != i })
        }

        public updateIndicator(i: indicator) {
            i.propertyTypes = [];
            i.propertyTypeTitles = [];
            this.propertyTypes.forEach((pt) => {
                i.propertyTypes.push(pt.label);
                i.propertyTypeTitles.push(pt.title);
            });
            if (this.$layerService.lastSelectedFeature && i.source === "feature") {
                this.$messageBus.publish('feature', 'onUpdateWithLastSelected', { indicator: i, feature: undefined });
            }
            i._toggleUpdate = !i._toggleUpdate;
            this.updateVisual(i);
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); };
        }

        public initIndicator(i: indicator) {
            this.updateVisual(i);
        }

        public updateVisual(i: indicator) {
            if (!i.inputs) i.inputs = {};
            var r = {};
            for (var key in this.indicatorVisuals[i.visual].input) {
                if (i.inputs && i.inputs.hasOwnProperty(key)) {
                    r[key] = i.inputs[key];
                }
                else {
                    var v = this.indicatorVisuals[i.visual].input;
                    r[key] = v[key].default;
                }
            }
            i.inputs = r;
        }

        public addIndicator() {
            var newIndicator = new indicator();
            newIndicator.title = "New Indicator"
            newIndicator.visual = "circular";
            newIndicator.sensor = "";
            newIndicator.source = "feature";
            newIndicator.featureTypeName = "";
            newIndicator.propertyTypes = [];
            this.updateVisual(newIndicator);
            if (!this.$scope.data.indicators) this.$scope.data.indicators = [];
            this.$scope.data.indicators.push(newIndicator);
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); };
        }

        public sensorChanged(i: indicator) {
            var sourceString = i.sensor.split('/');
            if (sourceString.length > 1) {
                this.$layerService.project.datasources.forEach((ds) => {
                    if (ds.id === sourceString[0]) {
                        if (ds.sensors.hasOwnProperty(sourceString[1])) {
                            i._sensorSet = ds.sensors[sourceString[1]];
                        }
                    }
                });
            }
            i._toggleUpdate = !i._toggleUpdate;
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); };
        }
    }
}
