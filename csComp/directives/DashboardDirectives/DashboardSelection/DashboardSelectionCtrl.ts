module DashboardSelection {
    export interface IDashboardSelectionScope extends ng.IScope {
        vm: any; //DashboardSelectionCtrl;
        addWidget: Function;
        title: string;

    }

    export class DashboardSelectionCtrl {
        public scope: any;
        public project : csComp.Services.SolutionProject;
        public activeWidget : csComp.Services.BaseWidget;



        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'dashboardService',
            'mapService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: any,
            private $layerService: csComp.Services.LayerService,
            public $dashboardService : csComp.Services.DashboardService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {

            $scope.vm = this;


            //$messageBusService.subscribe("dashboardSelect", ((s: string, dashboard: csComp.Services.Dashboard) => {
            //    switch (s) {
            //        case "selectRequest":
            //            this.selectDashboard(dashboard);
            //            break;
            //    }
            //}));


        }

        public startWidgetEdit(widget : csComp.Services.BaseWidget)
        {
          this.$dashboardService.editWidget(widget);
        }

        /***
        Start editing a specific dashboard
        */
        public startDashboardEdit(dashboard : csComp.Services.Dashboard) {

          var rpt = new  csComp.Services.RightPanelTab();
          rpt.container = "dashboard";
          rpt.data = dashboard;
          rpt.directive = "dashboardedit";
          this.$messageBusService.publish("rightpanel","activate",rpt);

            this.$layerService.project.dashboards.forEach((d: csComp.Services.Dashboard) => {
                if (d.id !== dashboard.id) {
                  d.editMode = false;
                  d.disabled = true;
                }
              }
            );
            this.$dashboardService.stopEditWidget();
        }


        /***
        Stop editing a specific dashboard
        */
        public stopDashboardEdit(dashboard : csComp.Services.Dashboard)
        {
          this.$layerService.project.dashboards.forEach((d: csComp.Services.Dashboard) => {
                d.disabled = false;
                d.editMode = false;
            }
          );
          this.$dashboardService.stopEditWidget();
        }

        public stopEdit() {
            this.stopDashboardEdit(this.$layerService.project.activeDashboard);
            //for (var property in this.group.dashboards) {
                //this.group.dashboards[property].editMode = false;
            //}
            //this.activeWidget = null;

            //this.$scope.gridsterOptions.draggable.enabled = false;
            //this.$scope.gridsterOptions.resizable.enabled = false;
        }

        public startEdit() {

             //this.$scope.gridsterOptions.draggable.enabled = true;
            //this.$scope.gridsterOptions.resizable.enabled = true;
        }

        public widgetHighlight(widget : csComp.Services.BaseWidget)
        {
          widget.hover = true;
        }

        public widgetStopHighlight(widget : csComp.Services.BaseWidget)
        {
          widget.hover = false;
        }

        /** Add new dashboard */
        public addDashboard(widget: csComp.Services.IWidget) {
            var id = csComp.Helpers.getGuid();
            var d = new csComp.Services.Dashboard();
            d.id = id;
            d.showLeftmenu = true;
            d.showMap = true;
            d.name = "New Dashboard";
            this.$layerService.project.dashboards.push(d);
        }

        /** Remove existing dashboard */
        public removeDashboard(key: string) {
            this.$layerService.project.dashboards = this.$layerService.project.dashboards.filter((s : csComp.Services.Dashboard) => s.id !== key);

        }

        





        /** publish a message that a new dashboard was selected */
        private publishDashboardUpdate() {
            this.$messageBusService.publish('dashboard', 'onDashboardSelected', this.$layerService.project.activeDashboard);
        }

        /** Select an active dashboard */
        public selectDashboard(dashboard: csComp.Services.Dashboard) {
            //var res = JSON.stringify(this.$dashboardService.dashboards);
            for (var key in this.$layerService.project.dashboards)
            {
              this.$layerService.project.dashboards[key].editMode = false;
            }

            if (dashboard) {
                //this.$dashboardService.mainDashboard = dashboard;
                if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }

                setTimeout(() => {

                    //this.$dashboardService.checkMap();
                    //this.checkTimeline();
                    //this.checkViewbound();
                    this.publishDashboardUpdate();
                    //this.checkLayers();
                }, 100);

                // render all widgets
                //this.refreshDashboard();
            }
        }

    }
}
