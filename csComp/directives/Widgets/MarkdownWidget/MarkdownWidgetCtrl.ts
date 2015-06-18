module MarkdownWidget {
    export class MarkdownWidgetData {
        title:   string;
        /**
         * Content to display: you can either provide it directly, or specify a URL, in which case it will replace the content.
         */
        content: string;
        url:     string;
        /**
         * The actual content is being converted, if necessary, and set to the markdown text.
         */
        mdText:  string;
        /**
         * If provided, indicates the feature type that needs to be selected in order to show the widget.
         */
        featureTypeName: string;
        /**
         * If provided, a list of properties that need to be injected into the content in order to generate the mdText.
         */
        dynamicProperties: string[];
    }

    export interface IMarkdownWidgetScope extends ng.IScope {
        vm  : MarkdownWidgetCtrl;
        data: MarkdownWidgetData;
    }

    export class MarkdownWidgetCtrl {
        private scope: IMarkdownWidgetScope;
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
            private $scope       : IMarkdownWidgetScope,
            private $timeout     : ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus  : csComp.Services.MessageBusService,
            private $mapService  : csComp.Services.MapService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <MarkdownWidgetData>this.widget.data;
            $scope.data.mdText = $scope.data.content;

            if (typeof $scope.data.featureTypeName !== 'undefined' && typeof $scope.data.dynamicProperties !== 'undefined' && $scope.data.dynamicProperties.length > 0) {
                // Hide widget
                this.parentWidget = $("#" + this.widget.elementId).parent();
                this.parentWidget.hide();
                this.$messageBus.subscribe('feature', (action: string, feature: csComp.Services.IFeature) => {
                    switch (action) {
                        case 'onFeatureSelect':
                            this.selectFeature(feature);
                            break;
                        default:
                            break;
                    }
                });
            }

            if (typeof $scope.data.url === 'undefined') return;
            $.get($scope.data.url, (md) => {
                $timeout(() => {
                    $scope.data.content = $scope.data.mdText = md;
                }, 0);
            });
        }

        private selectFeature(feature: csComp.Services.IFeature) {
            if (feature.featureTypeName !== this.$scope.data.featureTypeName) {
                this.parentWidget.hide();
                return;
            }
            this.$timeout(() => {
                var md = this.$scope.data.content;
                var i = 0;
                this.$scope.data.dynamicProperties.forEach(p => {
                    md = md.replace('{{' + i++ +'}}', feature.properties[p]);
                });
                this.parentWidget.show();
                this.$scope.data.mdText = md;
            }, 0);
        }
    }

}
