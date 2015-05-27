module Indicators {

    export class indicatorData {
        title: string;
        orientation : string = "vertical";
        indicators: indicator[];
    }

    export class indicator {
        title: string;
        visual: string;
        type: string;
        sensor: string;
        sensorSet: csComp.Services.SensorSet;
        layer: string;
        /** dashboard to select after click */
        dashboard        : string;
        isActive: boolean;
        id: string;
        indexValue: number;   // the value that is treated as 100%
    }

    export interface ILayersDirectiveScope extends ng.IScope {
        vm: IndicatorsCtrl;

        data: indicatorData;
    }

    export class IndicatorsCtrl {
        private scope: ILayersDirectiveScope;
        private widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService','dashboardService'
        ];

        constructor(
            private $scope       : ILayersDirectiveScope,
            private $timeout     : ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService : csComp.Services.MapService,
            private $dashboardService : csComp.Services.DashboardService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;
            this.checkLayers();
            this.$messageBus.subscribe("layer",(s: string) => {
                this.checkLayers();
            });
            $scope.data = <indicatorData>this.widget.data;
            if (typeof $scope.data.indicators !== 'undefined') {
                $scope.data.indicators.forEach((i: indicator) => {
                    i.id = "circ-" + csComp.Helpers.getGuid();
                    if (i.sensor != null) {
                        this.$messageBus.subscribe("sensor-" + i.sensor, (action: string, data: string) => {
                            switch (action) {
                                case "update":
                                    //console.log("sensor update:" + data);
                                    //this.updateIndicator(i);
                                    break;
                            }
                        });
                        this.updateIndicator(i);
                    }
                });
            }
            $timeout(() => this.checkLayers());
        }

        public updateIndicator(i: indicator) {
            this.$layerService.findSensorSet(i.sensor, (ss: csComp.Services.SensorSet) => {
                i.sensorSet = ss;
                //console.log('updateIndicator: indicator.title = ' + i.title);
                //if (!this.$scope.$$phase) this.$scope.$apply();\
            });
        }

        private checkLayers() {
            if (!this.$layerService.visual.mapVisible) return;
            if (!this.$scope.data || !this.$scope.data.indicators ) return;
            this.$scope.data.indicators.forEach((i) => {
                if (i.layer != null) {
                    var ss = i.layer.split('/');
                    var l = this.$layerService.findLayer(ss[0]);
                    if (l != null) {
                        if (ss.length > 1) {
                            i.isActive =  l.enabled && l.group.styles.some((gs: csComp.Services.GroupStyle) => {
                                return gs.property == ss[1];
                            } );
                        }
                        else {
                          i.isActive = l.enabled;
                        }
                    }
                }
            });
        }

        public selectIndicator(i: indicator) {
          if (i.dashboard != 'undefined')
          {
            var db = this.$layerService.project.dashboards.filter((d : csComp.Services.Dashboard)=>d.id === i.dashboard);
            if (db.length>0) this.$dashboardService.selectDashboard(db[0],'main');
          }
            if (!this.$layerService.visual.mapVisible) return;

            if (i.layer != null) {
                var ss = i.layer.split('/');
                var l = this.$layerService.findLayer(ss[0]);
                if (l != null) {
                    if (l.enabled) {
                        this.$layerService.checkLayerLegend(l,ss[1]);
                    }
                    else {
                        if (ss.length > 1)
                            l.defaultLegendProperty = ss[1];
                        this.$layerService.addLayer(l);
                    }
                }
            }
            this.checkLayers();
            //console.log(i.title);
        }
    }
}
