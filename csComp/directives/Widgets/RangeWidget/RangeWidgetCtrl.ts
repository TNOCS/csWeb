module RangeWidget {
    export class RangeWidgetData {
        title: string;
        groupId: string;
        propId: string;
    }

    export interface IRangeWidgetScope extends ng.IScope {
        vm: RangeWidgetCtrl;
        data: RangeWidgetData;
        style: csComp.Services.GroupStyle;
        filter: csComp.Services.GroupFilter;
        minimized: boolean;
        selectedFeature: csComp.Services.IFeature;
    }

    export class RangeWidgetCtrl {
        private scope: IRangeWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private mBusHandles: csComp.Services.MessageBusHandle[] = [];
        private filterDim: any;
        private filterGroup: any;
        private filterValue: number = 0;
        private group: csComp.Services.ProjectGroup;

        public static $inject = [
            '$scope',
            '$timeout',
            '$translate',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IRangeWidgetScope,
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

            $scope.data = <RangeWidgetData>this.widget.data;
            $scope.minimized = false;

            this.parentWidget.hide();

            this.mBusHandles.push(this.$messageBus.subscribe('filters', (title, groupId: string) => {
                if (!groupId || groupId !== $scope.data.groupId) return;
                this.group = this.$layerService.findGroupById(groupId);
                
                switch (title) {
                    case 'updated':
                        this.parentWidget.show();                
                        this.createFilter(groupId);
                        break;
                }
            }));

            this.mBusHandles.push(this.$messageBus.subscribe('updatelegend', (title, gs: csComp.Services.GroupStyle) => {
                switch (title) {
                    case 'hidelegend':
                        this.close();
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

        private createFilter(groupId: string) {
            if (!this.group) return;
            var p = this.$layerService.findPropertyTypeById(this.$scope.data.propId);
            var propLabel = this.$scope.data.propId.split('#').pop();
            if (this.group.ndx) {
                this.filterDim = this.group.ndx.dimension(d => {
                    if (!d.properties.hasOwnProperty(propLabel)) return null;
                    let prop = d.properties[propLabel];
                    if (prop === null || prop === undefined || isNaN(prop)) return null;
                    return prop;
                });
                // this.filterGroup = this.filterDim.group();
                this.applyFilter();
            }
        }
        
        private applyFilter() {
            if (this.filterValue === null || this.filterValue === undefined || isNaN(this.filterValue))return;
            if (!this.filterDim) return;
            if (this.filterValue > 0) {
                this.filterDim.filter([this.filterValue, Infinity]);
            } else {
                this.filterDim.filterAll();
            }
            this.group.filterResult = this.filterDim.top(Infinity);
            this.$messageBus.publish('filters', 'updateGroup', this.group.id);
            // this.$layerService.updateMapFilter(this.group);
        }
    }
}
