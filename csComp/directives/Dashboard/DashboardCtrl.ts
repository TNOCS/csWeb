module Dashboard {

    import Dashboard = csComp.Services.Dashboard;

    declare var c3;

    export interface IDashboardScope extends ng.IScope {
        vm: DashboardCtrl;
        gridsterOptions: any;
        dashboard: csComp.Services.Dashboard;
        container : string;
        param: any;
        initDashboard: Function;
        minus: Function;
           

    }

    export interface IWidgetScope extends ng.IScope
    {
      data : any;
    }



    export class DashboardCtrl {
        private scope: IDashboardScope;
        private project : csComp.Services.Project;

        //public dashboard: csComp.Services.Dashboard;

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$compile',
            'layerService',
            'mapService'           ,
            'messageBusService',
            '$templateCache'
        ];

         
// dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IDashboardScope,
            private $compile : any,
            private $layerService: csComp.Services.LayerService,
            private $mapService : csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $templateCache : any
            ) {

            //alert('init dashboard ctrl');

            $scope.vm = this;

            $scope.gridsterOptions = {
                margins: [10, 10],
                columns: 20,
                rows: 20,
                draggable: {
                    enabled:true
                },
                resizable: {
                    enabled: true,
                    start: (event, uiWidget, $element: csComp.Services.IWidget) => {
                        $element.resize("start", uiWidget.width(), uiWidget.height());
                    },
                    stop: (event, uiWidget, $element: csComp.Services.IWidget) => {
                        $element.resize("stop", uiWidget.width(), uiWidget.height());
                    }, 
                    resize: (event, uiWidget, $element: csComp.Services.IWidget) => {

                        $element.resize("change", uiWidget.width(),uiWidget.height());
                    }
                }
            };




            $scope.initDashboard = () => {

                $messageBusService.subscribe("dashboard-" + $scope.container,(s: string, d: csComp.Services.Dashboard) => {
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
            var widgetElement;
            var newScope =  this.$scope;
            (<any>newScope).data = "test";

            if (w.template) {
                widgetElement = this.$compile(this.$templateCache.get(w.template))(newScope);
            }
            else if (w.url) {
                widgetElement = this.$compile("<div>url</div>")(this.$scope);
            } else if (w.directive) {
               //var newScope : ng.IScope;


                widgetElement = this.$compile("<" + w.directive + " widget=" + w + "></" + w.directive + ">")(newScope);

            } else {
                widgetElement = this.$compile("<h1>hoi</h1>")(this.$scope);
            }


            var resized = function () {
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
                            this.$layerService.activeMapRenderer.addLayer(l);
                            l.enabled = true;
                        }
                    });

                });
            }

        }


        public checkViewbound() {
            var db = this.$layerService.project.activeDashboard;
            if (db.viewBounds) {
                this.$mapService.map.fitBounds(new L.LatLngBounds(db.viewBounds.southWest, db.viewBounds.northEast));
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


        public updateDashboard() {
            var d = this.$scope.dashboard;
            if (!d) return;
            if (d.widgets && d.widgets.length > 0) {
            setTimeout(() => {
                d.widgets.forEach((w: csComp.Services.IWidget) => {
                    this.updateWidget(w);
                });
                }, 100);
            }
            this.checkMap();
            this.checkTimeline();
            this.checkLayers();
            this.checkViewbound();
            this.$messageBusService.publish("leftmenu",(d.showLeftmenu) ? "show" : "hide");
            this.$mapService.rightMenuVisible = d.showRightmenu;



        }
    }
}
