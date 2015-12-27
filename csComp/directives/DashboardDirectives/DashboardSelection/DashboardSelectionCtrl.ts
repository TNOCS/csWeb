module DashboardSelection {
    export interface IDashboardSelectionScope extends ng.IScope {
        vm: any; //DashboardSelectionCtrl;
        addWidget: Function;

        widgetStyle: csComp.Services.WidgetStyle;
        title: string;
    }

    declare var interact;

    export class DashboardSelectionCtrl {
        public scope: any;
        public project: csComp.Services.SolutionProject;
        public activeWidget: csComp.Services.BaseWidget;
        public style: string;

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
            public $dashboardService: csComp.Services.DashboardService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService
        ) {
            $scope.vm = this;
            this.$messageBusService.subscribe('project', (s, a) => {
                this.style = 'default';
                this.selectStyle();
            });
        }

        public initDrag(key: string) {
            var transformProp;
            var startx, starty;

            interact('#widgettype-' + key)
                .draggable({ max: Infinity })
                .on('dragstart', (event) => {
                    startx = 0;
                    starty = 0;
                    event.interaction.x = parseInt(event.target.getAttribute('data-x'), 10) || 0;
                    event.interaction.y = parseInt(event.target.getAttribute('data-y'), 10) || 0;
                    event.target.style.width = '300px';
                    event.target.style.height = '300px';
                })
                .on('dragmove', (event) => {
                    event.interaction.x += event.dx;
                    event.interaction.y += event.dy;
                    event.target.style.left = event.interaction.x + 'px';
                    event.target.style.top = event.interaction.y + 'px';
                })
                .on('dragend', (event) => {
                    setTimeout(() => {
                        var widget = <csComp.Services.IWidget>{};

                        widget.directive = key;
                        widget.id = csComp.Helpers.getGuid();
                        widget.left = (event.clientX - 350) + "px"; //(parseInt(event.target.style.left.replace('px', '')) - 150) + "px";
                        widget.top = (event.clientY - 50) + "px"; //(parseInt(event.target.style.top.replace('px', '')) - 150) + "px";
                        widget.data = {};
                        widget.width = '300px';
                        widget.height = '300px';
                        widget.style = this.style;
                        widget.enabled = true;
                        csComp.Services.Dashboard.addNewWidget(widget, this.$layerService.project.activeDashboard, this.$layerService.solution);
                        this.$dashboardService.editWidget(widget)
                    }, 100);

                    //this.$dashboardService.mainDashboard.widgets.push(widget);
                    event.target.setAttribute('data-x', 0);
                    event.target.setAttribute('data-y', 0);
                    event.target.style.left = '0px';
                    event.target.style.top = '0px';
                    event.target.style.width = '75px';
                    event.target.style.height = '75px';
                    //console.log(key);
                });
        }

        public startWidgetEdit(widget: csComp.Services.BaseWidget) {
            this.$dashboardService.editWidget(widget);
        }

        /**
        * Start editing a specific dashboard
        */
        public startDashboardEdit(dashboard: csComp.Services.Dashboard) {
            var rpt = new csComp.Services.RightPanelTab();
            rpt.container = 'dashboard';
            rpt.data = dashboard;
            rpt.directive = 'dashboardedit';
            this.$messageBusService.publish('rightpanel', 'activate', rpt);

            this.$layerService.project.dashboards.forEach((d: csComp.Services.Dashboard) => {
                if (d.id !== dashboard.id) {
                    d.editMode = false;
                    d.disabled = true;
                }
            });
            this.$dashboardService.stopEditWidget();
        }

        /**
        * Stop editing a specific dashboard
        */
        public stopDashboardEdit(dashboard: csComp.Services.Dashboard) {
            this.$layerService.project.dashboards.forEach((d: csComp.Services.Dashboard) => {
                d.disabled = false;
                d.editMode = false;
            });
            this.$dashboardService.stopEditWidget();
        }

        public stopEdit() {
            this.stopDashboardEdit(this.$layerService.project.activeDashboard);
        }

        public startEdit() {}

        public widgetHighlight(widget: csComp.Services.BaseWidget) {
            widget.hover = true;
        }

        public widgetStopHighlight(widget: csComp.Services.BaseWidget) {
            widget.hover = false;
        }

        /** Add new dashboard */
        public addDashboard(widget: csComp.Services.IWidget) {
            var d = new csComp.Services.Dashboard();
            d.id = csComp.Helpers.getGuid();
            d.showLeftmenu = true;
            d.showMap = true;
            d.name = 'New Dashboard';
            this.$layerService.project.dashboards.push(d);
        }

        /** Remove existing dashboard */
        public removeDashboard(key: string) {
            this.$layerService.project.dashboards = this.$layerService.project.dashboards.filter((s: csComp.Services.Dashboard) => s.id !== key);
        }

        public selectStyle() {
            this.$scope.widgetStyle = this.$layerService.solution.widgetStyles[this.style];
            console.log(this.$scope.widgetStyle);
        }

        /** publish a message that a new dashboard was selected */
        private publishDashboardUpdate() {
            this.$messageBusService.publish('dashboard', 'onDashboardSelected', this.$layerService.project.activeDashboard);
        }

        /** Select an active dashboard */
        public selectDashboard(dashboard: csComp.Services.Dashboard) {
            //var res = JSON.stringify(this.$dashboardService.dashboards);
            for (var key in this.$layerService.project.dashboards) {
                this.$layerService.project.dashboards[key].editMode = false;
            }

            if (dashboard) {
                //this.$dashboardService.mainDashboard = dashboard;
                if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }

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
