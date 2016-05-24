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
    myModule.directive('buttonwidget', [function (): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/ButtonWidget/ButtonWidget.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: ButtonWidgetCtrl
        };
    }]);

    export interface IButtonWidgetScope extends ng.IScope {
        vm: ButtonWidgetCtrl;
        data: IButtonData;
        buttons: IButton[];
        activeIndex: number;
    }

    export interface IButtonWidget {
        id: string;
        name: string;
    }

    export interface IButton {
        title: string;
        description: string;
        action: string;
        layer: string;        
        group: string;
        timerange: string;
        property: string;
        showLegend: boolean;
        image: string;
        /* Set to when the button should be enabled ("clicked") on initialization */
        defaultEnabled: boolean;
        /* Zoom to a level when clicking the button */
        zoomLevel: number;
        _legend: csComp.Services.Legend;
        _layer: csComp.Services.ProjectLayer;
        _feature : csComp.Services.Feature;
        _featureIcon : string;
        _disabled: boolean;
        _active: boolean;
        _firstLegendLabel: string;
        _lastLegendLabel: string;
        _canEdit: boolean;
    }

    export interface IButtonData {
        buttons: IButton[];
        minimalLayout: boolean;
        /* Show only one button. Clicking it will execute the according action and then show the next button */
        toggleMode: boolean;
        layerGroup: string;
        featureLayer : string;
    }

    export class ButtonWidgetCtrl {

        public static $inject = [
            '$scope',
            '$http',
            'layerService',
            'messageBusService',
            'actionService',
            '$timeout',
            '$sce'
        ];

        constructor(
            private $scope: IButtonWidgetScope,
            private $http: ng.IHttpService,
            public layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private actionService: csComp.Services.ActionService,
            private $timeout: ng.ITimeoutService,
            private $sce : ng.ISCEService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            $scope.data = <IButtonData>par.widget.data;

            if (typeof $scope.data.buttons === 'undefined') {
                $scope.data.buttons = [];
            }
            if (!_.isUndefined($scope.data.featureLayer))
            {
                this.initFeatureLayer();
                
            } else if (!_.isUndefined($scope.data.layerGroup)) {
                this.initLayerGroup();
            } else {
                this.$scope.buttons = this.$scope.data.buttons;
                this.initButtons();
            }
        }

        private initButtons() {
            this.$scope.buttons.forEach((b: IButton) => {
                var actions = b.action.split(';');
                actions.forEach((act) => {
                    switch (act.toLowerCase()) {
                        case 'activate timerange':
                            break;
                        case 'activate layer':
                            this.checkLayer(b);
                            this.messageBusService.subscribe('layer', (a, l) => this.checkLayer(b));
                            break;
                        case 'activate style':
                            this.checkStyle(b);
                            this.messageBusService.subscribe('updatelegend', (a, l) => this.checkStyle(b));
                            break;
                        case 'activate baselayer':
                            this.checkBaselayer(b);
                            this.messageBusService.subscribe('baselayer', (a, l) => this.checkBaselayer(b));
                            break;
                    }
                });
                if (b.defaultEnabled) {
                    this.click(b);
                }
            });
        }
        
        private initFeatureLayer() {
            this.checkFeatureLayer();
            this.messageBusService.subscribe('layer', (a, l) => this.checkFeatureLayer());
        }

        private initLayerGroup() {
            this.checkLayerGroup();
            this.messageBusService.subscribe('layer', (a, l) => this.checkLayerGroup());
        }
        
        private checkFeatureLayer()
        {
            this.$scope.buttons = [];
            var pl = this.layerService.findLayer(this.$scope.data.featureLayer);
            if (pl)
            {
                
                if (pl.data && pl.data.features)
                {
                    pl.data.features.forEach((f : IFeature)=>{
                        var b = <IButton>{
                        title: csComp.Helpers.getFeatureTitle(f),
                        action: 'Activate Feature',
                        description: 'Snelheid:',
                        _feature: f,
                        _featureIcon : this.$sce.trustAsHtml(csComp.Helpers.createIconHtml(f).html)                        
                    };
                    this.$scope.buttons.push(b);
                    });                    
                }
            }
            
        }

        private checkLayerGroup() {
            var group = this.layerService.findGroupById(this.$scope.data.layerGroup);
            this.$scope.buttons = [];
            if (!_.isUndefined(group)) {
                group.layers.forEach(l => {
                    var b = <IButton>{
                        title: l.title,
                        action: 'Activate Layer',
                        layer: l.id,
                        showLegend: false
                    };
                    this.$scope.buttons.push(b);
                    this.checkLayer(b);
                });
            }
        }

        private checkBaselayer(b: IButton) {
            b._active = this.layerService.$mapService.activeBaseLayerId === b.layer;
        }

        /** start or stop editing, when starting all features are editable */
        public toggleEditLayer(b: IButton) {
            if (!_.isUndefined(b._layer)) {
                var layer = b._layer;

                if (layer._gui.hasOwnProperty('editing') && layer._gui['editing'] === true) {
                    (<csComp.Services.EditableGeoJsonSource>layer.layerSource).stopEditing(layer);
                    layer.data.features.forEach(f => {
                        delete f._gui['editMode'];
                        this.layerService.updateFeature(f);
                        this.layerService.saveFeature(f);
                    });
                } else {
                    (<csComp.Services.EditableGeoJsonSource>layer.layerSource).startEditing(layer);
                    layer.data.features.forEach(f => {
                        this.layerService.editFeature(f, false);
                    });
                }
            }
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

            if (_.isUndefined(b.image) && (!_.isUndefined(b._layer.image))) b.image = b._layer.image;


            if (!_.isUndefined(b._layer)) {
                b._disabled = false;
                b._active = b._layer.enabled;
                b._canEdit = b._layer.enabled && b._layer.isEditable;
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
                if (selected.length === 0) {
                    b._active = false;
                } else {
                    if (!b.layer) {
                        b._active = true;
                    } else {
                        b._active = (this.layerService.findLoadedLayer(b.layer)) ? true : false;
                    }
                }
                if (b._active && b.showLegend) {
                    b._legend = selected[0].activeLegend;
                    this.checkLegend(b);
                } else {
                    b._legend = null;
                }
            }
        }

        public checkLegend(b: IButton) {
            if (b._legend && b._legend.legendEntries.length > 0) {
                if (typeof b._lastLegendLabel === 'undefined') b._lastLegendLabel = b._legend.legendEntries[0].label;
                if (typeof b._firstLegendLabel === 'undefined') b._firstLegendLabel = b._legend.legendEntries[b._legend.legendEntries.length - 1].label;
            }
        }

        public click(b: IButton) {
            var actions = b.action.split(';');
            actions.forEach((act) => {
                this.actionService.execute(act.toLowerCase(), {
                    layerId: b.layer,
                    groupId: b.group,
                    propertyId: b.property,
                    zoomLevel: b.zoomLevel
                });
            });
            // In case we're in toggleMode, increase the index counter
            if (this.$scope.data.toggleMode) {
                this.$timeout(() => {
                    this.$scope.activeIndex++;
                    if (this.$scope.activeIndex >= this.$scope.buttons.length) this.$scope.activeIndex = 0;
                }, 0);
            }
        }

        public toggleFilter(le: csComp.Services.LegendEntry, group: string, prop: string) {
            if (!le) return;
            var projGroup = this.layerService.findGroupById(group);
            var property = this.layerService.findPropertyTypeById(prop);
            //Check if filter already exists. If so, remove it.
            var exists: boolean = projGroup.filters.some((f: csComp.Services.GroupFilter) => {
                if (f.property === property.label) {
                    this.layerService.removeFilter(f);
                    return true;
                }
            });
            if (!exists) {
                var gf = new csComp.Services.GroupFilter();
                gf.property = prop.split('#').pop();
                gf.id = 'buttonwidget_filter';
                gf.group = projGroup;
                gf.filterType = 'row';
                gf.title = property.title;
                gf.rangex = [le.interval.min, le.interval.max];
                gf.filterLabel = le.label;
                console.log('Setting filter');
                this.layerService.rebuildFilters(projGroup);
                projGroup.filters = projGroup.filters.filter((f) => { return f.id !== gf.id; });
                this.layerService.setFilter(gf, projGroup);
                this.layerService.visual.leftPanelVisible = true;
                $('#filter-tab').click();
            }
        }
    }
}
