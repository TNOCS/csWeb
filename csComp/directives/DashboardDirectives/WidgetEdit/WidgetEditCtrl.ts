module WidgetEdit {
    import IWidget = csComp.Services.IWidget;
    import WidgetStyle = csComp.Services.WidgetStyle;

    export interface IWidgetEditScope extends ng.IScope {
        widget: IWidget;
        vm: WidgetEditCtrl;

    }

    export class WidgetEditCtrl {
        private scope: IWidgetEditScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'mapService',
            'layerService',
            'messageBusService',
            'dashboardService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IWidgetEditScope,
            private mapService: csComp.Services.MapService,
            private layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private dashboardService: csComp.Services.DashboardService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            $scope.widget = dashboardService.activeWidget;
        }

        public selectStyle() {
            var style = this.$scope.widget.style;
            if (style === "custom") {
                this.$scope.widget.customStyle = JSON.parse(JSON.stringify(this.$scope.widget.effectiveStyle));
                this.$scope.widget.effectiveStyle = this.$scope.widget.customStyle;
            }
            else {
                this.$scope.widget.effectiveStyle = this.layerService.solution.widgetStyles[style];
                this.$scope.widget.customStyle = null;
            }

        }

        public removeWidget(widget: IWidget) {
            widget.parentDashboard.widgets = widget.parentDashboard.widgets.filter((w: IWidget) => { return widget.id != w.id });
            this.dashboardService.deactivateTabContainer("widget-content");
            this.dashboardService.deactivateTabContainer("widget");
        }


    }
}
