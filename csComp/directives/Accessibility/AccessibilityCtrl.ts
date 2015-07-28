import IFeature = csComp.Services.IFeature;
import IActionOption = csComp.Services.IActionOption;

module Accessibility {
    export class AccessibilityModel implements csComp.Services.IActionService {
        private layerService: csComp.Services.LayerService
        id = "accessibilityActions";
        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) {
            console.log('accessibility:feature selected');
        }

        getFeatureActions(feature: IFeature): IActionOption[] {
            var accessibilityOption1 = <IActionOption>{
                title: "Show accessibility"
            }
            accessibilityOption1.callback = this.showAccessibility;
            var accessibilityOption2 = <IActionOption>{
                title: "Remove accessibility"
            }
            accessibilityOption2.callback = this.removeAccessibility;
            var accessibilityOption3 = <IActionOption>{
                title: "Plan route from"
            }
            accessibilityOption3.callback = this.planRouteFrom;
            var accessibilityOption4 = <IActionOption>{
                title: "Plan route to"
            }
            accessibilityOption4.callback = this.planRouteTo;
            return [accessibilityOption1, accessibilityOption2, accessibilityOption3, accessibilityOption4];
        }
        deselectFeature(feature: IFeature) { }
        updateFeature(feature: IFeature) { }

        public showAccessibility(feature: IFeature, layerService: csComp.Services.LayerService) {
            console.log('accessibility:showAccessibility');
            var accessibilityLayer = layerService.findLayer('accessibility');
            if (accessibilityLayer) {
                var urlParams = accessibilityLayer.url.split('&');
                var locationIndex = -1;
                urlParams.some((param, index) => {
                    if (param.substring(0, 9) === 'fromPlace') {
                        locationIndex = index;
                        return true;
                    }
                    return false;
                });
                if (feature.geometry.type !== 'Point') {
                    console.log('Can only create accessibility layer from a Point');
                    return;
                }
                urlParams[locationIndex] = 'fromPlace=' + feature.geometry.coordinates[1] + '%2C' + feature.geometry.coordinates[0];
                accessibilityLayer.url = urlParams.join('&');
                if (!accessibilityLayer.enabled) {
                    layerService.addLayer(accessibilityLayer);
                    var rpt = csComp.Helpers.createRightPanelTab("rightpanel", "accessibility", accessibilityLayer, "Accessibility options");
                    layerService.$messageBusService.publish("rightpanel", "activate", rpt);
                } else {
                    if (accessibilityLayer.layerSource) accessibilityLayer.layerSource.refreshLayer(accessibilityLayer);
                }
            }
        }

        public removeAccessibility(feature: IFeature, layerService: csComp.Services.LayerService) {
            console.log('accessibility:removeAccessibility');
            var accessibilityLayer = layerService.findLayer('accessibility');
            if (accessibilityLayer) {
                var wasRightPanelVisible = layerService.visual.rightPanelVisible;
                if (accessibilityLayer.enabled) {
                    layerService.removeLayer(accessibilityLayer);
                }
                delete accessibilityLayer.data;
                layerService.visual.rightPanelVisible = wasRightPanelVisible;
            }
        }

        public static planRoute(feature: IFeature, layerService: csComp.Services.LayerService, destinationKey: string) {
            var routeLayer: csComp.Services.ProjectLayer = layerService.findLayer('tripplanner');
            if (routeLayer) {
                var urlParams = csComp.Helpers.parseUrlParameters(routeLayer.url, '?', '&', '=');
                urlParams[destinationKey] = feature.geometry.coordinates[1] + '%2C' + feature.geometry.coordinates[0];
                routeLayer.url = csComp.Helpers.joinUrlParameters(urlParams, '?', '&', '=');
                if (!routeLayer.enabled) {
                    layerService.addLayer(routeLayer);
                } else {
                    if (routeLayer.layerSource) routeLayer.layerSource.refreshLayer(routeLayer);
                }
                var rpt = csComp.Helpers.createRightPanelTab("rightpanel", "tripplanner", routeLayer, "Route planner");
                layerService.$messageBusService.publish("rightpanel", "activate", rpt);
            } else {
                //TODO: create a new layer to show route on
            }
        }

        public planRouteFrom(feature: IFeature, layerService: csComp.Services.LayerService) {
            console.log('accessibility:planRouteFrom');
            AccessibilityModel.planRoute(feature, layerService, 'fromPlace');
        }

        public planRouteTo(feature: IFeature, layerService: csComp.Services.LayerService) {
            console.log('accessibility:planRouteTo');
            AccessibilityModel.planRoute(feature, layerService, 'toPlace');
        }

