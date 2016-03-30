module FocusTimeWidget {
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
    myModule.directive('focustimewidget', [function(): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/FocusTimeWidget/FocusTimeWidget.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: FocusTimeWidgetCtrl
        }
    }
    ]);

    export interface IButtonWidgetScope extends ng.IScope {
        vm: FocusTimeWidgetCtrl;
        data: IFocusTimeData;
    }

    export interface IFocusTimeWidget {
        id: string;
        name: string;
    }

    export interface IFocusTimeData {
        mode: string;
        layer: string;

    }

    export class FocusTimeWidgetCtrl {

        public disabled = false;
        public active = false;
        public layer: csComp.Services.ProjectLayer;
        public time: Date;
        public dateFormat : string;
        public timeFormat : string;
        private handle: csComp.Services.MessageBusHandle;
        

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
            $scope.data = <IFocusTimeData>par.widget.data;
            (<csComp.Services.IWidget>par.widget).stop = () => {
                if (this.handle) this.messageBusService.unsubscribe(this.handle);
            };

            switch ($scope.data.mode) {
                case "layerTimestamp":
                    this.checkLayerTimestamp();
                    this.layer = this.layerService.findLayer(this.$scope.data.layer);
                    this.handle = this.messageBusService.subscribe('layer', (a, l: csComp.Services.ProjectLayer) => {
                        if (a === "sensordataUpdated") {                            
                            if (l.id === $scope.data.layer) this.checkLayerTimestamp();                                                                                                 
                        }
                    });
                    break;
                case "focustime":
                    this.handle = this.messageBusService.subscribe('timeline', (a, d) => {
                        if (a === "focusChange") {
                            $scope.$evalAsync(() => {
                                this.time = this.layerService.project.timeLine.focusDate();
                            });
                            //console.log(d);                            
                        }
                    });

                    break;
            }

        }
        
        public lastHour()
        {
            this.layer.sensorLink.liveInterval = "1h";
            this.layerService.updateLayerSensorLink(this.layer);
            
        }
        
        public lastDay()
        {
            this.layer.sensorLink.liveInterval = "24h";
            this.layerService.updateLayerSensorLink(this.layer);
            console.log('last 24');
        }
        
       

        public checkLayerTimestamp() {                   
            if (this.layer)
                if (this.layer._gui.hasOwnProperty("timestamp"))
                    this.$scope.$evalAsync(() => {
                        this.dateFormat = "dd-MM-yyyy EEE";
                        this.timeFormat = "HH:mm ";
                        this.time = this.layer._gui["timestamp"];
                    });
        }


    }
}
