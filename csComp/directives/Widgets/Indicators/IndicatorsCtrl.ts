module Indicators {

    export class IndicatorData {
        title: string;
        orientation: string = 'vertical';
        indicators: Indicator[];
    }

    export class Indicator {
        title:              string;
        visual:             string;
        type:               string;
        featureTypeName:    string;
        propertyTypes:      string[];
        propertyTypeTitles: string[];
        data:               string;
        indicatorWidth:     number;
        property:           string;
        sensor:             string;
        _sensorSet:         csComp.Services.SensorSet;
        layer:              string;
        /** Dashboard to select after click */
        dashboard:          string;
        source:             string;
        isActive:           boolean;
        id:                 string;
        color:              string;
        indexValue:         number;   // the value that is treated as 100%
        _focusTime:         number;
        _toggleUpdate:      boolean;
        _value:             any;
        inputs:             { [key: string]: any } = {};
        _result:            { [key: string]: any } = {};

        constructor() {
            this._toggleUpdate = true;
            this.indicatorWidth = 200;
        }
    }

    export interface IIndicatorsScope extends ng.IScope {
        vm:   IndicatorsCtrl;
        data: IndicatorData;
    }

    export class IndicatorsCtrl implements csComp.Services.IWidgetCtrl {
        private scope: IIndicatorsScope;
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
            'mapService',
            'dashboardService',
            '$translate'
        ];

        constructor(
            private $scope: IIndicatorsScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $dashboardService: csComp.Services.DashboardService,
            private $translate: ng.translate.ITranslateService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            if (!par.widget) return;

            this.widget = par.widget;
            this.widget._ctrl = this;

            this.checkLayers();
            this.$messageBus.subscribe('layer', (s: string) => {
                this.checkLayers();
            });
            $scope.data = <IndicatorData>this.widget.data;
            // $scope.$watchCollection('data.indicators', () => {
            //     //console.log('update data');
            //     if ($scope.data.indicators && !$scope.data.indicators[$scope.data.indicators.length - 1].id) {
            //         var i = $scope.data.indicators[$scope.data.indicators.length - 1];
            //         i.id = csComp.Helpers.getGuid();
            //         this.$messageBus.subscribe('feature', (action: string, feature: any) => {
            //             switch (action) {
            //                 case 'onFeatureSelect':
            //                     this.selectFeature(feature, i);
            //                     break;
            //                 case 'onUpdateWithLastSelected':
            //                     var indic = <indicator> feature.indicator; //variable called feature is actually an object containing the indicator and an (empty) feature
            //                     var realFeature;
            //                     if (this.$layerService.lastSelectedFeature) { realFeature = this.$layerService.lastSelectedFeature; };
            //                     this.selectFeature(realFeature, indic);
            //                     break;
            //                 default:
            //                     break;
            //             }
            //         });
            //     }
            // });
            if (typeof $scope.data.indicators !== 'undefined') {
                $scope.data.indicators.forEach((i: Indicator) => {
                    i.id = 'circ-' + csComp.Helpers.getGuid();
                });
            }
            $timeout(() => this.checkLayers());
        }

        public forceUpdateIndicator(i: Indicator, value: any) {
            setTimeout(() => {
                i._value = value;
                i._result = {};
                this.$scope.$apply();
                for (var k in i.inputs) i._result[k] = i.inputs[k];
                this.$scope.$apply();
            }, 0);
        }

        public updateIndicator(i: Indicator) {
            var focusTime = this.$layerService.project.timeLine.focus;
            this.$layerService.findSensorSet(i.sensor, (ss: csComp.Services.SensorSet) => {
                i._sensorSet = ss;
                i._focusTime = focusTime;
                if (i._sensorSet.propertyType && i._sensorSet.propertyType.legend) {
                    i.color = csComp.Helpers.getColorFromLegend(i._sensorSet.activeValue, i._sensorSet.propertyType.legend);
                }
            });
        }

        public startEdit() {
            //alert('start edit');
        }

        private checkLayers() {
            if (!this.$layerService.visual.mapVisible) return;
            var focusTime = this.$layerService.project.timeLine.focus;
            if (!this.$scope.data || !this.$scope.data.indicators) return;
            this.$scope.data.indicators.forEach((i) => {
                i._focusTime = focusTime;

                if (i.layer != null) {
                    var ss = i.layer.split('/');
                    var l = this.$layerService.findLayer(ss[0]);
                    if (l != null) {
                        if (ss.length > 1) {
                            i.isActive = l.enabled && l.group.styles.some((gs: csComp.Services.GroupStyle) => {
                                return gs.property === ss[1];
                            });
                        } else {
                            i.isActive = l.enabled;
                        }
                    }
                }
            });
        }

        public selectIndicator(i: Indicator) {
            if (typeof i.dashboard !== 'undefined') {
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
                    } else {
                        if (ss.length > 1)
                            l.defaultLegendProperty = ss[1];
                        this.$layerService.addLayer(l);
                    }
                }
            }
            this.checkLayers();
            //console.log(i.title);
        }

        public indicatorInit(i: Indicator, scope: any) {
            scope.Math = Math;
            switch (i.source) {
                default:
                    // Assume by default that we are dealing with a feature.
                    this.$messageBus.subscribe('feature', (action: string, feature: any) => {
                        switch (action) {
                            case 'onFeatureSelect':
                                this.selectFeature(feature, i);
                                break;
                            case 'onUpdateWithLastSelected':
                                var indic = <Indicator> feature.indicator; //variable called feature is actually an object containing the indicator and an (empty) feature
                                var realFeature;
                                if (this.$layerService.lastSelectedFeature) { realFeature = this.$layerService.lastSelectedFeature; };
                                this.selectFeature(realFeature, indic);
                                break;
                            default:
                                break;
                        }
                    });
                    break;
                case 'sensor':
                    if (i.sensor != null) {
                        this.$layerService.$messageBusService.serverSubscribe(i.sensor, 'key', (topic: string, msg: csComp.Services.ClientMessage) => {
                            switch (msg.action) {
                                case 'key':
                                    this.forceUpdateIndicator(i, i._sensorSet.activeValue);
                                    break;
                            }
                        });
                        this.updateIndicator(i);
                    }
                    break;
            }
        }

        private selectFeature(f: csComp.Services.IFeature, i: Indicator) {
            // console.log('select feature called');
            // console.log(f);
            if (!i._sensorSet) {
                var ss = new csComp.Services.SensorSet();
                ss.propertyType = { title: '' };
                i._sensorSet = ss;
            }

            if (i.hasOwnProperty('featureTypeName')) {
                if (f.featureTypeName === i.featureTypeName) {
                    var propTypes = i.propertyTypes;
                    var propTitles: string[] = [];
                    var propValues: number[] = [];

                    this.forceUpdateIndicator(i, f.properties);

                    propTypes.forEach((pt: string) => {
                        if (f.properties.hasOwnProperty(pt)) {
                            propValues.push(f.properties[pt]);
                        }
                        if (this.$layerService.propertyTypeData.hasOwnProperty(pt)) {
                            propTitles.push(this.$layerService.propertyTypeData[pt].title);
                        } else {
                            propTitles.push(pt);
                        }
                    });

                    i._sensorSet.activeValue = propValues[0];
                    i._sensorSet.propertyType.title = propTitles[0];
                    var propInfo = this.$layerService.calculatePropertyInfo(f.layer.group, propTypes[0]);
                    i._sensorSet.min = propInfo.min;
                    i._sensorSet.max = propInfo.max * 1.05;

                    if (i.visual === 'bullet') {
                        var dataInJson = [];
                        for (var count = 0; count < propTypes.length; count++) {
                            var pinfo = this.$layerService.calculatePropertyInfo(f.layer.group, propTypes[count]);

                            //TODO: Just for fixing the impact ranges to [-5, 5], better solution is to be implemented...
                            if (propTypes[count].substr(0, 3) === 'IMP') {
                                if (pinfo.sd < 0) {
                                    pinfo.min = -5;
                                    pinfo.max = -5;
                                } else {
                                    pinfo.min = 5;
                                    pinfo.max = 5;
                                }
                            }
                            var item = {
                                'title': propTitles[count],
                                'subtitle': '',
                                'ranges': [pinfo.max, pinfo.max],
                                'measures': [propValues[count]],
                                'markers': [propValues[count]],
                                'barColor': (propValues[count] <= 0) ? 'green' : 'red'
                            };
                            dataInJson.push(item);
                        }
                        i.indicatorWidth = 200;
                        i.data = JSON.stringify(dataInJson);
                    };
                    i._toggleUpdate = !i._toggleUpdate; //Redraw the widget
                }
            }
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); };
        }
    }
}
