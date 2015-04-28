module csComp.Services {

    class InstanceLoader {
        constructor(private context: Object) {

        }

        getInstance(name: string, ...args: any[]) {
            var instance = Object.create(this.context["csComp"]["Services"][name].prototype);
            instance.constructor.apply(instance, args);
            return instance;
        }
    }

    declare var JSON;
    declare var io;

    export class DashboardService {
        public maxBounds: IBoundingBox;
        public featureDashboard: csComp.Services.Dashboard;
        
        public mainDashboard: csComp.Services.Dashboard;        
        public editMode: boolean;
        public activeWidget: IWidget;
        public dashboards: any; 
        public widgetTypes: { [key: string]: IWidget };
        public socket;

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
            widget.dashboard = dashboard;
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

        public editWidget(widget: csComp.Services.IWidget) {
            this.activeWidget = widget;
            (<any>$('#leftPanelTab a[href="#widgetedit"]')).tab('show'); // Select tab by name
        }

        public removeWidget() {
            if (this.activeWidget && this.mainDashboard) {
                this.mainDashboard.widgets = this.mainDashboard.widgets.filter((w: csComp.Services.IWidget) => w.id != this.activeWidget.id);
                this.activeWidget = null;
                (<any>$('#leftPanelTab a[href="#basewidgets"]')).tab('show'); // Select tab by name
            }
        } 

        
    }

}