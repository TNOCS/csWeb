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
            private $compile: any,
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
                    if (this.project.activeDashboard)
                    {
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
        
        public closeDashboard()
        {
            this.project.activeDashboard.widgets.forEach(w=>{
                if (w.stop) w.stop();                
            })
        }

        public toggleWidget(widget: csComp.Services.IWidget) {
            if (widget.canCollapse) {
                widget.collapse = !widget.collapse;
            }
        }

        public updateWidget(w: csComp.Services.IWidget) {
            //console.log('updating widget ' + w.directive);
            if (w._initialized && this.$scope.dashboard._initialized) return;
            
            w._initialized = true;
            var widgetElement;
            var newScope = this.$scope;
            (<any>newScope).widget = w;

            if (w.template) {
                widgetElement = this.$compile(this.$templateCache.get(w.template))(newScope);
            } else if (w.url) {
                widgetElement = this.$compile('<div>url</div>')(this.$scope);
            } else if (w.directive) {
                //var newScope : ng.IScope;
                widgetElement = this.$compile('<' + w.directive + '></' + w.directive + '>')(newScope);
            } else {
                widgetElement = this.$compile('<h1>hoi</h1>')(this.$scope);
            }

            var resized = function() {
                //alert('resize');
                /* do something */
            };
            if (widgetElement) {
                widgetElement.resize(resized);

                //alert(w.elementId);
                var el = $('#' + w.elementId);
                el.empty();
                el.append(widgetElement);
            }
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
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
                //this.$messageBusService.publish("map", "setbaselayer", this.$scope.dashboard.baselayer);
                var layer: csComp.Services.BaseLayer = this.$layerService.$mapService.getBaselayer(this.$scope.dashboard.baselayer);
                this.$layerService.activeMapRenderer.changeBaseLayer(layer);
                this.$layerService.$mapService.changeBaseLayer(this.$scope.dashboard.baselayer);
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

            if (this.$scope.dashboard.showTimeline !== this.$mapService.timelineVisible) {
                if (this.$scope.dashboard.showTimeline && this.$mapService.isIntermediate) {
                    this.$mapService.timelineVisible = true;
                } else {
                    this.$mapService.timelineVisible = false;
                }
                if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                    this.$scope.$root.$apply();
                }
            }
            var d = this.$scope.dashboard;     // RS mod January 2016
            if (d.showTimeline && d.timeline) {
                //console.log("checkTimeline: dashboard has timeline");
                this.$messageBusService.publish('timeline', 'updateTimerange', d.timeline);
                // now move the focustimeContainer to the right position
                if (d.timeline.focus && d.timeline.start && d.timeline.end &&
                    (d.timeline.focus > d.timeline.start) && (d.timeline.focus < d.timeline.end)) {
                    var f = (d.timeline.focus - d.timeline.start) / (d.timeline.end - d.timeline.start);
                    //var w = $("#timeline").width();           // unfortunately, on the first call, 
                    //the timeline has a width of 100 (not resized yet)
                    //var w = $("#timeline").parent().width();  // does not help: = 0 on first call
                    var w = $("#map").width();                  // this works but might be dangerous
                    var newpos = f * w - $("#focustimeContainer").width() / 2;
                    $("#focustimeContainer").css('left', newpos);
                }
            }                                  // end RS mod
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
                
                // select the target node
                // var target = document.querySelector('#' + widget.elementId + '-parent');
                //
                // // create an observer instance
                // var observer = new MutationObserver((mutations) => {
                //     mutations.forEach((mutation) => {
                //         console.log(mutation.type);
                //     });
                // });
                //
                // // configuration of the observer:
                // var config = { attributes: true, childList: true, characterData: true };
                //
                // // pass in the target node, as well as the observer options
                // observer.observe(target, config);

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
                if (w.id === 'Legend') legendWidgetPresent = true;
            });
            if (!legendWidgetPresent) {
                //console.log('Create legend');
                var w = <csComp.Services.IWidget>{};
                w.directive = 'legend-directive';
                w.id = csComp.Helpers.getGuid();
                w.elementId = 'widget-' + w.id;
                w.parentDashboard = d;
                w.title = 'Legend';
                w.data = { mode: 'lastSelectedStyle' };
                w.left = '10px';
                w.customStyle = <csComp.Services.WidgetStyle>{ background : "White", borderColor : "Black", borderWidth : "1px"};                
                w.top = '20px';
                w.width = '150px';
                w.enabled = true;
                d.widgets.push(w);
                //this.$dashboardService.
                //this.$dashboardService.addNewWidget(w, d);
                //this.$dashboardService.selectDashboard(this.$layerService.project.activeDashboard, 'main');
            }
        };

        // if (!d.widgets) d.widgets = [];
        // if (d.showLegend) {
        //     var legendWidgetPresent = false;
        //     d.widgets.forEach(w => {
        //         if(w.id === 'legend') legendWidgetPresent = true;
        //     });
        //     if (!legendWidgetPresent) {
        //         console.log('Create legend');
        //         var w = <csComp.Services.IWidget>{};
        //         w.directive = 'legend-directive';
        //         w.id = 'legend';
        //         w.title = 'Legenda';
        //         w.data = {mode: 'lastSelectedStyle'};
        //         w.left = '10px';
        //         w.top = '20px';
        //         w.width = '150px';
        //         w.enabled = true;
        //         this.$dashboardService.addNewWidget(w, d);
        //         //this.$dashboardService.selectDashboard(this.$layerService.project.activeDashboard, 'main');
        //     }

        public updateDashboard() {
            var d = this.$scope.dashboard;
            if (!d) return;

            this.checkLegend(d);
            this.checkMap();
            this.checkTimeline();
            this.checkLayers();
            this.checkViewbound();

            //this.$messageBusService.publish("leftmenu",(d.showLeftmenu) ? "show" : "hide");
            // if (!this.$mapService.isAdminExpert) {
            if (!d._initialized) {
                this.$layerService.visual.leftPanelVisible = d.showLeftmenu;
                this.$layerService.visual.rightPanelVisible = d.showRightmenu;
            }
            this.$timeout(() => {
                d.widgets.forEach((w: csComp.Services.IWidget) => {
                    w._initialized = false;
                    this.updateWidget(w);
                });
                
                this.$timeout(()=>{
                    this.$scope.$watchCollection('dashboard.widgets', (da) => {
                        this.$scope.dashboard.widgets.forEach((w: csComp.Services.IWidget) => {
                            this.updateWidget(w);
                        });
                    });
                },300);
                d._initialized = true;

            }, 500);

            //this.$layerService.rightMenuVisible = d.showLeftmenu;
            //this.$mapService.rightMenuVisible = d.showRightmenu;
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
        }
    }
}
