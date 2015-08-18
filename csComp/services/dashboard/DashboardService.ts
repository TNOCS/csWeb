module csComp.Services {


    /** Contains properties needed to describe right panel */
    export class RightPanelTab {
        public title: string;
        public container: string;
        public directive: string;
        public data: any;
        public icon: string = 'tachometer';
        public popover: string = '';
    }

    /** service for managing dashboards */
    export class DashboardService {
        public maxBounds: IBoundingBox;
        public featureDashboard: csComp.Services.Dashboard;

        public mainDashboard: csComp.Services.Dashboard;
        public editMode: boolean;
        public activeWidget: IWidget;
        public dashboards: any;
        public widgetTypes: { [key: string]: IWidget };
        public socket;
        public editWidgetMode: boolean; 5

        public static $inject = [
            '$rootScope',
            '$compile',
            '$injector',
            '$location',
            '$timeout',
            '$translate',
            'messageBusService',
            'layerService',
            'mapService',
        ];

        constructor(
            private $rootScope: any,
            private $compile: any,
            private $injector: any,
            private $location: ng.ILocationService,
            private $timeout: ng.ITimeoutService,
            private $translate: ng.translate.ITranslateService,
            private $messageBusService: Services.MessageBusService,
            private $layerService: Services.LayerService,
            private $mapService: Services.MapService

            ) {

            //$translate('FILTER_INFO').then((translation) => console.log(translation));
            // NOTE EV: private props in constructor automatically become fields, so mb and map are superfluous.

            //alert('init dashbard');
            this.mainDashboard = new csComp.Services.Dashboard();
            this.dashboards = [];
            this.dashboards["main"] = this.mainDashboard;
            this.widgetTypes = {};

            this.$messageBusService.subscribe("dashboard", (event: string, id: string) => {
                alert(event);
            });
            this.$messageBusService.subscribe("rightpanel", (event: string, tab: any) => {
                switch (event) {
                    case "activate":
                        this.activateTab(<RightPanelTab>tab);
                        break;
                    case "deactivate":
                        this.deactivateTab(<RightPanelTab>tab);
                        break;
                    case "deactiveContainer":
                        this.deactivateTabContainer(<string>tab);
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

        public addNewWidget(widget: IWidget, dashboard: Dashboard): IWidget {
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

        public addWidget(widget: IWidget): IWidget {
            return this.addNewWidget(widget, this.mainDashboard);
        }



        public activateTab(tab: RightPanelTab) {
            if (!tab.hasOwnProperty("container")) return;
            this.$layerService.visual.rightPanelVisible = true;
            var content = tab.container + "-content";
            $("#" + tab.container + "-tab").remove();
            var c = $("#" + content);
            try {
                if (c) c.remove();
            }
            catch (e) {

            }
            var popoverString = '';
            if (tab.popover !== '' && (this.$mapService.expertMode === Expertise.Beginner || this.$mapService.expertMode === Expertise.Intermediate)) {
                popoverString = "popover='" + tab.popover + "' popover-placement='left' popover-trigger='mouseenter' popover-append-to-body='true'";
            }
            $("#rightpanelTabs").append(this.$compile("<li id='" + tab.container + "-tab' class='rightPanelTab rightPanelTabAnimated' " + popoverString + "><a id='" + tab.container + "-tab-a' href='#" + content + "' data-toggle='tab'><span class='fa fa-" + tab.icon + " fa-lg'></span></a></li>")(this.$rootScope));
            $("#rightpanelTabPanes").append("<div class='tab-pane' style='width:355px' id='" + content + "'></div>");
            $("#" + tab.container + "-tab-a").click(() => {
                this.$layerService.visual.rightPanelVisible = true;
                console.log('rp visible');
                this.$rootScope.$apply();
            });
            var newScope = this.$rootScope;
            (<any>newScope).data = tab.data;
            var widgetElement = this.$compile("<" + tab.directive + "></" + tab.directive + ">")(newScope);
            $("#" + content).append(widgetElement);
            (<any>$("#rightpanelTabs a[href='#" + content + "']")).tab('show');
        }

        public deactivateTabContainer(container: string) {
            this.$layerService.visual.rightPanelVisible = false;
            var content = container + "-content";
            $("#" + container + "-tab").remove();
            try {
                $("#" + content).remove();
            }
            catch (e) { }
            this.$timeout(() => { }, 0);
        }

        public deactivateTab(tab: RightPanelTab) {
            if (!tab.hasOwnProperty("container")) return;
            this.deactivateTabContainer(tab.container);
        }

        public editWidget(widget: csComp.Services.IWidget) {
            this.activeWidget = widget;
            this.editWidgetMode = true;
            // $("#widgetEdit").addClass('active');

            var rpt = csComp.Helpers.createRightPanelTab('widget', 'widgetedit', widget, 'Edit widget', 'Edit widget', 'th-large');
            this.$messageBusService.publish('rightpanel', 'activate', rpt);

            // check if editor exists
            if (this.$injector.has(widget.directive + 'EditDirective')) {
                var rptc = csComp.Helpers.createRightPanelTab('widget-content', widget.directive + "-edit", widget, 'Edit widget', 'Edit widget', 'cog');
                this.$messageBusService.publish('rightpanel', 'activate', rptc);
            }

            //(<any>$('#leftPanelTab a[href="#widgetedit"]')).tab('show'); // Select tab by name
        }

        public stopEditWidget() {
            this.activeWidget = null;
            this.editWidgetMode = false;
            //this.$layerService.visual.rightPanelVisible = false;
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
