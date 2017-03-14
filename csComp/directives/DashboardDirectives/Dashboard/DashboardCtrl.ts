module Dashboard {

    import Dashboard = csComp.Services.Dashboard;

    declare var interact;

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
            private $compile: ng.ICompileService,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService,
            private $templateCache: any,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            $messageBusService.subscribe('project', (e, f) => {
                if (e === 'loaded') {
                    $scope.dashboard = null;
                }
            });

            $scope.initDashboard = () => {
                //if (!$scope.container) $scope.container = 'main';
                //$messageBusService.subscribe('dashboard-' + $scope.container, (s: string, d: csComp.Services.Dashboard) => {
                // In LayerService, you expect the name to be dashboard-main too.
                $messageBusService.subscribe('dashboard-main', (s: string, d: csComp.Services.Dashboard) => {
                    this.project = $layerService.project;
                    if (this.project.activeDashboard) {
                        this.closeDashboard();
                    }
                    this.project.activeDashboard = d;
                    //alert(this.project.activeDashboard.id);
                    switch (s) {
                        case 'activated':
                            $scope.dashboard = d;
                            this.updateDashboard();
                            break;
                    }
                });

                this.$messageBusService.subscribe('expertMode', (title: string, expertMode: csComp.Services.Expertise) => {
                    if (title !== 'newExpertise') return;
                    //Check whether timeline should be visible. Only when at least Intermediate expertise AND dashboard.showTimeline !== false
                    setTimeout(() => {
                        if (this.project && this.project.activeDashboard) {
                            var ad = this.project.activeDashboard;
                            if (this.$mapService.isIntermediate && (!ad.hasOwnProperty('showTimeline') || ad.showTimeline === true)) {
                                this.$messageBusService.publish('timeline', 'isEnabled', true);
                            } else {
                                this.$messageBusService.publish('timeline', 'isEnabled', false);
                            }
                        }
                    }, 50);
                });

                //this.project.activeDashboard.widgets
                //this.updateDashboard();
                //alert($scope.dashboard.name);
            };
        }

        public closeDashboard() {
            this.project.activeDashboard.widgets.forEach(w => {
                if (w.stop) {
                    w.stop();
                } else if (w.elementId) {
                    // The stop() function of a widget sits in the controller. We can reach the controller through the
                    // scope of the widget element.
                    try {
                        var wElm = document.getElementById(`${w.elementId}-parent`);
                        var wScope = <any>angular.element(wElm).children().children().scope(); // The widget is a grandchild of the widget-parent
                        if (wScope && wScope.vm && wScope.vm.stop) {
                            wScope.vm.stop();
                        }
                    } catch (e) { }
                }
            });
        }

        public updateWidgetPosition(widget: csComp.Services.IWidget) {
            if (widget._isFullscreen) {
                var el = $('#dashboard-main');
                widget._top = '10px';
                widget._bottom = '10px';
                widget._width = el.width() - 20 + 'px';
                widget._height = el.height() - 20 + 'px';
                widget._left = '10px';
                widget._right = '10px';
                widget._zindex = '100';
            } else {
                widget._width = widget.width;
                widget._height = widget.height;
                widget._top = widget.top;
                widget._bottom = widget.bottom;
                widget._left = widget.left;
                widget._right = widget.right;
                widget._zindex = widget.zIndex || '1';
                widget._gridContainer = widget.inGridContainer; // Responsive container https://getbootstrap.com/examples/grid/
            }
        }

        public toggleWidget(widget: csComp.Services.IWidget) {
            if (widget.canCollapse) {
                widget.collapse = !widget.collapse;
            }
        }

        public getOptions(widget: csComp.Services.IWidget) {
            var options = [];
            if (widget._ctrl && widget._ctrl.getOptions) {
                widget._ctrl.getOptions().forEach(o => options.push(o));
            }
            if (this.$mapService.isAdminExpert) {
                options.push({ title: 'Widget Settings', action: (w) => this.$dashboardService.editWidget(w) });
                if (widget.position === 'dashboard') {
                    if (widget._interaction) {
                        options.push({ title: 'Disable drag', action: (w) => this.toggleInteract(w) });
                    } else {
                        options.push({ title: 'Enable drag', action: (w) => this.toggleInteract(w) });
                    }
                }
            }
            if (widget.allowFullscreen) {
                if (widget._isFullscreen) {
                    options.push({
                        title: 'Minimize', action: (w: csComp.Services.IWidget) => {
                            this.$layerService.project.activeDashboard._fullScreenWidget = null;
                            w._isFullscreen = false;
                            w._initialized = false;
                            this.updateWidget(w);
                            // if (_.isFunction(w._ctrl.goFullscreen)) w._ctrl.goFullscreen();
                        }
                    });
                } else {
                    options.push({
                        title: 'Fullscreen', action: (w: csComp.Services.IWidget) => {
                            this.$layerService.project.activeDashboard._fullScreenWidget = w;
                            w._isFullscreen = true;
                            w._initialized = false;
                            this.updateWidget(w);
                            // if (_.isFunction(w._ctrl.goFullscreen)) w._ctrl.goFullscreen();
                        }
                    });
                }
            }
            widget._options = options;
        }

        public triggerOption(o: any, w: csComp.Services.IWidget) {
            if (_.isFunction(o.action)) o.action(w);
        }

        public updateWidget(w: csComp.Services.IWidget) {
            //console.log('updating widget ' + w.directive);
            if (w._initialized && this.$scope.dashboard._initialized) return;

            this.$timeout(() => {
                w._initialized = true;
                var widgetElement;
                var newScope = this.$scope.$new(true);
                (<any>newScope).widget = w;

                if (w.position === 'rightpanel') {
                    var rpt = csComp.Helpers.createRightPanelTab(w.id, w.directive, w.data, w.title, '{{"FEATURE_INFO" | translate}}', w.icon, true, false);
                    rpt.open = false;
                    this.$messageBusService.publish('rightpanel', 'activate', rpt);
                } else {
                    if (w.template) {
                        widgetElement = this.$compile(this.$templateCache.get(w.template))(newScope);
                    } else if (w.url) {
                        widgetElement = this.$compile('<div>url</div>')(this.$scope);
                    } else if (w.directive) {
                        //var newScope : ng.IScope;
                        widgetElement = this.$compile('<' + w.directive + '></' + w.directive + '>')(newScope);
                    } else {
                        widgetElement = this.$compile('<div></div>')(this.$scope);
                    }
                }

                this.getOptions(w);

                if (widgetElement) {
                    //alert(w.elementId);
                    this.updateWidgetPosition(w);
                    var el = $('#' + w.elementId + '-parent');
                    //if (w._isFullscreen) el = $('#dashboard-widget-fullscreen');
                    el.empty();
                    el.append(widgetElement);
                }
            }, 0);
                // if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
        }

        public toggleInteract(widget: csComp.Services.IWidget) {
            widget._interaction = !widget._interaction;
            if (widget._interaction) {
                interact('#' + widget.elementId + '-parent').draggable(true);
            } else {
                interact('#' + widget.elementId + '-parent').draggable(false);
            }
        }

        public checkMap() {
            if (this.$scope.dashboard.showMap !== this.$layerService.visual.mapVisible) {
                if (this.$scope.dashboard.showMap) {
                    this.$layerService.visual.mapVisible = true;
                } else {
                    this.$layerService.visual.mapVisible = false;
                }
                if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
            }

            if (this.$layerService.visual.mapVisible && this.$scope.dashboard.mapWidth) {
                this.$layerService.visual.mapWidth = this.$scope.dashboard.mapWidth;
                if (this.$scope.dashboard.alignMapRight) {
                    this.$layerService.visual.alignMapRight = true;
                } else {
                    this.$layerService.visual.alignMapRight = false;
                }
            }

            if (this.$scope.dashboard.viewBounds) {
                console.log('set bound');
                this.$layerService.activeMapRenderer.fitBounds(this.$scope.dashboard.viewBounds);
            }

            if (this.$scope.dashboard.showMap && this.$scope.dashboard.baselayer) {
                //this.$messageBusService.publish('map', 'setbaselayer', this.$scope.dashboard.baselayer);
                var layer: csComp.Services.BaseLayer = this.$layerService.$mapService.getBaselayer(this.$scope.dashboard.baselayer);
                this.$layerService.activeMapRenderer.changeBaseLayer(layer);
                this.$layerService.$mapService.changeBaseLayer(this.$scope.dashboard.baselayer);
            }
        }

        public checkDescription() {
            var db = this.$layerService.project.activeDashboard;
            if (db.description) {
                var rpt = csComp.Helpers.createRightPanelTab('headerinfo', 'infowidget', { title: db.name, mdText: db.description }, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'question', true, false);
                this.$messageBusService.publish('rightpanel', 'activate', rpt);
                //this.$layerService.visual.rightPanelVisible = true; // otherwise, the rightpanel briefly flashes open before closing.
            }
        }

        public checkLayers() {
            var db = this.$layerService.project.activeDashboard;
            if (db.visiblelayers && db.visiblelayers.length > 0 && this.$layerService.project.groups) {
                this.$layerService.project.groups.forEach((g: csComp.Services.ProjectGroup) => {
                    g.layers.forEach((l: csComp.Services.ProjectLayer) => {
                        if (l.enabled && db.visiblelayers.indexOf(l.reference) === -1) {
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
            if (this.project.activeDashboard && this.project.activeDashboard.viewBounds) {
                this.$layerService.activeMapRenderer.fitBounds(this.project.activeDashboard.viewBounds);
            }
        }

        public checkTimeline() {
            var d = this.$scope.dashboard;
            if (d.showTimeline !== this.$mapService.timelineVisible) {
                this.$mapService.timelineVisible = (d.showTimeline && this.$mapService.isIntermediate);
                if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                    this.$scope.$root.$apply();
                }
            }
            if (d.showTimeline && (d.timeline || this.project.timeLine)) {
                //console.log('checkTimeline: dashboard has timeline');
                var t = (d.timeline) ? d.timeline : this.project.timeLine;
                if (!_.isUndefined(t.fixedRange)) {
                    switch (t.fixedRange) {
                        case 'today':
                            var today = new Date();
                            today.setHours(0);
                            today.setMinutes(0);
                            today.setMilliseconds(0);
                            t.start = today.getTime();
                            t.end = t.start + (1000 * 60 * 60 * 12) - 1;


                            break;
                        case '24h':
                            t.end = Date.now();
                            t.start = Date.now() - 1000 * 60 * 24;
                            break;
                    }
                }

                this.$messageBusService.publish('timeline', 'updateTimerange', t);

                // now move the focustimeContainer to the right position
                if (t.focus && t.start && t.end &&
                    (t.focus > t.start) && (t.focus < t.end)) {
                    var f = (t.focus - t.start) / (t.end - t.start);
                    //var w = $('#timeline').width();           // unfortunately, on the first call,
                    //the timeline has a width of 100 (not resized yet)
                    //var w = $('#timeline').parent().width();  // does not help: = 0 on first call
                    var w = $('#map').width();                  // this works but might be dangerous
                    var newpos = f * w - $('#focustimeContainer').width() / 2;
                    $('#focustimeContainer').css('left', newpos);
                }

                if (t.isExpanded) {
                    t.enableEvents = true;
                }

            }  // end RS mod
        }

        private setValue(diff: number, value: string): string {
            if (!value || value.indexOf('%') >= 0) return value;
            var left = parseInt(value.replace('px', ''), 10);
            left += diff;
            return left + 'px';
        }

        public removeWidget(widget: csComp.Services.IWidget) {
            this.$scope.dashboard.widgets = this.$scope.dashboard.widgets.filter((w) => {
                return w !== widget;
            });
        }

        public isReady(widget: csComp.Services.IWidget) {
            //this.updateWidget(widget);
            setTimeout(() => {
                if (!widget._ijs)
                    widget._ijs = interact('#' + widget.elementId + '-parent')
                        .resizable({ inertia: true })
                        .on('down', (e) => {
                            if (widget._interaction) widget._isMoving = true;
                            // if (this.$dashboardService.activeWidget !== widget) {
                            //     //this.$dashboardService.editWidget(widget)
                            // }
                        })
                        .on('up', (e) => widget._isMoving = false)
                        .on('dragmove', (event) => {
                            if (widget.left || (!widget.left && widget.left !== '')) {
                                widget.left = this.setValue(event.dx, widget.left);
                                if (widget.width && widget.width !== '') {
                                    widget.right = '';
                                } else {
                                    widget.right = this.setValue(-event.dx, widget.right);
                                }
                            } else {
                                if (!widget.right || widget.right === '') {
                                    widget.right = 1000 + 'px';
                                }
                                widget.right = this.setValue(-event.dx, widget.right);
                            }
                            if (widget.top && widget.top !== '') {
                                widget.top = this.setValue(event.dy, widget.top);
                                if (widget.bottom) {
                                    if (widget.height) {
                                        widget.bottom = '';
                                    } else { widget.bottom = this.setValue(-event.dy, widget.bottom); }
                                }
                            } else {
                                widget.bottom = this.setValue(-event.dy, widget.bottom);
                            }

                            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
                        })
                        .on('resizemove', (event) => {
                            widget.height = this.setValue(event.dy, widget.height);
                            if (widget.left && widget.right) {
                                widget.right = this.setValue(-event.dx, widget.right);
                            } else {
                                if (!widget.width) widget.width = '300px';
                                widget.width = this.setValue(event.dx, widget.width);
                            }
                            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
                        });
            }, 10);
        }

        private checkLegend(d: Dashboard) {
            if (!d.showLegend) return;
            var legendWidgetPresent = false;
            d.widgets.forEach(w => {
                if (w.directive === 'legend-directive') legendWidgetPresent = true;
            });
            if (!legendWidgetPresent) {
                //console.log('Create legend');
                var w = <csComp.Services.IWidget>{};
                w.directive = 'legend-directive';
                w.id = csComp.Helpers.getGuid();
                w.elementId = 'widget-' + w.id;
                w.parentDashboard = d;
                w.title = 'Legend';
                w.position = 'dashboard';
                w.data = { mode: 'lastSelectedStyle' };
                w.left = '20px';
                w.customStyle = <csComp.Services.WidgetStyle>{ background: 'White', borderColor: 'Black', borderWidth: '1px' };
                w.top = '80px';
                w.hideIfLeftPanel = true;
                w.width = '';
                w.enabled = true;
                d.widgets.push(w);
            }
        };

        public updateDashboard() {
            var d = this.$scope.dashboard;
            if (!d) return;

            this.checkLegend(d);
            this.checkMap();
            this.checkTimeline();
            this.checkLayers();
            this.checkViewbound();
            this.checkDescription();

            //this.$messageBusService.publish('leftmenu',(d.showLeftmenu) ? 'show' : 'hide');
            // if (!this.$mapService.isAdminExpert) {
            if (!d._initialized) {
                this.$layerService.visual.leftPanelVisible = d.showLeftmenu;
                this.$layerService.visual.rightPanelVisible = d.showRightmenu;
                this.$layerService.visual.navbarVisible = d.showNavbar;
            }
            this.updateWidgetsThrottled(d.widgets, () => {
                d._initialized = true;
                //this.$layerService.rightMenuVisible = d.showLeftmenu;
                //this.$mapService.rightMenuVisible = d.showRightmenu;
                if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
            });
        }

        private updateWidgetsThrottled(widgets: any[], cb: Function, count: number = 0) {
            if (widgets && count < widgets.length) {
                this.$timeout(() => {
                    let w = widgets[count];
                    w._initialized = false;
                    this.updateWidget(w);
                    console.log(`Update ${w.id} (${count + 1})`);
                }, 500);
            }
            if (widgets && count < widgets.length - 1) {
                setTimeout(() => {this.updateWidgetsThrottled( widgets, cb, count + 1); }, 500);
            } else {
                cb();
            }
        }
    }
}
