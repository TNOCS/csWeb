module FilterStyleWidget {
    export class FilterStyleWidgetData {
        title: string;
    }

    export interface IFilterStyleWidgetScope extends ng.IScope {
        vm: FilterStyleWidgetCtrl;
        data: FilterStyleWidgetData;
        style: csComp.Services.GroupStyle;
        filter: csComp.Services.GroupFilter;
        minimized: boolean;
        selectedFeature: csComp.Services.IFeature;
    }

    export class FilterStyleWidgetCtrl {
        private scope: IFilterStyleWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private mBusHandles: csComp.Services.MessageBusHandle[] = [];
        private exporterAvailable: boolean;

        public static $inject = [
            '$scope',
            '$timeout',
            '$translate',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IFilterStyleWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $translate: ng.translate.ITranslateService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;
            this.parentWidget = $("#" + this.widget.elementId).parent();

            $scope.data = <FilterStyleWidgetData>this.widget.data;
            $scope.minimized = false;

            if ((<any>window).canvg) {
                this.exporterAvailable = true;
            } else {
                this.exporterAvailable = false;
            }

            // this.mBusHandles.push(this.$messageBus.subscribe('feature', (action: string, feature: csComp.Services.IFeature) => {
            //     switch (action) {
            //         case 'onFeatureDeselect':
            //         case 'onFeatureSelect':
            //             this.selectFeature(feature);
            //             break;
            //         default:
            //             break;
            //     }
            // }));

            this.parentWidget.hide();

            this.mBusHandles.push(this.$messageBus.subscribe('layer', (title, l: csComp.Services.ProjectLayer) => {
                if (title === 'activated') {
                    if ($scope.filter) {
                        this.updateChart();
                    }
                }
            }));

            this.mBusHandles.push(this.$messageBus.subscribe('updatelegend', (title, gs: csComp.Services.GroupStyle) => {
                switch (title) {
                    case 'hidelegend':
                        this.close();
                        break;
                    default:
                        if (gs) {
                            delete $scope.filter;
                            $scope.style = gs;
                            this.createChart();
                        }
                        break;
                }
            }));
        }

        private minimize() {
            this.$scope.minimized = !this.$scope.minimized;
            if (this.$scope.minimized) {
                this.parentWidget.css("height", "30px");
            } else {
                this.parentWidget.css("height", this.widget.height);
            }
        }

        private canClose() {
            return (this.$scope.data.hasOwnProperty('canClose'))
                ? this.$scope.data['canClose']
                : true;
        }

        private close() {
            this.parentWidget.hide();
        }

        public stop() {
            if (this.mBusHandles && this.mBusHandles.length > 0) {
                this.mBusHandles.forEach((mbh) => {
                    this.$messageBus.unsubscribe(mbh);
                });
            }
        }

        private selectFeature(feature: csComp.Services.IFeature) {
            if (!feature || !feature.isSelected) {
                return;
            } else {
                this.parentWidget.show();
            }
        }

        private createChart() {
            var gf = new csComp.Services.GroupFilter();
            gf.property = this.$scope.style.property;
            gf.id = this.widget.id;
            gf.group = this.$scope.style.group;
            gf.group.ndx = crossfilter([]);
            gf.group.ndx.add(_.map(gf.group.markers, (item: any, key) => { return item.feature; }));
            gf.title = this.$scope.style.title;
            gf.filterLabel = null;
            gf.filterType = 'row';
            gf.group.filters = [];
            gf.group.filters.push(gf);
            this.$timeout(() => {
                this.$scope.filter = gf;
                this.$scope.filter.showInWidget = true;
            });
            this.$timeout(() => {
                this.updateRowFilterScope(gf);
            });
            this.parentWidget.show();
            // var propType = this.$layerService.findPropertyTypeById(this.$scope.layer.typeUrl + '#' + gf.property);
            // this.$layerService.setGroupStyle(this.$scope.style.group, propType);
        }

        private updateChart() {
            this.$scope.filter.group.ndx = crossfilter([]);
            this.$scope.filter.group.ndx.add(_.map(this.$scope.filter.group.markers, (item: any, key) => { return item.feature; }));
            this.$timeout(() => {
                this.updateRowFilterScope(this.$scope.filter);
            });
        }

        private updateRowFilterScope(gf: csComp.Services.GroupFilter) {
            var rowFilterElm = angular.element($("#filter_" + this.widget.id));
            if (!rowFilterElm) {
                console.log('rowFilterElm not found.');
                return;
            }
            var rowFilterScope = <Filters.IRowFilterScope>rowFilterElm.scope();
            if (!rowFilterScope) {
                console.log('rowFilterScope not found.');
                return;
            } else {
                rowFilterScope.filter = gf;
                rowFilterScope.vm.initRowFilter();
                return;
            }
        }

        public exportToImage() {
            var canvg = (<any>window).canvg || undefined;
            if (!canvg) return;
            var svg = new XMLSerializer().serializeToString(document.getElementById("filter_" + this.widget.id).firstChild);
            var canvas = document.createElement('canvas');
            document.body.appendChild(canvas);
            canvg(canvas, svg, {
                renderCallback: () => {
                    var img = canvas.toDataURL("image/png");
                    var fileName = this.$scope.filter.title || 'rowfilter-export';
                    csComp.Helpers.saveImage(img, fileName + '.png', 'png');
                    canvas.parentElement.removeChild(canvas);
                }
            });
        }
    }
}
