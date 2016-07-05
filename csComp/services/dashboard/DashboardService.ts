module csComp.Services {
    /** Contains properties needed to describe right panel */
    export class RightPanelTab {
        public title: string;
        public container: string;
        public directive: string;
        public data: any;
        public icon: string = 'tachometer';
        public popover: string = '';
        public open: boolean = true;
        public replace: boolean = true;
        public canClose: boolean = true;
    }

    /** When searching, specify the search query */
    export interface ISearch {
        /** If true, the search is active. */
        isActive?: boolean;
        /** Query string to search for */
        query: string;
    }

    /** service for managing dashboards */
    export class DashboardService {
        public maxBounds: IBoundingBox;
        public featureDashboard: csComp.Services.Dashboard;

        public mainDashboard: csComp.Services.Dashboard;
        public editMode: boolean;
        public activeWidget: IWidget;
        public dashboards: any;
        public widgetTypes: { [key: string]: IWidget } = {};
        public chartGenerators: { [key: string]: Function } = {};
        public socket;
        public editWidgetMode: boolean;
        /** Search status: if isActive is true, show the Navigate directive. */
        public _search: ISearch = { isActive: false, query: '' };
        /** website is running in touch mode */
        public touchMode: boolean;
        public rightPanelTabs: { [key: string]: RightPanelTab } = {};

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
            'localStorageService'
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
            private $mapService: Services.MapService,
            private $localStorageService: ng.localStorage.ILocalStorageService
        ) {

            //$translate('FILTER_INFO').then((translation) => console.log(translation));
            // NOTE EV: private props in constructor automatically become fields, so mb and map are superfluous.

            //alert('init dashbard');
            this.mainDashboard = new csComp.Services.Dashboard();
            this.dashboards = [];
            this.dashboards['main'] = this.mainDashboard;
            this.touchMode = $localStorageService.get("touchmode");

            this.chartGenerators['sensordata'] = () => { return new csComp.Services.propertySensordataGenerator(this.$layerService, this); };
            this.chartGenerators['layerSensorData'] = () => { return new csComp.Services.layerPropertySensordataGenerator(this.$layerService, this); }
            this.chartGenerators['kpi'] = () => { return new csComp.Services.layerKpiGenerator(this.$layerService, this); }
            this.chartGenerators['top10'] = () => { return new csComp.Services.top10Generator(this.$layerService, this); };

            // this.$messageBusService.subscribe("dashboard", (event: string, id: string) => {
            //     //alert(event);
            // });
            this.$messageBusService.subscribe('rightpanel', (event: string, tab: RightPanelTab | string) => {
                switch (event) {
                    case 'activate':
                            this.activateTab(tab);
                        break;
                    case 'deactivate':
                        this.deactivateTab(<RightPanelTab>tab);
                        break;
                    case 'deactiveContainer':
                        this.deactivateTabContainer(<string>tab);
                        break;
                }
            });

            this.widgetTypes['agenda'] = <csComp.Services.IWidget>{
                id: 'agenda',
                icon: 'bower_components/csweb/dist-bower/images/widgets/agenda.png',
                description: 'Show an event calendar.'
            };
            this.widgetTypes['presentation'] = <csComp.Services.IWidget>{
                id: 'presentation',
                icon: 'bower_components/csweb/dist-bower/images/widgets/presentation.png',
                description: 'Create and share presentations.'
            };
            this.widgetTypes['buttonwidget'] = <IWidget>{
                id: 'buttonwidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/touchbutton.png',
                description: 'Simple on/off button for executing an action.'
            };
            this.widgetTypes['focustimewidget'] = <IWidget>{
                id: 'focustimewidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/touchbutton.png',
                description: 'Widget showing focus time'
            };
            this.widgetTypes['indicators'] = <IWidget>{
                id: 'indicators',
                icon: 'bower_components/csweb/dist-bower/images/widgets/indicators.png',
                description: 'Showing sensor data using charts'
            };
            this.widgetTypes['charts'] = <IWidget>{
                id: 'charts',
                icon: 'bower_components/csweb/dist-bower/images/widgets/markdown.png',
                description: 'Show custom chart'
            };
            this.widgetTypes['markdownwidget'] = <IWidget>{
                id: 'markdownwidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/markdown.png',
                description: 'Show custom markdown or html content'
            };
            this.widgetTypes['headerwidget'] = <IWidget>{
                id: 'headerwidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/markdown.png',
                description: 'Shows a header'
            };
            this.widgetTypes['tablewidget'] = <IWidget>{
                id: 'tablewidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/table.png',
                description: 'Shows a data table'
            };
            this.widgetTypes['mcawidget'] = <IWidget>{
                id: 'mcawidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/mca.png',
                description: 'Show available MCA\'s'
            };
            this.widgetTypes['iframewidget'] = <IWidget>{
                id: 'iframewidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/markdown.png',
                description: 'Show custom iframe'
            };
            this.widgetTypes['kanbanboard'] = <IWidget>{
                id: 'kanbanboard',
                icon: 'bower_components/csweb/dist-bower/images/widgets/markdown.png',
                description: 'Show kanbanboard'
            };
            this.widgetTypes['legendDirective'] = <IWidget>{
                id: 'legendDirective',
                icon: 'bower_components/csweb/dist-bower/images/widgets/markdown.png',
                description: 'Show Legend'
            };
            this.widgetTypes['navigator'] = <IWidget>{
                id: 'navigatorwidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/markdown.png',
                description: 'Show navigator'
            };
            this.widgetTypes['postman'] = <IWidget>{
                id: 'postman',
                icon: 'bower_components/csweb/dist-bower/images/widgets/Script.png',
                description: 'POST messages'
            };
            this.widgetTypes['simtimecontroller'] = <IWidget>{
                id: 'simtimecontroller',
                icon: 'bower_components/csweb/dist-bower/images/widgets/Media-Play.png',
                description: 'Show simulation time controller'
            };
            this.widgetTypes['simstate'] = <IWidget>{
                id: 'simstate',
                icon: 'bower_components/csweb/dist-bower/images/widgets/ServerStatus.png',
                description: 'Show status of simulation services.'
            };
            this.widgetTypes['locationwidget'] = <IWidget>{
                id: 'locationwidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/search.png',
                description: 'Show reverse geocode info.'
            };
            this.widgetTypes['filterstylewidget'] = <IWidget>{
                id: 'filterstylewidget',
                icon: 'bower_components/csweb/dist-bower/images/widgets/filter.png',
                description: 'A widget combining legend, style and filter.'
            };
        }

        public get search(): ISearch { return this._search; };
        public set search(s: ISearch) {
            this._search = s;
            if (s.query && s.query.length > 0) {
                $('#navigate_header').trigger('click');
                // this._search.isActive = s.isActive = this.$layerService.visual.leftPanelVisible = true;
                this._search.isActive = s.isActive = true;
                this.$messageBusService.publish('search', 'update', s);
            } else {
                if ($('#navigate_header').is(':visible')) $('#left_menu_headers li:visible:first').next().trigger('click');
                this._search.isActive = s.isActive = false;
                this.$messageBusService.publish('search', 'reset');
            }
        }

        public leftMenuVisible(id: string): boolean {
            var d = this.$layerService.project.activeDashboard;
            if (!d.visibleLeftMenuItems) return true;
            return (d.visibleLeftMenuItems.indexOf(id) >= 0);
        }

        public selectDashboard(dashboard: csComp.Services.Dashboard, container: string) {
            this.$location.search('dashboard', dashboard.id);
            if (!_.isUndefined(dashboard.refreshPage) && dashboard.refreshPage) {
                location.reload();
            } else {
                this.$messageBusService.publish('updatelegend', 'removelegend');
                //this.$layerService.project.activeDashboard = dashboard;
                dashboard._initialized = false;
                this.$messageBusService.publish('dashboard-' + container, 'activated', dashboard);
            }
        }

        public closeContainer() {
            alert('close container');
        }

        public activateTab(t: any) {
            if (typeof t === 'string') {
                 (<any>$('#rightpanelTabs a[data-target="#' + t + '-content"]')).tab('show');
                this.$layerService.visual.rightPanelVisible = true;
            } else {
                var tab = t as RightPanelTab;
                if (!tab.hasOwnProperty('container')) return;
                var content = tab.container + '-content';
                if (this.rightPanelTabs.hasOwnProperty(tab.container) && this.rightPanelTabs[tab.container].directive === tab.directive && !tab.replace) {
                    (<any>$('#rightpanelTabs a[data-target="#' + content + '"]')).tab('show');
                    return;
                }

                $('#' + tab.container + '-tab').remove();
                var c = $('#' + content);
                try {
                    if (c) c.remove();
                } catch (e) {
                    return;
                }
                var popoverString = '';
                if (tab.popover !== '' && (this.$mapService.expertMode === Expertise.Beginner || this.$mapService.expertMode === Expertise.Intermediate)) {
                    popoverString = 'popover="' + tab.popover + '" popover-placement="left" popover-trigger="mouseenter" popover-append-to-body="true"';
                }
                $('#rightpanelTabs').append(
                    this.$compile('<li id="' +
                        tab.container + '-tab" class="rightPanelTab rightPanelTabAnimated" ' +
                        popoverString + '><a id="' + tab.container + '-tab-a" data-target="#' +
                        content + '" data-toggle="tab"><span class="fa fa-' +
                        tab.icon + ' fa-lg"></span></a></li>')(this.$rootScope));
                $('#rightpanelTabPanes').append('<div class="tab-pane" style="width:355px" id="' + content + '"></div>');
                $('#' + tab.container + '-tab-a').click(() => {
                    this.$layerService.visual.rightPanelVisible = true;
                    console.log('rp visible');
                    if (this.$rootScope.$root.$$phase !== '$apply' && this.$rootScope.$root.$$phase !== '$digest') { this.$rootScope.$apply(); }
                });
                var newScope = this.$rootScope;
                (<any>newScope).data = tab.data;
                var widgetElement = this.$compile('<' + tab.directive + '></' + tab.directive + '>')(newScope);
                $('#' + content).append(widgetElement);
                if (tab.canClose) {
                    $('#' + content).append('<div id="closebutton-' + tab.container + '" class="fa fa-times rightpanel-closebutton" />');
                    $('#closebutton-' + tab.container).click(() => {
                        this.deactivateTabContainer(tab.container);
                    });
                }

                if (_.isUndefined(tab.open) || tab.open === true) {
                    (<any>$('#rightpanelTabs a[data-target="#' + content + '"]')).tab('show');
                    this.$layerService.visual.rightPanelVisible = true;
                }
                this.rightPanelTabs[tab.container] = tab;
            }
        }

        public deactivateTabContainer(container: string) {
            this.$layerService.visual.rightPanelVisible = false;
            delete this.rightPanelTabs[container];
            var content = container + '-content';
            $('#' + container + '-tab').remove();
            try {
                var c = $('#' + content);
                if (c) {
                    //var s = (<any>c).scope();
                    c.remove();
                    // if (s) {
                    //     this.$timeout(() => { s.$parent.$destroy(); }, 0);
                    // }
                }
            } catch (e) { return; }
            if (this.$rootScope.$root.$$phase !== '$apply' && this.$rootScope.$root.$$phase !== '$digest') { this.$rootScope.$apply(); }
        }

        public deactivateTab(tab: RightPanelTab) {
            if (!tab.hasOwnProperty('container')) return;
            this.deactivateTabContainer(tab.container);
        }

        public editWidget(widget: csComp.Services.IWidget) {
            this.activeWidget = widget;
            this.editWidgetMode = true;

            var rpt = csComp.Helpers.createRightPanelTab('widget', 'widgetedit', widget, 'Edit widget', 'Edit widget', 'th-large');
            this.$messageBusService.publish('rightpanel', 'activate', rpt);

            // call widgetctrl edit function
            if (widget._ctrl) widget._ctrl.startEdit();

            // check if editor exists
            if (this.$injector.has(widget.directive + 'EditDirective')) {
                var rptc = csComp.Helpers.createRightPanelTab('widget-content', widget.directive + '-edit', widget, 'Edit widget', 'Edit widget', 'cog');
                this.$messageBusService.publish('rightpanel', 'activate', rptc);
            }
            //(<any>$('#leftPanelTab a[data-target="#widgetedit"]')).tab('show'); // Select tab by name
        }

        public stopEditWidget() {
            this.activeWidget = null;
            this.editWidgetMode = false;
            //this.$layerService.visual.rightPanelVisible = false;
            $('#widgetEdit').removeClass('active');
        }

        public removeWidget() {
            if (this.activeWidget && this.mainDashboard) {
                this.mainDashboard.widgets = this.mainDashboard.widgets.filter((w: csComp.Services.IWidget) => w.id !== this.activeWidget.id);
                this.activeWidget = null;
                (<any>$('#leftPanelTab a[data-target="#basewidgets"]')).tab('show'); // Select tab by name
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

    myModule.service('dashboardService', csComp.Services.DashboardService);
}