        public init(layerService: csComp.Services.LayerService) {
            console.log('init AccessibilityActionService');
            this.layerService = layerService;
            this.layerService.$messageBusService.serverSubscribe("accessibility", "msg", (title: string, mcb: csComp.Services.IMessageBusCallback) => {
                if (mcb["data"] === "restart") {
                    this.layerService.$messageBusService.notify("restarting server", "restarting", csComp.Services.NotifyLocation.TopRight);
                    location.reload();
                }

                //
                // var layer = this.layerService.findLayer("demo");
                // layer.layerSource.refreshLayer(layer);
                //console.log(title);
            })
        }
    }

    export interface IAccessibilityScope extends ng.IScope {
        vm: AccessibilityCtrl;
    }

    export interface IOtpUrlParameters {
        [key: string]: any;
    }

    export class AccessibilityCtrl {
        private scope: IAccessibilityScope;
        public layer: csComp.Services.ProjectLayer;
        private urlAddress: string;
        private urlParameters: IOtpUrlParameters;
        private transportModes: { [key: string]: any };
        private transportMode: string;
        private walkSpeedKm: number;
        private bikeSpeedKm: number;
        private time: string;
        private cutoffTimes: number[];
        public urlKeys = ['arriveBy', 'fromPlace', 'date', 'time', 'mode', 'walkSpeed', 'bikeSpeed',
             'precisionMeters', 'cutoffSec'];

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$http',
            'mapService',
            'layerService',
            'messageBusService',
            'dashboardService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IAccessibilityScope,
            private $http: ng.IHttpService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            this.layer = $scope.$parent["data"];
            this.cutoffTimes = [];
            this.urlParameters = {};
            this.bikeSpeedKm;
            this.walkSpeedKm;
            this.urlKeys.forEach((key) => { this.urlParameters[key] = 0 });
            this.transportModes = {};
            this.transportModes["Walking"] = "WALK";
            this.transportModes["Biking"] = "BICYCLE";
            //this.transportModes["Car"] = "CAR";
        }

        public refreshAccessibility() {
            if (this.$layerService.lastSelectedFeature) {
                var lsf =  this.$layerService.lastSelectedFeature;
                if (lsf.geometry && lsf.geometry.type === 'Point') {
                    this.urlParameters['fromPlace'] = lsf.geometry.coordinates[1] + '%2C' + lsf.geometry.coordinates[0];
                }
             }
            this.urlParameters['mode'] = this.transportMode;
            this.urlParameters['time'] = encodeURIComponent(this.time);
            if (this.walkSpeedKm) this.urlParameters['walkSpeed'] = csComp.Helpers.GeoExtensions.convertKmToMile(this.walkSpeedKm);
            if (this.bikeSpeedKm) this.urlParameters['bikeSpeed'] = csComp.Helpers.GeoExtensions.convertKmToMile(this.bikeSpeedKm);
            var url = this.urlAddress + '?';
            for (var key in this.urlParameters) {
                if (this.urlParameters.hasOwnProperty(key) && key !== 'cutoffSec') {
                    url = url + key + '=' + this.urlParameters[key] + '&';
                }
            }
            this.cutoffTimes.forEach((co) => {
                url = url + '&cutoffSec=' + (co * 60);
            })
            //url = url.substring(0, url.length - 1);
            console.log(url);
            this.layer.url = url;
            if (!this.layer.enabled) {
                this.$layerService.addLayer(this.layer);
            } else {
                if (this.layer.layerSource) this.layer.layerSource.refreshLayer(this.layer);
            }
            this.$layerService.visual.rightPanelVisible = true;
        }

        public parseUrl() {
            this.urlParameters = {};
            this.urlAddress = this.layer.url.split('?')[0];
            var croppedUrl = this.layer.url.split('?')[1]; // Remove the address of the url, keep the parameters
            var splittedUrl = croppedUrl.split('&');
            splittedUrl.forEach((param) => {
                var keyValue = param.split('=');
                if (keyValue[0] === 'cutoffSec') {
                    this.cutoffTimes.push((+keyValue[1]) / 60);
                }
                this.urlParameters[keyValue[0]] = (isNaN(+keyValue[1])) ? keyValue[1] : +keyValue[1];
            });
            var d = new Date(Date.now());
            this.time = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
            this.urlParameters['date'] = (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear();
            this.transportMode = this.urlParameters['mode'];
            if (this.urlParameters.hasOwnProperty('walkSpeed')) this.walkSpeedKm = +csComp.Helpers.GeoExtensions.convertMileToKm(this.urlParameters['walkSpeed']).toFixed(2);
            if (this.urlParameters.hasOwnProperty('bikeSpeed')) this.bikeSpeedKm = +csComp.Helpers.GeoExtensions.convertMileToKm(this.urlParameters['bikeSpeed']).toFixed(2);

            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
        }

        private addCutoffTime() {
            this.cutoffTimes.push(0);
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
        }

        private removeCutoffTime(index: number) {
            if (index < this.cutoffTimes.length && index > -1) {
                this.cutoffTimes.splice(index, 1);
            }
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
        }
    }
}
