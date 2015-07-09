module Accessibility {

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
        public urlKeys = ['arriveBy', 'fromPlace', 'date', 'time', 'mode', 'maxWalkDistance', 'walkSpeed', 'bikeSpeed',
            'maxTimeSec', 'precisionMeters', 'zDataType', 'coordinateOrigin', 'cutoffSec'];

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
            this.urlParameters['mode'] = this.transportMode;
            this.urlParameters['time'] = encodeURIComponent(this.time);
            if(this.walkSpeedKm) this.urlParameters['walkSpeed'] = csComp.Helpers.GeoExtensions.convertKmToMile(this.walkSpeedKm);
            if(this.bikeSpeedKm) this.urlParameters['bikeSpeed'] = csComp.Helpers.GeoExtensions.convertKmToMile(this.bikeSpeedKm);
            var url = this.urlAddress + '?';
            for (var key in this.urlParameters) {
                if (this.urlParameters.hasOwnProperty(key) && key !== 'cutoffSec') {
                    url = url + key + '=' + this.urlParameters[key] + '&';
                }
            }
            this.cutoffTimes.forEach((co) => {
                url = url + 'cutoffSec=' + (co * 60) + '&';
            })
            url = url.substring(0, url.length - 1);
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
            this.time = ('0'+d.getHours()).slice(-2) + ':' + ('0'+d.getMinutes()).slice(-2);
            this.urlParameters['date'] = (d.getMonth()+1) + '-' + d.getDate() + '-' + d.getFullYear();
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
