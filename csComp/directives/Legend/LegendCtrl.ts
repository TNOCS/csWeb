module Legend {
    // created 12 May 2015, RPS, TNO
    // TODO1: decide how to determine which legend (from which layer) shows up immediately after loading
    // currently the last added layer shows up which is the netatmo layer in csMapUS.
    // And after a reload (refresh), the one for the current indicator's layer shows up
    // TODO2: disappear when empty -> reopen legend for the most recently activated layer that is still active
    // TODO3: positioning: from bottom up (using "bottom" in the project.json file didn't work)
    // TODO4: provide possibility to not show a legend at all. Either by a hide button (but how to show then)
    // or via a project/user setting

    export class LegendData {
        propertyTypeKey: string;
        mode: string;
    }

    export interface ILegendDirectiveScope extends ng.IScope {
        vm: LegendCtrl;
        data: LegendData;
        legend: csComp.Services.Legend;
        activeStyleProperty: csComp.Services.IPropertyType;
        activeStyleGroup: csComp.Services.ProjectGroup;
    }

    export class LegendCtrl {
        private scope: ILegendDirectiveScope;
        private widget: csComp.Services.IWidget;
        private passcount: number = 1;
        private subscribeHandle: csComp.Services.MessageBusHandle;
        private parentWidget: any;

        // $inject annotation
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ILegendDirectiveScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = (par.widget);
            this.parentWidget = $('#' + this.widget.elementId).parent();
            //console.log(JSON.stringify(this.widget.data));
            //$scope.title = this.widget.title;
            //$scope.timestamp = '19:45';
            if (this.widget && this.widget.data) $scope.data = <LegendData>this.widget.data;
            //$scope.s1 = $scope.data.propertyTypeKey;
            if (this.widget && this.widget.data && this.widget.data.hasOwnProperty('propertyTypeKey')) var ptd = this.$layerService.propertyTypeData[$scope.data.propertyTypeKey];
            $scope.activeStyleProperty = ptd;
            //if (ptd) $scope.s2 = ptd.title;
            //$scope.s3 = 'passcount=' + this.passcount.toString();
            // if ($scope.data.mode = 'lastSelectedStyle') {
            //     $scope.legend = this.createLegend($scope.data.propertyTypeKey);
            // }
            if ($scope.data && $scope.data.mode === 'lastSelectedLayer') {
                this.$messageBus.subscribe("layer", (a, l: csComp.Services.ProjectLayer) => {
                    if (a === "activated") {
                    $scope.legend = null;
                        if (l && l.defaultLegend) {
                            $scope.legend = this.$layerService.getLayerLegend(l);
                            console.log('activate new layer ' + l.title);
                        }
                    }
                });
            }
            else if ($scope.data && $scope.data.mode === 'lastSelectedStyle') {
                $scope.legend = this.createLegend();
                if ($scope.$parent.hasOwnProperty('widget')) {
                    if (!$scope.legend.hasOwnProperty('legendEntries')) {
                        (<any>$scope.$parent).widget['enabled'] = false;
                    } else {
                        (<any>$scope.$parent).widget['enabled'] = true;
                    }
                }

                if (!this.subscribeHandle) {
                    this.subscribeHandle = this.$messageBus.subscribe("updatelegend", (title: string, data: any) => {
                        switch (title) {
                            case 'removelegend':
                                this.$messageBus.unsubscribe(this.subscribeHandle);
                                break;
                            case 'hidelegend':
                                this.parentWidget.hide();
                                break;
                            default:
                                this.parentWidget.show();
                                if (ptd && ptd.legend) {
                                    $scope.legend = ptd.legend;
                                    $scope.activeStyleProperty = ptd;
                                } else if (data && data.activeLegend) {
                                    $scope.legend = data.activeLegend;
                                    $scope.activeStyleProperty = this.$layerService.propertyTypeData[data.property];
                                }
                                if ($scope.data.mode = 'lastSelectedStyle') {
                                    $scope.legend = this.createLegend(data);
                                    if ($scope.$parent.hasOwnProperty('widget')) {
                                        if (!$scope.legend.hasOwnProperty('legendEntries')) {
                                            (<any>$scope.$parent).widget['enabled'] = false;
                                        } else {
                                            (<any>$scope.$parent).widget['enabled'] = true;
                                        }
                                    }
                                }
                                if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
                        }
                    });
                }
            }
            else {
                $scope.legend = <csComp.Services.Legend>this.widget.data;
                if ($scope.$parent.hasOwnProperty('widget')) {
                    if (!$scope.legend.hasOwnProperty('legendEntries')) {
                        (<any>$scope.$parent).widget['enabled'] = false;
                    } else {
                        (<any>$scope.$parent).widget['enabled'] = true;
                    }
                }
            }
        }

        createLegend(activeStyle: csComp.Services.GroupStyle = null): csComp.Services.Legend {
            var leg = new csComp.Services.Legend();
            if (!activeStyle) {
                this.$layerService.project.groups.forEach((g) => {
                    g.styles.forEach((gs) => {
                        if (gs.enabled) {
                            activeStyle = gs;
                            this.$scope.activeStyleGroup = g;
                        }
                    });
                });
            } else {
                this.$scope.activeStyleGroup = activeStyle.group;
            }
            if (!activeStyle) return leg;

            var ptd: csComp.Services.IPropertyType = this.$layerService.propertyTypeData[activeStyle.property];
            this.$scope.activeStyleProperty = ptd;
            if (!ptd) return leg;
            if (ptd.legend) return ptd.legend;
            leg.id = ptd.label + 'legendcolors';
            leg.legendKind = 'interpolated';
            leg.description = ptd.title;
            leg.legendEntries = [];
            if (activeStyle.activeLegend && activeStyle.activeLegend.legendEntries) {
                activeStyle.activeLegend.legendEntries.forEach(le => {
                    leg.legendEntries.push(le);
                });
            } else {
                leg.legendEntries.push(this.createLegendEntry(activeStyle, ptd, activeStyle.info.min));
                leg.legendEntries.push(this.createLegendEntry(activeStyle, ptd, (activeStyle.info.min + activeStyle.info.max) / 4));
                leg.legendEntries.push(this.createLegendEntry(activeStyle, ptd, 2 * (activeStyle.info.min + activeStyle.info.max) / 4));
                leg.legendEntries.push(this.createLegendEntry(activeStyle, ptd, 3 * (activeStyle.info.min + activeStyle.info.max) / 4));
                leg.legendEntries.push(this.createLegendEntry(activeStyle, ptd, activeStyle.info.max));
                leg.legendEntries = leg.legendEntries.sort((a, b) => { return (a.value - b.value) });
            }
            return leg;
        }

        createLegendEntry(activeStyle: csComp.Services.GroupStyle, ptd: csComp.Services.IPropertyType, value: number) {
            var le = new csComp.Services.LegendEntry();
            le.label = csComp.Helpers.convertPropertyInfo(ptd, value);
            if (le.label === value.toString()) {
                //if no stringformatting was applied, define one based on maximum values
                if (activeStyle.info.max > 100) {
                    le.label = (<any>String).format("{0:#,#}", value);
                } else {
                    le.label = (<any>String).format("{0:#,#.#}", value);
                }
            }
            le.value = value;
            le.color = csComp.Helpers.getColor(value, activeStyle);
            return le;
        }

        getStyle(legend: csComp.Services.Legend, le: csComp.Services.LegendEntry, key: number) {
            var style = {
                'float': 'left',
                'position': 'relative',
                'top': '10px',
                'background': `linear-gradient(to bottom, ${le.color}, ${legend.legendEntries[legend.legendEntries.length - key - 2].color})`,
                'border-left': '1px solid black',
                'border-right': '1px solid black'
            }
            if (key === 0) {
                style['border-top'] = '1px solid black';
            } else if (key === legend.legendEntries.length - 2) {
                style['border-bottom'] = '1px solid black';
            }
            return style;
        }
        
        public toggleFilter(legend: csComp.Services.Legend, le: csComp.Services.LegendEntry) {
            if (!legend || !le) return;
            var projGroup = this.$scope.activeStyleGroup;
            var property = this.$scope.activeStyleProperty;
            if (!projGroup || !property) return;
            //Check if filter already exists. If so, remove it.
            var exists: boolean = projGroup.filters.some((f: csComp.Services.GroupFilter) => {
                if (f.property === property.label) {
                    this.$layerService.removeFilter(f);
                    return true;
                }
            });
            if (!exists) {
                var gf = new csComp.Services.GroupFilter();
                gf.property = property.label;//prop.split('#').pop();
                gf.id = 'buttonwidget_filter';
                gf.group = projGroup;
                gf.filterType = 'row';
                gf.title = property.title;
                gf.rangex = [le.interval.min, le.interval.max];
                gf.filterLabel = le.label;
                console.log('Setting filter');
                this.$layerService.rebuildFilters(projGroup);
                projGroup.filters = projGroup.filters.filter((f) => { return f.id !== gf.id; });
                this.$layerService.setFilter(gf, projGroup);
                this.$layerService.visual.leftPanelVisible = true;
                $('#filter-tab').click();
            }
        }
    }
}
