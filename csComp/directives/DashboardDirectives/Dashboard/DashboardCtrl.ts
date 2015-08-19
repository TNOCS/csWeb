module Dashboard {

    import Dashboard = csComp.Services.Dashboard;

    declare var c3;

    export interface IDashboardScope extends ng.IScope {
        vm: DashboardCtrl;
        dashboard: csComp.Services.Dashboard;
        container: string;
        param: any;
        initDashboard: Function;
        minus: Function;
    }

    export interface IWidgetScope extends ng.IScope {
        data: any;
    }

    export class DashboardCtrl {
        private scope: IDashboardScope;
        private project: csComp.Services.Project;

        //public dashboard: csComp.Services.Dashboard;

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$compile',
            'layerService',
            'mapService',
            'messageBusService',
            'dashboardService',
            '$templateCache', '$timeout'
        ];


        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IDashboardScope,
            private $compile: any,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService,
            private $templateCache: any,
            private $timeout: ng.ITimeoutService
            ) {

            //alert('init dashboard ctrl');

            $scope.vm = this;

            $messageBusService.subscribe('project', (e, f) => {
                if (e === "loaded") {
                    $scope.dashboard = null;
                }
            });


            $scope.initDashboard = () => {
                //if (!$scope.container) $scope.container = "main";
                $messageBusService.subscribe("dashboard-" + $scope.container, (s: string, d: csComp.Services.Dashboard) => {
                    this.project = $layerService.project;
                    this.project.activeDashboard = d;
                    //alert(this.project.activeDashboard.id);
                    switch (s) {
                        case "activated":
                            $scope.dashboard = d;
                            this.updateDashboard();
                            break;
                    }
                });
                //this.updateDashboard();
                //alert($scope.dashboard.name);
            };
        }

        public toggleWidget(widget: csComp.Services.IWidget) {
            if (widget.canCollapse) {
                widget.collapse = !widget.collapse;
            }
        }

        public updateWidget(w: csComp.Services.IWidget) {
            //alert('updatewidget');
            //this.$dashboardService.updateWidget(w);
            //var newElement = this.$compile("<" + w.directive + " widget=" + w + "></" + w.directive + ">")(this.$scope);
            console.log('updating widget');
            var widgetElement;
            var newScope = this.$scope;
            (<any>newScope).widget = w;

            if (w.template) {
                widgetElement = this.$compile(this.$templateCache.get(w.template))(newScope);
            }
            else if (w.url) {
                widgetElement = this.$compile("<div>url</div>")(this.$scope);
            } else if (w.directive) {
                //var newScope : ng.IScope;
                widgetElement = this.$compile("<" + w.directive + "></" + w.directive + ">")(newScope);

            } else {
                widgetElement = this.$compile("<h1>hoi</h1>")(this.$scope);
            }

            var resized = function() {
                //alert('resize');
                /* do something */
            };
            if (widgetElement) {
                widgetElement.resize(resized);

                //alert(w.elementId);
                var el = $("#" + w.elementId);
                el.empty();
                el.append(widgetElement);
            }
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
        }

        public checkMap() {
            if (this.$scope.dashboard.showMap != this.$layerService.visual.mapVisible) {
                if (this.$scope.dashboard.showMap) {
                    this.$layerService.visual.mapVisible = true;
                } else {
                    this.$layerService.visual.mapVisible = false;
                }
                if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
            }

            if (this.$scope.dashboard.viewBounds) {
                console.log('set bound');
                this.$layerService.activeMapRenderer.fitBounds(this.$scope.dashboard.viewBounds);
            }

            if (this.$scope.dashboard.showMap && this.$scope.dashboard.baselayer) {
                this.$messageBusService.publish("map", "setbaselayer", this.$scope.dashboard.baselayer);
            }
        }

        public checkLayers() {
            var db = this.$layerService.project.activeDashboard;
            if (db.visiblelayers) {
                this.$layerService.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                    g.layers.forEach((l: csComp.Services.ProjectLayer) => {
                        if (l.enabled && db.visiblelayers.indexOf(l.reference) == -1) {
                            this.$layerService.removeLayer(l);
                            l.enabled = false;
                        }
                        if (!l.enabled && db.visiblelayers.indexOf(l.reference) >= 0) {
                            this.$layerService.addLayer(l);
                            l.enabled = true;
                        }
                    });
                });
            }
        }

        public checkViewbound() {
            var db = this.$layerService.project.activeDashboard;
            if (db.viewBounds) {
                this.$layerService.activeMapRenderer.fitBounds(db.viewBounds);
            }
        }

        public checkTimeline() {
            if (this.$scope.dashboard.showTimeline != this.$mapService.timelineVisible) {
                if (this.$scope.dashboard.showTimeline) {
                    this.$mapService.timelineVisible = true;
                } else {
                    this.$mapService.timelineVisible = false;
                }
                if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
            }
        }

        public isReady(widget: csComp.Services.IWidget) {
            setTimeout(() => {
                //this.updateWidget(widget);
            }, 10);

        }

        public updateDashboard() {
            var d = this.$scope.dashboard;
            if (!d) return;
            if (!d.widgets) d.widgets = [];
            if (d.showLegend) {
                var legendWidgetPresent = false;
                d.widgets.forEach(w => {
                    if(w.id === 'legend') legendWidgetPresent = true;
                });
                if (!legendWidgetPresent) {
                    console.log('Create legend');
                    var w = <csComp.Services.IWidget>{};
                    w.directive = 'legend-directive';
                    w.id = 'legend';
                    w.title = 'Legenda';
                    w.data = {mode: 'lastSelectedStyle'};
                    w.left = '10px';
                    w.top = '20px';
                    w.width = '150px';
                    w.enabled = true;
                    this.$dashboardService.addNewWidget(w, d);
                    //this.$dashboardService.selectDashboard(this.$layerService.project.activeDashboard, 'main');
                }
            }

            this.checkMap();
            this.checkTimeline();
            this.checkLayers();
            this.checkViewbound();
            //this.$messageBusService.publish("leftmenu",(d.showLeftmenu) ? "show" : "hide");
            if (!this.$mapService.isAdminExpert) {
                this.$layerService.visual.leftPanelVisible = d.showLeftmenu;
                this.$layerService.visual.rightPanelVisible = d.showRightmenu;
            }
            this.$timeout(() => {
                d.widgets.forEach((w: any) => {
                    this.updateWidget(w);
                });
            }, 100);

            //this.$layerService.rightMenuVisible = d.showLeftmenu;
            //this.$mapService.rightMenuVisible = d.showRightmenu;
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
        }
    }
}
