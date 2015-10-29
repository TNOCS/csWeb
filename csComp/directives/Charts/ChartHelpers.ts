module Charts {
    'use strict'

    declare var String;

    export class ChartHelpers {
        /**
        * Returns the index and value of the maximum.
        */
        static max(arr: number[]) {
            var max = arr[0];
            var maxIndex = 0;

            for (var i = 1; i < arr.length; i++) {
                if (arr[i] > max) {
                    maxIndex = i;
                    max = arr[i];
                }
            }
            return { maxIndex: maxIndex, max: max };
        }

        /**
        * Returns the index and value of the minimum.
        */
        static min(arr: number[]) {
            var min = arr[0];
            var minIndex = 0;

            for (var i = 1; i < arr.length; i++) {
                if (arr[i] < min) {
                    minIndex = i;
                    min = arr[i];
                }
            }
            return { minIndex: minIndex, min: min };
        }

        /**
        * Convert a timestamp to string.
        */
        static timestampToString(ts: number) {
            var date = new Date(ts);
            var dateString = String.format("{0}-{1:00}-{2:00}", date.getFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
            //if (date.getUTCHours() > 0 || date.getUTCMinutes() > 0)
            //    dateString += String.format(" {0:00}:{1:00}", date.getUTCHours(), date.getUTCMinutes());
            return dateString;
        }

        // Easy way to bind multiple functions to window.onresize
        // TODO: give a way to remove a function after its bound, other than removing all of them
        static windowResize(fun) {
            if (fun === undefined) return;
            var oldresize = window.onresize;

            window.onresize = function (e) {
                if (typeof oldresize == 'function') oldresize(e);
                fun(e);
            }
        }

        static initializeMargin(scope, attrs) {
            var margin = scope.$eval(attrs.margin) || {
                left: 50,
                top: 50,
                bottom: 50,
                right: 50
            };
            if (typeof margin !== 'object') {
                // we were passed a vanilla int, convert to full margin object
                margin = {
                    left: margin,
                    top: margin,
                    bottom: margin,
                    right: margin
                };
            }
            scope.margin = margin;
        }

        static getD3Selector(attrs, element) {
            if (!attrs.id) {
                //if an id is not supplied, create a random id.
                var dataAttributeChartID;
                if (!attrs['data-chartid']) {
                    dataAttributeChartID = 'chartid' + Math.floor(Math.random() * 1000000001);
                    angular.element(element).attr('data-chartid', dataAttributeChartID);
                } else {
                    dataAttributeChartID = attrs['data-chartid'];
                }
                return '[data-chartid=' + dataAttributeChartID + ']';
            } else {
                return '#' + attrs.id;
            }
        }

        static initializeLegendMargin(scope, attrs) {
            var margin = (scope.$eval(attrs.legendmargin) || {
                left: 0,
                top: 5,
                bottom: 5,
                right: 0
            });
            if (typeof (margin) !== 'object') {
                // we were passed a vanilla int, convert to full margin object
                margin = {
                    left: margin,
                    top: margin,
                    bottom: margin,
                    right: margin
                };
            }
            scope.legendmargin = margin;
        }

        static defaultColor() {
            var colors = d3.scale.category20().range();
            return function (d, i) { return d.color || colors[i % colors.length] };
        }

        static configureLegend(chart, scope, attrs) {
            if (chart.legend && attrs.showlegend && (attrs.showlegend === 'true')) {
                ChartHelpers.initializeLegendMargin(scope, attrs);
                chart.legend.margin(scope.legendmargin);
                chart.legend.width(attrs.legendwidth === undefined ? 400 : (+attrs.legendwidth));
                chart.legend.height(attrs.legendheight === undefined ? 20 : (+attrs.legendheight));
                chart.legend.key(attrs.legendkey === undefined ? function (d) {
                    return d.key;
                } : scope.legendkey());
                chart.legend.color(attrs.legendcolor === undefined ? ChartHelpers.defaultColor() : scope.legendcolor());
                chart.legend.align(attrs.legendalign === undefined ? true : (attrs.legendalign === 'true'));
                chart.legend.rightAlign(attrs.legendrightalign === undefined ? true : (attrs.legendrightalign === 'true'));
                chart.legend.updateState(attrs.legendupdatestate === undefined ? true : (attrs.legendupdatestate === 'true'));
                chart.legend.radioButtonMode(attrs.legendradiobuttonmode === undefined ? false : (attrs.legendradiobuttonmode === 'true'));
            }
        }

        static checkElementID(scope, attrs, element, chart, data) {
            //ChartHelpers.configureXaxis(chart, scope, attrs);
            //ChartHelpers.configureX2axis(chart, scope, attrs);
            //ChartHelpers.configureYaxis(chart, scope, attrs);
            //ChartHelpers.configureY1axis(chart, scope, attrs);
            //ChartHelpers.configureY2axis(chart, scope, attrs);
            ChartHelpers.configureLegend(chart, scope, attrs);
            //ChartHelpers.processEvents(chart, scope);
            var d3Select = ChartHelpers.getD3Selector(attrs, element);
            if (angular.isArray(data) && data.length === 0) {
                d3.select(d3Select + ' svg').remove();
            }
            if (d3.select(d3Select + ' svg').empty()) {
                d3.select(d3Select).append('svg');
            }
            d3.select(d3Select + ' svg').attr('viewBox', '0 0 ' + scope.width + ' ' + scope.height).datum(data).transition().duration(attrs.transitionduration === undefined ? 250 : +attrs.transitionduration).call(chart);
        }

        static updateDimensions(scope, attrs, element, chart) {
            if (chart) {
                chart.width(scope.width).height(scope.height);
                var d3Select = ChartHelpers.getD3Selector(attrs, element);
                d3.select(d3Select + ' svg').attr('viewBox', '0 0 ' + scope.width + ' ' + scope.height);
                ChartHelpers.windowResize(chart);
                scope.chart.update();
            }
        }
    }



}
