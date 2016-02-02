module HeaderWidget {
    export class HeaderWidgetData {
        title: string;
        /**
         * Content to display: you can either provide it directly, or specify a URL, in which case it will replace the content.
         */
        content: string;
        url: string;
        /**
         * Allows you to provide a link to a text file containing a list of properties (i.e. key-value pairs). When the keys
         * are stated in the markdown content (between curly braces {{KEY}}), they will be replaced by the value. 
         */
        dataSourceUrl: string;
        /**
         * Set true to use translate the content. To use it, create a separate file
         * for each language and add a pre-extension to the file corresponding to the language code, e.g.
         * data/mycontent.en.txt or data/mycontent.nl.txt . The url should then be "data/mycontent.txt"
         */
        useLanguagePrefix: boolean;
        /**
         * The actual content is being converted, if necessary, and set to the markdown text.
         */
        mdText: string;
        /**
         * If provided, indicates the feature type that needs to be selected in order to show the widget.
         */
        featureTypeName: string;
        /**
         * If provided, a list of properties that need to be injected into the content in order to generate the mdText.
         */
        dynamicProperties: string[];
    }

    export interface IHeaderWidgetScope extends ng.IScope {
        vm: HeaderWidgetCtrl;
        data: HeaderWidgetData;
        minimized: boolean;
    }

    export class HeaderWidgetCtrl {
        private scope: IHeaderWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private dataProperties: { [key: string]: any };

        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IHeaderWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <HeaderWidgetData>this.widget.data;
            $scope.data.mdText = $scope.data.content;
            $scope.minimized = false;
            this.dataProperties = {};

            this.parentWidget = $('#' + this.widget.elementId).parent();

            if (typeof $scope.data.featureTypeName !== 'undefined' && typeof $scope.data.dynamicProperties !== 'undefined' && $scope.data.dynamicProperties.length > 0) {
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

            if (!(typeof $scope.data.url === 'undefined')) {
                var url = $scope.data.url;
                if ($scope.data.useLanguagePrefix) {
                    var extensions = url.split('.');
                    var newExtension = this.$layerService.currentLocale + '.' + extensions.pop();
                    extensions.push(newExtension);
                    url = extensions.join('.');
                }
                $.get(url, (md) => {
                    $timeout(() => {
                        $scope.data.content = $scope.data.mdText = md;
                    }, 0);
                });
            }

            // in case a separate datafile is used
            if (!(typeof $scope.data.dataSourceUrl === 'undefined')) {
                url = $scope.data.dataSourceUrl;
                $.get(url, (properties) => {
                    $timeout(() => {
                        this.dataProperties = JSON.parse(properties);
                        this.replaceKeys();
                    }, 0);
                });
            }
        }

        private minimize() {
            this.$scope.minimized = !this.$scope.minimized;
            if (this.$scope.minimized) {
                this.parentWidget.css('height', '30px');
            } else {
                this.parentWidget.css('height', this.widget.height);
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

        private escapeRegExp(str: string) {
            return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
        }

        private replaceAll(str: string, find: string, replace: string) {
            return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
        }

        private selectFeature(feature: csComp.Services.IFeature) {
            if (!feature || !feature.isSelected || feature.featureTypeName !== this.$scope.data.featureTypeName) {
                this.parentWidget.hide();
                return;
            }
            this.$timeout(() => {
                var md = this.$scope.data.content;
                var i = 0;
                this.$scope.data.dynamicProperties.forEach(p => {
                    var searchPattern = '{{' + i++ + '}}';
                    var displayText = '';
                    if (feature.properties.hasOwnProperty(p)) {
                        var pt = this.$layerService.getPropertyType(feature, p);
                        displayText = csComp.Helpers.convertPropertyInfo(pt, feature.properties[p]);
                    }
                    md = this.replaceAll(md, searchPattern, displayText);
                });
                this.parentWidget.show();
                this.$scope.data.mdText = md;
            }, 0);
        }

        private replaceKeys() {
            var md = this.$scope.data.content;
            this.$timeout(() => {
                var keys = Object.keys(this.dataProperties);
                keys.forEach((k) => {
                    if (this.dataProperties.hasOwnProperty(k)) {
                        let searchPattern = '{{' + k + '}}';
                        let replacePattern = this.dataProperties[k];
                        md = this.replaceAll(md, searchPattern, replacePattern);
                    }
                });
                this.$scope.data.mdText = md;
            }, 0);
        }
    }

}
