module Accessibility {

    export interface IAccessibilityScope extends ng.IScope {
        vm: AccessibilityCtrl;
    }

    export class AccessibilityCtrl {
        private scope: IAccessibilityScope;
        public layer: csComp.Services.ProjectLayer;
        private walkSpeed: number;

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
        }

        public refreshAccessibility() {
            var urlParams = this.layer.url.split('&');
            var locationIndex = -1;
            urlParams.some((param, index) => {
                if (param.substring(0,9) === 'walkSpeed') {
                    locationIndex = index;
                    return true;
                }
                return false;
            });
            urlParams[locationIndex] = 'walkSpeed=' + this.walkSpeed;
            this.layer.url = urlParams.join('&');
            if (!this.layer.enabled) {
                this.$layerService.addLayer(this.layer);
            } else {
                if (this.layer.layerSource) this.layer.layerSource.refreshLayer(this.layer);
            }
            this.$layerService.visual.rightPanelVisible = true;
        }
    }
}
