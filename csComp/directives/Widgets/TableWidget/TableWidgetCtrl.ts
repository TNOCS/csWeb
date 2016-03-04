module TableWidget {
    export interface ITableDefinition {
        /** Number of columns */
        nrOfCols: number;
        /** Number of rows */
        nrOfRows: number;
        /** Headers of each column */
        columnHeaders: string[];
        /** Titles of each row */
        rowTitles: string[];
        /**
         * Content grid of the table: you can either provide it directly, or specify a URL, in which case it will replace the content.
         */
        datagrid: string[][];
        /** 
         * Allows for defining a style for each cell of the datagrid.
         */
        stylegrid: string[][];
    }

    export class TableWidgetData {
        title: string;
        /**
         * Table content definition: you can either provide it directly, or specify a URL, in which case it will replace the content.
         */
        content: ITableDefinition;
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
         * The actual table with headers and content
         */
        tableHtml: string;
        /**
         * If provided, indicates the feature type that needs to be selected in order to show the widget.
         */
        featureTypeName: string;
        /**
         * If provided, a list of properties that need to be injected into the content in order to generate the table.
         */
        dynamicProperties: string[];

        /**
         * If provided, shows a caption under the table
         */
        caption: string[];
    }

    export interface ITableWidgetScope extends ng.IScope {
        vm: TableWidgetCtrl;
        data: TableWidgetData;
        minimized: boolean;
    }

    export class TableWidgetCtrl {
        private scope: ITableWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private dataProperties: { [key: string]: any };

        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService',
            '$sce'
        ];

        constructor(
            private $scope: ITableWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $sce: ng.ISCEService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <TableWidgetData>this.widget.data;
            $scope.data.tableHtml = '<table></table>';
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
                $.get(url, (table: string) => {
                    $timeout(() => {
                        try {
                            $scope.data.content = JSON.parse(table);
                            this.createTable();
                            this.updateTable();
                        } catch (error) {
                            console.log('Error parsing table');
                        }
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

        private createTable() {
            var data = this.$scope.data.content;
            var table = '<table style="width:100%">';
            if (!data.hasOwnProperty('columnHeaders')) return;
            table += '<tr class="tablewidget-row">';
            data.columnHeaders.forEach((h) => {
                table += '<th class="tablewidget-cell border-bottom" style="width:' + 100 / (data.nrOfCols + 1) + '%">' + h + '</th>';
            });
            table += '</tr>';
            if (!data.hasOwnProperty('rowTitles') || !data.hasOwnProperty('datagrid')) return;
            data.datagrid.forEach((row, ri) => {
                table += '<tr class="tablewidget-row">';
                table += '<th class="border-right">' + data.rowTitles[ri] + '</th>';
                row.forEach((col, ci) => {
                    let style = (data.stylegrid) ? data.stylegrid[ri][ci] : '';
                    table += '<td class="tablewidget-cell" style="' + style + '">' + data.datagrid[ri][ci] + '</td>';
                });
                table += '</tr>';
            });
            table += '</table>';
            this.$scope.data.tableHtml = table;
        }

        private updateTable() {
            var tableContainer = $('#' + this.widget.elementId).find('#widgettable-container');
            tableContainer.html(this.$scope.data.tableHtml);
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
                var d = this.$scope.data.tableHtml;
                var i = 0;
                this.$scope.data.dynamicProperties.forEach(p => {
                    var searchPattern = '{{' + i++ + '}}';
                    var displayText = '';
                    if (feature.properties.hasOwnProperty(p)) {
                        var pt = this.$layerService.getPropertyType(feature, p);
                        displayText = csComp.Helpers.convertPropertyInfo(pt, feature.properties[p]);
                    }
                    d = this.replaceAll(d, searchPattern, displayText);
                });
                this.parentWidget.show();
                this.$scope.data.tableHtml = d;
                this.updateTable();
            }, 0);
        }

        private replaceKeys() {
            var d = this.$scope.data.tableHtml;
            this.$timeout(() => {
                var keys = Object.keys(this.dataProperties);
                keys.forEach((k) => {
                    if (this.dataProperties.hasOwnProperty(k)) {
                        let searchPattern = '{{' + k + '}}';
                        let replacePattern = this.dataProperties[k];
                        d = this.replaceAll(d, searchPattern, replacePattern);
                    }
                });
                this.$scope.data.tableHtml = d;
                this.updateTable();
            }, 0);
        }
        public toTrusted(html: string): string {
            try {
                if (html === undefined || html === null)
                    return this.$sce.trustAsHtml(html);
                return this.$sce.trustAsHtml(html.toString());
            } catch (e) {
                console.log(e + ': ' + html);
                return '';
            }
        }
    }
}
