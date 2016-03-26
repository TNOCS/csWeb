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
        }
    }
    ]);

    export interface IButtonWidgetScope extends ng.IScope {
        vm: ButtonWidgetCtrl;
        data: IButtonData;
        buttons : IButton[];
    }

    export interface IButtonWidget {
        id: string;
        name: string;
    }
    
    export interface IButton{
        title: string;
        action: string;
        layer: string;
        group: string;
        timerange : string;
        property: string;
        showLegend : boolean;
        _legend : csComp.Services.Legend;
        _layer : csComp.Services.ProjectLayer;
        _disabled : boolean;
        _active : boolean;
        _firstLegendLabel : string;
        _lastLegendLabel : string;    
        _canEdit : boolean;    
    }

    export interface IButtonData {
        buttons : IButton[];
        layerGroup : string;        
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

            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            $scope.data = <IButtonData>par.widget.data;
            
            
            if (typeof $scope.data.buttons === 'undefined')
            {
                $scope.data.buttons = [ ];                
            }
            
            if (!_.isUndefined($scope.data.layerGroup))
            {
                this.initLayerGroup();                
            }
            else
            {
                this.$scope.buttons = this.$scope.data.buttons;                                   
                this.initButtons();
            }    
        }
        
        private initButtons()
        {
            this.$scope.buttons.forEach(b =>
            {
                switch (b.action) {
                case "Activate TimeRange":
                    
                    break;
                case "Activate Layer":
                    this.checkLayer(b);
                    this.messageBusService.subscribe("layer", (a, l) => this.checkLayer(b));
                    break;
                case "Activate Style":
                    this.checkStyle(b);
                    this.messageBusService.subscribe("updatelegend", (a, l) => this.checkStyle(b));
                    break;
                case "Activate Baselayer" :
                    this.checkBaselayer(b); 
                    this.messageBusService.subscribe("baselayer", (a, l) => this.checkBaselayer(b)); 
                    break;
            }
                
            });
            
        }
        
        private initLayerGroup()
        {
            this.checkLayerGroup();
            this.messageBusService.subscribe("layer", (a, l) => this.checkLayerGroup());
        }
        
        private checkLayerGroup() {
            var group = this.layerService.findGroupById(this.$scope.data.layerGroup);
            this.$scope.buttons = [];
            if (!_.isUndefined(group)) {
                group.layers.forEach(l => {
                    var b = <IButton>{
                            title: l.title,
                            action: "Activate Layer",
                            layer: l.id,
                            showLegend: false
                        };
                    this.$scope.buttons.push(b);
                    this.checkLayer(b);
                    
                });
            }            
        }
        
        private checkBaselayer(b : IButton)
        {
            b._active = this.layerService.$mapService.activeBaseLayerId === b.layer;
        }
        
        public editLayer(b : IButton)
        {            
            console.log('edit layer');
        }

        private checkLayer(b : IButton) {
            b._layer = this.layerService.findLayer(b.layer);
            
            if (b.showLegend && b._layer.defaultLegend) {
                b._legend = this.layerService.getLayerLegend(b._layer);
                if (b._legend && b._legend.legendEntries && b._legend.legendEntries.length>0)
                {
                    b._firstLegendLabel = b._legend.legendEntries[b._legend.legendEntries.length-1].label;
                    b._lastLegendLabel = b._legend.legendEntries[0].label; 
                }
            }  
            
                        
            if (!_.isUndefined(b._layer)) {
                b._disabled = false;
                b._active = b._layer.enabled;
                b._canEdit = b._layer.enabled && b._layer.isDynamic;                                             
            }
            else {
                b._disabled = true;
            }
            
        }

        private checkStyle(b : IButton) {
            var group = this.layerService.findGroupById(b.group);
            var prop = b.property;
            if (prop.indexOf("#")>-1) prop = prop.split("#")[1];
            if (typeof group !== 'undefined') {
                var selected = group.styles.filter(gs=>{
                    return gs.property === prop});
                b._active = selected.length>0;
                if (b._active && b.showLegend) {                     
                    b._legend = selected[0].activeLegend;
                    this.checkLegend(b); 
                } else {b._legend = null; }                 
                
            }
            
        } 
        
        public checkLegend(b : IButton)
        {
            if (b._legend && b._legend.legendEntries.length>0)
            {
                if (typeof b._lastLegendLabel === 'undefined') b._lastLegendLabel = b._legend.legendEntries[0].label; 
                if (typeof b._firstLegendLabel === 'undefined') b._firstLegendLabel = b._legend.legendEntries[b._legend.legendEntries.length-1].label;
            }
        }

        public click(b : IButton) {
            switch (b.action) {
                case "Activate TimeRange":
                    console.log('time range');
                    this.layerService.project.timeLine.start = new Date().getTime() - 1000 * 60 * 60 * 2;
                    this.layerService.project.timeLine.end = new Date().getTime() + 1000 * 60 * 60 * 2;
                    this.layerService.project.timeLine.focus = new Date().getTime();
                    break;
                case "Activate Layer":
                    var pl = this.layerService.findLayer(b.layer);
                    if (typeof pl !== 'undefined') {
                        this.layerService.toggleLayer(pl);                        
                    }
                    break;
                case "Activate Style":
                    var group = this.layerService.findGroupById(b.group);
                    if (typeof group !== 'undefined') {
                        var propType = this.layerService.findPropertyTypeById(b.property);
                        if (typeof propType !== 'undefined') {
                            this.layerService.setGroupStyle(group, propType);                            
                        }
                    }
                    break;
                case "Activate Baselayer" :
                    var layer : csComp.Services.BaseLayer = this.layerService.$mapService.getBaselayer(b.layer);
                    this.layerService.activeMapRenderer.changeBaseLayer(layer);
                    this.layerService.$mapService.changeBaseLayer(b.layer);
                    break;
            }

        }
    }
}
