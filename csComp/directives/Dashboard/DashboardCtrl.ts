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
            'messageBusService'
        ];


// dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IDashboardScope,
            private $compile : any,
            private $layerService: csComp.Services.LayerService,
            private $mapService : csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService
        ) {
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

                

                //alert(this.project.activeDashboard.id);
                $messageBusService.subscribe("dashboard-" + $scope.container,(s: string, d: csComp.Services.Dashboard) => {
                    switch (s) {
                        case "activated":                            
                            $scope.dashboard = d;
                            this.updateDashboard();
                            break;
                    }
                });

                this.project = $layerService.project;

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
            var newElement = this.$compile("<" + w.directive + " widget=" + w + "></" + w.directive + ">")(this.$scope);
            var el = $("#" + w.elementId);
            el.empty();
            el.append(newElement);
        }

        public checkMap() {

            if (this.$scope.dashboard.showMap != this.$mapService.mapVisible) {
                if (this.$scope.dashboard.showMap) {
                    this.$mapService.mapVisible = true; 
                } else {
                    this.$mapService.mapVisible = false;
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
            

    }
    }
}
