<div style="margin-top: 2px;">
    <div class="row" style="margin: 5px;">
        <h4 class="col-md-12">
            {{data.title}}
        </h4>
    </div>
    <div>
        <!--<div class="col-md-12">
            {{mca.title}}
            <div class="fa fa-paint-brush makeNarrow" ng-click="vm.setMcaAsStyle(mca.id)"
            style="float:right; cursor:pointer" popover="{{'MCA.SET_STYLE' | translate}}"
            popover-placement="right" popover-trigger="mouseenter" popover-append-to-body="true" />
        </div>-->
        <label data-ng-repeat="mca in data.availableMcas" class="row" style="margin: 5px; cursor:pointer" popover="{{'MCA.SET_STYLE' | translate}}" popover-placement="right" popover-trigger="mouseenter" popover-append-to-body="true">
            <input type="radio" ng-model="vm.selectedMCA" value="{{mca.id}}" ng-click="vm.setMcaAsStyle(mca.id)">&nbsp;&nbsp;{{mca.title}}
        </label><br/>
        <label class="row" style="margin: 5px; cursor:pointer">
            <input type="radio" ng-model="vm.selectedMCA" value="none" ng-click="vm.setMcaAsStyle(mca.choice)">&nbsp;&nbsp;None
        </label>
        <br/>
    </div>
</div>
    export class MCAWidgetCtrl {
        private scope: IMCAWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private mcaScope: Mca.IMcaScope;

        public selectedMCA: string;

        public static $inject = [
            '$scope',
            '$timeout',
            '$controller',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IMCAWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $controller: ng.IControllerService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <MCAWidgetData>this.widget.data;
            $scope.data.filterByDefaultFeatureType = $scope.data.filterByDefaultFeatureType || false;

            if (typeof $scope.data.layerId !== 'undefined') {
                // Hide widget
                this.parentWidget = $("#" + this.widget.elementId).parent();
                this.parentWidget.hide();
                this.$messageBus.subscribe('layer', (action: string, layer: csComp.Services.ProjectLayer) => {
                    switch (action) {
                        case 'activated':
                        case 'deactivate':
                            this.activateLayer(layer);
                            break;
                        default:
                            break;
                    }
                });
            }
        }

        private activateLayer(layer: csComp.Services.ProjectLayer) {
            this.mcaScope = this.getMcaScope();
            if (!this.mcaScope) return;

            if (layer.id !== this.$scope.data.layerId || (layer.id === this.$scope.data.layerId && !layer.enabled)) {
                this.parentWidget.hide();
                return;
            }
            this.$timeout(() => {
                this.parentWidget.show();
            }, 0);
        }

        private getMcaScope() {
            var mcaElm = angular.element('div[id="mca"]');
            if (!mcaElm) {
                console.log('Mca element not found.');
                return;
            }
            var mcaScope = <Mca.IMcaScope>mcaElm.scope();
            if (!mcaScope) {
                console.log('Mca controller scope not found.');
                return;
            } else {
                var l = this.$layerService.findLoadedLayer(this.$scope.data.layerId);
                if (l && this.$scope.data.filterByDefaultFeatureType) {
                    this.$scope.data.availableMcas = mcaScope.vm.availableMcas.filter((mca) => {
                        return mca.featureIds[0].split('#').pop() === l.defaultFeatureType;
                    });
                } else {
                    this.$scope.data.availableMcas = mcaScope.vm.availableMcas;
                }
            }
            return mcaScope;
        }

        private setMcaAsStyle(mcaId: string) {
            if (!this.mcaScope || !this.mcaScope.vm.mca) {
                console.log('Mca controller scope not found.');
                return;
            } else {
                if (!this.$layerService.lastSelectedFeature) {
                    this.$messageBus.notifyWithTranslation('SELECT_A_FEATURE', 'SELECT_FEATURE_FOR_STYLE');
                    return;
                }
                var vm = this.mcaScope.vm;
                var mca = vm.findMcaById(mcaId);
                vm.updateAvailableMcas(mca);
                vm.updateSelectedFeature(this.$layerService.lastSelectedFeature);
                if (!vm.showFeature) {
                    this.$messageBus.notifyWithTranslation('SELECT_A_FEATURE', 'SELECT_FEATURE_FOR_STYLE');
                    return;
                }
                if (vm.properties.length > 0) {
                    vm.updateMca();
                    console.log('Set mca style.');
                    vm.setStyle(vm.properties[0]);
                }
            }
        }
    }
}
