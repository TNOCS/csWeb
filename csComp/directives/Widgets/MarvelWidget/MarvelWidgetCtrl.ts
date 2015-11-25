module MarvelWidget {
    export class MarvelWidgetData {
        title: string;
        /** Folder containing the marvel diagrams */
        marvelFolder: string;
        /**
         * If provided, indicates the feature type that needs to be selected in order to show the widget.
         */
        featureTypeName: string;
    }

    export interface IMarvelWidgetScope extends ng.IScope {
        vm: MarvelWidgetCtrl;
        data: MarvelWidgetData;
        minimized: boolean;
        editmode: boolean;
        selectedFeature: csComp.Services.IFeature;
        dependencyTypes: string[];
    }

    export class MarvelWidgetCtrl {
        private scope: IMarvelWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;

        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IMarvelWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;
            this.parentWidget = $("#" + this.widget.elementId).parent();
            $scope.dependencyTypes = ['_dep_water', '_dep_UPS', '_dep_features'];

            $scope.data = <MarvelWidgetData>this.widget.data;
            $scope.minimized = false;
            $scope.editmode = false;

            if (typeof $scope.data.featureTypeName !== 'undefined') {
                // Hide widget
                this.parentWidget.hide();
                this.$messageBus.subscribe('feature', (action: string, feature: csComp.Services.IFeature) => {
                    switch (action) {
                        case 'onFeatureDeselect':
                        case 'onFeatureSelect':
                            this.selectFeature(feature);
                            break;
                        default:
                            break;
                    }
                });
            }
        }

        private minimize() {
            this.$scope.minimized = !this.$scope.minimized;
            if (this.$scope.minimized) {
                this.parentWidget.css("height", "30px");
            } else {
                this.parentWidget.css("height", this.widget.height);
            }
        }

        private edit() {
            (this.$scope.editmode) ? this.save() : null;
            this.$scope.editmode = !this.$scope.editmode;
        }

        private close() {
            this.parentWidget.hide();
        }

        private escapeRegExp(str: string) {
            return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        }

        private replaceAll(str: string, find: string, replace: string) {
            return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
        }

        private addDependency(dep: string) {
            if (this.$scope.selectedFeature.properties.hasOwnProperty(dep)) {
                delete this.$scope.selectedFeature.properties[dep];
            } else {
                this.$scope.selectedFeature.properties[dep] = 0;
            }
        }

        private save() {
            this.$messageBus.serverPublish("cs/layers/powerstations/feature/" + this.$scope.selectedFeature.id, csComp.Services.Feature.serialize(this.$scope.selectedFeature));
            console.log('Published feature changes');
        }

        private selectFeature(feature: csComp.Services.IFeature) {
            if (!feature || !feature.isSelected) {
                this.parentWidget.hide();
                return;
            }
            if (typeof this.$scope.data.marvelFolder === 'undefined') return;
            if (!feature.fType || !feature.fType.name) return;
            this.$scope.selectedFeature = feature;
            var featureTypeName = feature.fType.name.replace(/(\_\d$)/, ''); // Remove state appendix (e.g. Hospital_0)
            var filePath = this.$scope.data.marvelFolder + featureTypeName + '.mrvjson';
            this.parentWidget.show();
            $.get(filePath, (marvel) => {
                this.$timeout(() => {
                    this.$scope.data.title = featureTypeName;
                    var w = $("#" + this.widget.elementId);
                    Marvelous.model(marvel, featureTypeName, w);
                }, 0);
            });
        }
    }

}
