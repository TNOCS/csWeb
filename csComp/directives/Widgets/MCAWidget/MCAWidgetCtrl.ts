module MCAWidget {
    export class MCAWidgetData {
        title: string;
        /**
         * If provided, indicates the layer that needs to be enabled in order to show the widget.
         */
        layerId: string;
        /**
         * The available mca's
         */
        availableMcas: Mca.Models.Mca[];
    }

    export interface IMCAWidgetScope extends ng.IScope {
        vm: MCAWidgetCtrl;
        data: MCAWidgetData;
    }

    export class MCAWidgetCtrl {
        private scope: IMCAWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private mcaScope: Mca.IMcaScope;

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

            if (layer.id !== this.$scope.data.layerId || (layer.id === this.$scope.data.layerId && !layer.enabled) {
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
                this.$scope.data.availableMcas = mcaScope.vm.availableMcas;
                return mcaScope;
            }
        }

        private setMcaAsStyle(mcaNr: number) {
            if (!this.mcaScope || !this.mcaScope.vm.mca) {
                console.log('Mca controller scope not found.');
                return;
            } else {
                var vm = this.mcaScope.vm;
                if (!vm.showFeature) {
                    this.$messageBus.notifyWithTranslation('SELECT_A_FEATURE', 'SELECT_FEATURE_FOR_STYLE');
                    return;
                }
                if (vm.properties.length > 0) {
                    var availableMcas = vm.availableMcas.length;
                    if (mcaNr <= availableMcas) {
                        vm.mca = vm.availableMcas[mcaNr];
                        vm.updateMca();
                    }
                    console.log('Set mca style.');
                    vm.setStyle(vm.properties[0]);
                }
            }
        }
    }
}
