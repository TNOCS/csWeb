module Indicators {

    export class indicatorData {
        title: string;
        indicators: indicator[];
    }

    export class indicator {
        title: string;
        visual: string;
        type: string;
        sensor: string;        
        sensorSet: csComp.Services.SensorSet;
        layer: string;
        isActive: boolean;
        id: string;
    }

    export interface ILayersDirectiveScope extends ng.IScope {
        vm: LayersDirectiveCtrl;
        data: indicatorData;
    }

    export class LayersDirectiveCtrl {
        private scope: ILayersDirectiveScope;
        private widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope       : ILayersDirectiveScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) { 
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = (par.widget);
            this.checkLayers();
            this.$messageBus.subscribe("layer",(s: string) => {
                this.checkLayers();
            });
            $scope.data = <indicatorData>this.widget.data;
            $scope.data.indicators.forEach((i) => {
                i.id = "circ-" + csComp.Helpers.getGuid();
                if (i.sensor != null) {
                    this.$layerService.findSensorSet(i.sensor,(ss: csComp.Services.SensorSet) => {
                        i.sensorSet = ss;
                        if (!$scope.$$phase) $scope.$apply();
                        setTimeout(() => {
                            (<any>$("#" + i.id)).circliful();
                        }, 1000);
                        
                    });
                }                
            });


            
            
        }

        private checkLayers() {
            if (!this.$scope.data || !this.$scope.data.indicators ) return;
            this.$scope.data.indicators.forEach((i) => {
                if (i.layer != null) {
                    var l = this.$layerService.findLayer(i.layer);
                    if (l != null) {
                        i.isActive = l.enabled;
                    }
                }
            }); 
            //if (!this.$scope.$$phase) this.$scope.$apply()
        }

        public selectIndicator(i: indicator) {
            if (i.layer != null) {
                var l = this.$layerService.findLayer(i.layer);
                if (l != null) {
                    this.$layerService.addLayer(l);
                }

            }
            //console.log(i.title);
        }
        
    }
}
