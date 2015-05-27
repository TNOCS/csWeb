module csComp.Services {

    class InstanceLoader {
        constructor(private context: Object) {}

        getInstance(name: string, ...args: any[]) {
            var instance = Object.create(this.context["csComp"]["Services"][name].prototype);
            instance.constructor.apply(instance, args);
            return instance;
        }
    }

    declare var JSON;
    declare var io;

    export class RightPanelTab
    {
      public title : string;
      public container : string;
      public directive : string;
      public data : any;
      public icon : string = "tachometer";
    }

    export class DashboardService {
        public maxBounds: IBoundingBox;
        public featureDashboard: csComp.Services.Dashboard;

        public mainDashboard: csComp.Services.Dashboard;
        public editMode: boolean;
        public activeWidget: IWidget;
        public dashboards: any;
        public widgetTypes: { [key: string]: IWidget };
        public socket;
        public editWidgetMode : boolean;

        public init() {
            //alert('init');
        }

        public static $inject = [
            '$rootScope',
            '$compile',
            '$location',
            '$translate',
            'messageBusService',
            'layerService',
            'mapService'
        ];

        constructor(
            private $rootScope: any,
            private $compile : any,
            private $location: ng.ILocationService,
            private $translate: ng.translate.ITranslateService,
            private $messageBusService: Services.MessageBusService,
            private $layerService : Services.LayerService,
            private $mapService: Services.MapService) {

            //$translate('FILTER_INFO').then((translation) => console.log(translation));
            // NOTE EV: private props in constructor automatically become fields, so mb and map are superfluous.

            //alert('init dashbard');
            this.mainDashboard = new csComp.Services.Dashboard();
            this.dashboards = [];
            this.dashboards["main"] = this.mainDashboard;
            this.widgetTypes = {};

            this.$messageBusService.subscribe("dashboard",(event: string, id: string) => {
                alert(event);
            });
            this.$messageBusService.subscribe("rightpanel",(event : string, tab: RightPanelTab)=>{
              switch (event)
              {
                case "activate":
                  this.activateTab(tab);
                  break;
              }

            });

            //this.widgetTypes["Title"] = new TitleWidget();
            //this.widgetTypes["Text"] = new TextWidget();
            //this.widgetTypes["DataSet"] = new DataSetWidget();
            //this.widgetTypes["Layer"] = new LayerWidget();

            //this.socket = new io();

            //this.socket.on('update', (s) => {
            //    alert(s.topic);

            //});
            //this.socket.connect();

        }

        public selectDashboard(dashboard: csComp.Services.Dashboard, container: string) {
            this.$layerService.project.activeDashboard = dashboard;
            this.$messageBusService.publish("dashboard-" + container, "activated", dashboard);
        }

        public addNewWidget(widget: IWidget, dashboard: Dashboard) : IWidget {
            //var loader = new InstanceLoader(window);
            //var w = <IWidget>loader.getInstance(widget.widgetType);
            //w.messageBusService = this.$messageBusService;
            //w.layerService = this.$layerService;
            //w.init();
            //var w = BaseWidget();
            if (!widget.id) widget.id = csComp.Helpers.getGuid();
            widget.elementId = "widget-" + widget.id;
            widget.parentDashboard = dashboard;
            dashboard.widgets.push(widget);
            if (this.$rootScope.$root.$$phase != '$apply' && this.$rootScope.$root.$$phase != '$digest') { this.$rootScope.$apply(); }
            setTimeout(() => {
                //if (w != null) w.renderer(this.$compile, this.$rootScope);
                this.updateWidget(widget);

            }, 50);
            //this.editWidget(w);
            return widget;
        }

        public updateWidget(widget: csComp.Services.IWidget) {
            //alert('hoi arnoud');
            var d = JSON.stringify(widget.data);
            var newElement = this.$compile("<" + widget.directive + " widget='" + d + "'></" + widget.directive + ">")(this.$rootScope);
            var el = $("#" + widget.elementId);
            el.empty();
            el.append(newElement);
        }

        public addWidget(widget: IWidget) : IWidget {
            return this.addNewWidget(widget, this.mainDashboard);
        }

        public activateTab(tab : RightPanelTab)
        {
          this.$layerService.visual.rightPanelVisible = true;
          var content = tab.container + "-content";
          $("#" + tab.container + "-tab").remove();
          $("#" + content).remove();
          $("#rightpanelTabs").append("<li id='" + tab.container + "-tab' class='rightPanelTab rightPanelTabAnimated'><a id='" + tab.container + "-tab-a' href='#" + content + "' data-toggle='tab'><span class='fa fa-" + tab.icon + " fa-lg'></span></a></li>");
          $("#rightpanelTabPanes").append("<div class='tab-pane' style='width:355px' id='" + content + "'></div>");
          $("#" + tab.container + "-tab-a").click(()=> {
            this.$layerService.visual.rightPanelVisible = true;
            console.log('rp visible');
            this.$rootScope.$apply();
          });
          var newScope =  this.$rootScope;
          (<any>newScope).data = tab.data;
          var widgetElement = this.$compile("<" + tab.directive + "></" + tab.directive + ">")(newScope);
          $("#" + content).append(widgetElement);
          (<any>$("#rightpanelTabs a[href='#" + content + "']")).tab('show');
        }

        public editWidget(widget: csComp.Services.IWidget) {
            this.activeWidget = widget;
            this.editWidgetMode = true;
            // $("#widgetEdit").addClass('active');

            var rpt = new RightPanelTab();
            rpt.container = "widget";
            rpt.data = widget;
            rpt.title = "Edit Widget";
            rpt.directive = "widgetedit";
            this.$messageBusService.publish("rightpanel","activate",rpt);

            //(<any>$('#leftPanelTab a[href="#widgetedit"]')).tab('show'); // Select tab by name
        }

        public stopEditWidget()
        {
          this.activeWidget = null;
          this.editWidgetMode = false;
          this.$layerService.visual.rightPanelVisible = false;
          $("#widgetEdit").removeClass('active');
        }

        public removeWidget() {
            if (this.activeWidget && this.mainDashboard) {
                this.mainDashboard.widgets = this.mainDashboard.widgets.filter((w: csComp.Services.IWidget) => w.id != this.activeWidget.id);
                this.activeWidget = null;
                (<any>$('#leftPanelTab a[href="#basewidgets"]')).tab('show'); // Select tab by name
            }
        }
    }

    /**
      * Register service
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    myModule.service('dashboardService', csComp.Services.DashboardService)
}
