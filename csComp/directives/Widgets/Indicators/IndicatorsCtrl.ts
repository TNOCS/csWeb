module Indicators {

    export class indicatorData {
        title: string;
        orientation: string = "vertical";
        indicators: indicator[];
    }

    export class indicator {
        title: string;
        visual: string;
        type: string;
        usesSelectedFeature: boolean;
        featureTypeName: string;
        propertyTypes: string[];
        data: string;
        sensor: string;
        sensorSet: csComp.Services.SensorSet;
        layer: string;
        /** dashboard to select after click */
        dashboard: string;
        isActive: boolean;
        id: string;
        color: string;
        indexValue: number;   // the value that is treated as 100%
        focusTime: number;
    }

    export interface IIndicatorsCtrl extends ng.IScope {
        vm: IndicatorsCtrl;

        data: indicatorData;
    }

    export class IndicatorsCtrl {
        private scope: IIndicatorsCtrl
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
            'mapService', 'dashboardService'
        ];

        constructor(
            private $scope: IIndicatorsCtrl,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $dashboardService: csComp.Services.DashboardService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;
            this.checkLayers();
            this.$messageBus.subscribe("layer", (s: string) => {
                this.checkLayers();
            });
            $scope.data = <indicatorData>this.widget.data;
            $scope.$watch('data', () => {
                console.log('update data');
            })
            if (typeof $scope.data.indicators !== 'undefined') {
                $scope.data.indicators.forEach((i: indicator) => {
                    i.id = "circ-" + csComp.Helpers.getGuid();
                    if (i.usesSelectedFeature) {
                        this.$messageBus.subscribe('feature', (action: string, feature: any) => {
                            switch (action) {
                                case 'onFeatureSelect':
                                    this.selectFeature(feature, i);
                                    break;
                                case 'onUpdateWithLastSelected':
                                    var indic = <indicator> feature; //variable called feature is actually the indicator
                                    var realFeature;
                                    if (this.$layerService.lastSelectedFeature) { realFeature = this.$layerService.lastSelectedFeature; };
                                    this.selectFeature(realFeature, indic);
                                    break;
                                default:
                                    break;
                            }
                        });
                    }
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
            var focusTime = this.$layerService.project.timeLine.focus;
            this.$layerService.findSensorSet(i.sensor, (ss: csComp.Services.SensorSet) => {
                i.sensorSet = ss;
                i.focusTime = focusTime;
                if (i.sensorSet.propertyType && i.sensorSet.propertyType.legend) {
                    i.color = csComp.Helpers.getColorFromLegend(i.sensorSet.activeValue, i.sensorSet.propertyType.legend);
                }
                console.log('updateIndicator: sensor.activeValue = ' + i.sensorSet.activeValue);
            });
        }

        private checkLayers() {
            if (!this.$layerService.visual.mapVisible) return;
            var focusTime = this.$layerService.project.timeLine.focus;
            if (!this.$scope.data || !this.$scope.data.indicators) return;
            this.$scope.data.indicators.forEach((i) => {
                i.focusTime = focusTime;

                if (i.layer != null) {
                    var ss = i.layer.split('/');
                    var l = this.$layerService.findLayer(ss[0]);
                    if (l != null) {
                        if (ss.length > 1) {
                            i.isActive = l.enabled && l.group.styles.some((gs: csComp.Services.GroupStyle) => {
                                return gs.property == ss[1];
                            });
                        }
                        else {
                            i.isActive = l.enabled;
                        }
                    }
                }
            });
        }

        public selectIndicator(i: indicator) {
            if (i.dashboard != 'undefined') {
                var db = this.$layerService.project.dashboards.filter((d: csComp.Services.Dashboard) => d.id === i.dashboard);
                if (db.length > 0) this.$dashboardService.selectDashboard(db[0], 'main');
            }
            if (!this.$layerService.visual.mapVisible) return;

            if (i.layer != null) {
                var ss = i.layer.split('/');
                var l = this.$layerService.findLayer(ss[0]);
                if (l != null) {
                    if (l.enabled) {
                        this.$layerService.checkLayerLegend(l, ss[1]);
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

        private selectFeature(f: csComp.Services.IFeature, i: indicator) {
            if (!i.sensorSet) {
                var ss = new csComp.Services.SensorSet();
                ss.propertyType = { title: '' };
                i.sensorSet = ss;
            }

            if (i.hasOwnProperty('propertyTypes') && i.hasOwnProperty('featureTypeName')) {
                if (f.featureTypeName === i.featureTypeName) {
                    var propTypes = i.propertyTypes;
                    var propValues: number[] = [];
                    propTypes.forEach((pt: string) => {
                        if (f.properties.hasOwnProperty(pt)) {
                            propValues.push(f.properties[pt]);
                        }
                    });

                    i.sensorSet.activeValue = propValues[0];
                    i.sensorSet.propertyType.title = propTypes[0];
                    var propInfo = this.$layerService.calculatePropertyInfo(f.layer.group, propTypes[0]);
                    i.sensorSet.min = propInfo.sdMin;
                    i.sensorSet.max = propInfo.sdMax;

                    if (i.visual === 'bullet') {
                        var dataInJson = [];
                        for (var count = 0; count < propTypes.length; count++) {
                            var pinfo = this.$layerService.calculatePropertyInfo(f.layer.group, propTypes[count]);
                            var item = {
                                'title': propTypes[count],
                                'subtitle': '',
                                'ranges': [pinfo.sdMin, pinfo.sdMax],
                                'measures': [propValues[count]],
                                'markers': [propValues[count]]
                            };
                            dataInJson.push(item);
                        }
                        i.data = JSON.stringify(dataInJson);
                    }
                }
            }
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {this.$scope.$apply();};
        }
    }
}
