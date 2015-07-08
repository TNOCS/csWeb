module TripPlanner {

    export interface ITripPlannerScope extends ng.IScope {
        vm: TripPlannerCtrl;
    }

    export interface IOtpUrlParameters {
        [key: string]: any;
    }

    export class TripPlannerCtrl {
        private scope: ITripPlannerScope;
        public layer: csComp.Services.ProjectLayer;
        private urlAddress: string;
        private urlParameters: IOtpUrlParameters;
        private transportModes: { [key: string]: any };
        private transportMode: string;
        private fromLoc: number;
        private toLoc: number;
        public urlKeys = ['arriveBy', 'fromPlace', 'toPlace', 'intermediatePlaces', 'date', 'time', 'mode', 'maxWalkDistance', 'walkSpeed', 'bikeSpeed',
            'maxTimeSec', 'precisionMeters', 'zDataType', 'coordinateOrigin'];

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
            private $scope: ITripPlannerScope,
            private $http: ng.IHttpService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            this.layer = $scope.$parent["data"];
            this.urlParameters = {};
            this.urlKeys.forEach((key) => { this.urlParameters[key] = 0});
            this.transportModes = {};
            this.transportModes["Walking"] = "WALK";
            this.transportModes["Biking"] = "BICYCLE";
            //this.transportModes["Car"] = "CAR";
        }

        public planRoute() {
            this.layer.url = csComp.Helpers.joinUrlParameters(this.urlParameters, '?', '&', '=');
            if (!this.layer.enabled) {
                this.$layerService.addLayer(this.layer);
            } else {
                if (this.layer.layerSource) this.layer.layerSource.refreshLayer(this.layer);
            }
            this.$layerService.visual.rightPanelVisible = true;
        }

        public parseUrl() {
            this.urlParameters = csComp.Helpers.parseUrlParameters(this.layer.url, '?', '&', '=');
            this.transportMode = this.urlParameters['mode'];
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
        }

        private addCutoffTime() {
        }
    }
}
