module ButtonWidget {
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
    myModule.directive('buttonwidget', [function(): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/ButtonWidget/ButtonWidget.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: ButtonWidgetCtrl
        };
    }
    ]);

    export interface IButtonWidgetScope extends ng.IScope {
        vm: ButtonWidgetCtrl;
        data: IButtonData;
    }

    export interface IButtonWidget {
        id: string;
        name: string;
    }

    export interface IButton {
        title: string;
        action: string;
        layer: string;
        group: string;
        property: string;
        showLegend : boolean;
        _legend : csComp.Services.Legend;
        _layer : csComp.Services.ProjectLayer;
        _disabled : boolean;
        _active : boolean;
        _firstLegendLabel : string;
        _lastLegendLabel : string;
    }

    export interface IButtonData {
        buttons : IButton[];
    }

    export class ButtonWidgetCtrl {

        public static $inject = [
            '$scope',
            '$http',
            'layerService',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: IButtonWidgetScope,
            private $http: ng.IHttpService,
            public layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            $scope.data = <IButtonData>par.widget.data;

            if (typeof $scope.data.buttons === 'undefined') {
                $scope.data.buttons = [ ];
            }

            $scope.data.buttons.forEach(b => {
                switch (b.action) {
                    case 'Activate Layer':
                        this.checkLayer(b);
                        this.messageBusService.subscribe('layer', (a, l) => this.checkLayer(b));
                        break;
                    case 'Activate Style':
                        this.checkStyle(b);
                        this.messageBusService.subscribe('updatelegend', (a, l) => this.checkStyle(b));
                        break;
                    case 'Activate Baselayer' :
                        this.checkBaselayer(b);
                        this.messageBusService.subscribe('baselayer', (a, l) => this.checkBaselayer(b));
                        break;
                }
            });
        }

        private checkBaselayer(b: IButton) {
            b._active = this.layerService.$mapService.activeBaseLayerId === b.layer;
        }

        private checkLayer(b: IButton) {
            b._layer = this.layerService.findLayer(b.layer);
            if (b.showLegend && b._layer.defaultLegend) {
                b._legend = this.layerService.getLayerLegend(b._layer);
                if (b._legend && b._legend.legendEntries && b._legend.legendEntries.length > 0) {
                    b._firstLegendLabel = b._legend.legendEntries[b._legend.legendEntries.length - 1].label;
                    b._lastLegendLabel = b._legend.legendEntries[0].label;
                }
            }
            if (typeof b._layer !== 'undefined') {
                b._disabled = false;
                b._active = b._layer.enabled;
            } else {
                b._disabled = true;
            }
        }

        private checkStyle(b: IButton) {
            var group = this.layerService.findGroupById(b.group);
            var prop = b.property;
            if (prop.indexOf('#') > -1) prop = prop.split('#')[1];
            if (typeof group !== 'undefined') {
                var selected = group.styles.filter(gs => {
                    return gs.property === prop;
                });
                b._active = selected.length > 0;
            }
        }

        public click(b: IButton) {
            switch (b.action) {
                case 'Activate Layer':
                    var pl = this.layerService.findLayer(b.layer);
                    if (typeof pl !== 'undefined') {
                        this.layerService.toggleLayer(pl);
                        pl.enabled = true;
                    }
                    break;
                case 'Activate Style':
                    var group = this.layerService.findGroupById(b.group);
                    if (typeof group !== 'undefined') {
                        var propType = this.layerService.findPropertyTypeById(b.property);
                        if (typeof propType !== 'undefined') {
                            this.layerService.setGroupStyle(group, propType);
                        }
                    }
                    break;
                case 'Activate Baselayer' :
                    var layer : csComp.Services.BaseLayer = this.layerService.$mapService.getBaselayer(b.layer);
                    this.layerService.activeMapRenderer.changeBaseLayer(layer);
                    this.layerService.$mapService.changeBaseLayer(b.layer);
                    break;
            }

        }
    }
}
