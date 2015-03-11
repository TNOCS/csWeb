module Charts {
    /**
      * Config
      */
    var moduleName = 'csWeb.charts';

    /**
      * Module        
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) { 
        // named module does not exist, so create one                                             
        myModule = angular.module(moduleName, []);
    }

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
            if (date.getUTCHours() > 0 || date.getUTCMinutes() > 0)
                dateString += String.format(" {0:00}:{1:00}", date.getUTCHours(), date.getUTCMinutes());
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

    export interface ISparklineScope extends ng.IScope {
        timestamps: number[];
        sensor    : number[];
        width?    : number;
        height?   : number;
        margin?   : { top: number; right: number; bottom: number; left: number; };
    }

    export interface IBarchartScope extends ng.IScope {
        data: number[];
    }

    /**
      * Directive to create a sparkline chart.
      *
      * @seealso: http://odiseo.net/angularjs/proper-use-of-d3-js-with-angular-directives
      * @seealso: http://cmaurer.github.io/angularjs-nvd3-directives/sparkline.chart.html
      * @seealso: http://www.tnoda.com/blog/2013-12-19
      */
    myModule.directive('sparklineChart', ['$filter',
        function ($filter): ng.IDirective {
            return {
                terminal: true,       // do not compile any other internal directives 
                restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                scope: {
                    timestamps: '=',
                    sensor    : '=',
                    width     : '@',
                    height    : '@',
                    margin    : '@'
                },
                //controller: [
                //    '$scope',
                //    '$element',
                //    '$attrs',
                //    function ($scope, $element, $attrs) {
                //        $scope.d3Call    = function (data, chart) {
                //            ChartHelpers.checkElementID($scope, $attrs, $element, chart, data);
                //        };
                //    }
                //],
                link: function (scope: ISparklineScope, element, attrs) {
                    var margin           = scope.margin || { top: 10, right: 10, bottom: 10, left: 10 };
                    var width            = scope.width || 100;
                    var height           = scope.height || 70;
                    var cursorTextHeight = 20; // leave room for the cursor text (timestamp | measurement)
                    var chart = d3.select(element[0])
                        .append('svg:svg')
                        .attr('width', width)
                        .attr('height', height);

                    var x = d3.scale.linear().range([margin.left, width - margin.left - margin.right]);
                    var y = d3.scale.linear().range([height - margin.bottom, margin.top + cursorTextHeight]);
                    var bisect = d3.bisector(function (d) { return d.time; }).left;

                    var line = d3.svg.line()
                        .interpolate("cardinal")
                        .x(function (d) { return x(d.time); })
                        .y(function (d) { return y(d.measurement); });

                    var data: { time: number; measurement: number }[] = []; 
                    for (var i = 0; i < scope.timestamps.length; i++) {
                        data.push({ time: scope.timestamps[i], measurement: scope.sensor[i] });
                    }
                    x.domain(d3.extent(data, function (d: { time: number; measurement: number }) { return d.time; }));
                    y.domain(d3.extent(data, function (d: { time: number; measurement: number }) { return d.measurement; }));

                    var path = chart.append("svg:path")
                        .attr("d", line(data))
                        .attr('class', 'sparkline-path');

                    // draw a circle around the max and min value
                    var measurements = data.map(function (d) { return d.measurement; });
                    var min = ChartHelpers.min(measurements);
                    var max = ChartHelpers.max(measurements);
                    chart.append('circle')
                        .attr('class', 'sparkcircle-max')
                        .attr('cx', x(data[max.maxIndex].time))
                        .attr('cy', y(max.max))
                        .attr('r', 4);
                    chart.append('circle')
                        .attr('class', 'sparkcircle-min')
                        .attr('cx', x(data[min.minIndex].time))
                        .attr('cy', y(min.min))
                        .attr('r', 4);

                    // draw a line at the current cursor position
                    var cursor = chart.append("line")
                        .attr("x1", 0)
                        .attr("y1", 0)
                        .attr("x2", 0)
                        .attr("y2", 0)
                        .attr("opacity", 0)
                        .attr("stroke", "black");
                    var timestampText = chart.append("text")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("dy", ".35em")
                        .attr("opacity", 0)
                        .style("text-anchor", "end")
                        .text("");
                    var measurementText = chart.append("text")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("dy", ".35em")
                        .attr("opacity", 0)
                        .text("");

                    var pathEl:any = path.node();
                    var pathLength = pathEl.getTotalLength();

                    chart
                        //.on("mouseover", function () { })
                        .on("mouseout", function () {
                            cursor.attr("opacity", 0);
                            timestampText.attr("opacity", 0);
                            measurementText.attr("opacity", 0);
                        })
                        .on("mousemove", function () {
                            var offsetLeft = element[0].getBoundingClientRect().left;
                            var xpos = d3.event.clientX - offsetLeft;
                            var beginning = xpos, end = pathLength, target;
                            while (true) {
                                target = Math.floor((beginning + end) / 2);
                                var pos = pathEl.getPointAtLength(target);
                                if ((target === end || target === beginning) && pos.x !== xpos) {
                                    break;
                                }
                                if (pos.x > xpos) end = target;
                                else if (pos.x < xpos) beginning = target;
                                else break; //position found
                            }
                            // using the x scale, in this case a d3 time scale
                            // use the .invert() function to interpolate a date along the scale
                            // given the x-coordinates of the mouse
                            var t0 = x.invert(d3.mouse(this)[0]);

                            // using the interpolated date, find an index in the sorted data
                            // this would be the index suitable for insertion
                            var i = bisect(data, t0, 1);

                            if (0 < i && i < data.length) { 
                                // now that we know where in the data the interpolated date would "fit"
                                // between two values, pull them both back as temporaries
                                var d0 = data[i - 1];
                                var d1 = data[i];

                                // now, examine which of the two dates we are "closer" to
                                // to do this, compare the delta values
                                var d = t0 - d0.time > d1.time - t0 ? d1 : d0;
                            }
                            else if (i <= 0) d = data[0];
                            else d = data[data.length - 1];
                            xpos = x(d.time);

                            // draw
                            cursor
                                .attr("x1", xpos)
                                .attr("y1", 0)
                                .attr("x2", xpos)
                                .attr("y2", height)
                                .attr("opacity", 1);
                            timestampText
                                .attr("x", xpos - 6)
                                .attr("y", 4)
                                .attr("dy", ".35em")
                                .attr("opacity", 1)
                                .text(ChartHelpers.timestampToString(d.time));
                            measurementText
                                .attr("x", xpos + 6)
                                .attr("y", 4)
                                .attr("dy", ".35em")
                                .attr("opacity", 1)
                                .text(d.measurement);
                             });

                    //chart
                    //    .on("mouseover", function() {})
                    //    .on("mouseout", function () { })
                    //    .on("mousemove", function () {
                    //        var x = d3.event.clientX - offsetLeft;
                    //        var beginning = x, end = width - margin.left - margin.right, target;
                    //        while (true) {
                    //            target = Math.floor((beginning + end) / 2);
                    //            var pos = { x: 0, y: 0 };
                    //            if ((target === end || target === beginning) && pos.x !== x) {
                    //                break;
                    //            }
                    //            if (pos.x > x) end = target;
                    //            else if (pos.x < x) beginning = target;
                    //            else break; //position found
                    //        }
                    //        circle
                    //            .attr("opacity", 1)
                    //            .attr("cx", x)
                    //            .attr("cy", pos.y);
                    //});

                    //var div = d3.select("body").append("div")
                    //    .attr("class", "tooltip")
                    //    .style("opacity", 1e-6);
                }
            //    link: function (scope: any, element, attrs) {
            //        scope.$watch('width + height', function () {
            //            ChartHelpers.updateDimensions(scope, attrs, element, scope.chart);
            //        });
            //        scope.$watch('data', function (data) {
            //            if (data && angular.isDefined(scope.filtername) && angular.isDefined(scope.filtervalue)) {
            //                data = $filter(scope.filtername)(data, scope.filtervalue);
            //            }
            //            if (data) {
            //                //if the chart exists on the scope, do not call addGraph again, update data and call the chart.
            //                if (scope.chart) {
            //                    return scope.d3Call(data, scope.chart);
            //                }
            //                Render.addGraph({
            //                    generate: function () {
            //                        ChartHelpers.initializeMargin(scope, attrs);
            //                        var chart = Render.models.lineChart().width(scope.width).height(scope.height).margin(scope.margin).x(attrs.x === undefined ? function (d) {
            //                            return d[0];
            //                        } : scope.x()).y(attrs.y === undefined ? function (d) {
            //                            return d[1];
            //                        } : scope.y()).forceX(attrs.forcex === undefined ? [] : scope.$eval(attrs.forcex)).forceY(attrs.forcey === undefined ? [0] : scope.$eval(attrs.forcey)).showLegend(attrs.showlegend === undefined ? false : attrs.showlegend === 'true').tooltips(attrs.tooltips === undefined ? false : attrs.tooltips === 'true').showXAxis(attrs.showxaxis === undefined ? false : attrs.showxaxis === 'true').showYAxis(attrs.showyaxis === undefined ? false : attrs.showyaxis === 'true').rightAlignYAxis(attrs.rightalignyaxis === undefined ? false : attrs.rightalignyaxis === 'true').noData(attrs.nodata === undefined ? 'No Data Available.' : scope.nodata).interactive(attrs.interactive === undefined ? false : attrs.interactive === 'true').clipEdge(attrs.clipedge === undefined ? false : attrs.clipedge === 'true').clipVoronoi(attrs.clipvoronoi === undefined ? false : attrs.clipvoronoi === 'true').interpolate(attrs.interpolate === undefined ? 'linear' : attrs.interpolate).color(attrs.color === undefined ? nv.utils.defaultColor() : scope.color()).isArea(attrs.isarea === undefined ? function (d) {
            //                            return d.area;
            //                        } : function () {
            //                                return attrs.isarea === 'true';
            //                            });
            //                        if (attrs.useinteractiveguideline) {
            //                            chart.useInteractiveGuideline(attrs.useinteractiveguideline === undefined ? false : attrs.useinteractiveguideline === 'true');
            //                        }
            //                        if (attrs.tooltipcontent) {
            //                            chart.tooltipContent(scope.tooltipcontent());
            //                        }
            //                        scope.d3Call(data, chart);
            //                        ChartHelpers.windowResize(chart.update);
            //                        scope.chart = chart;
            //                        return chart;
            //                    },
            //                    callback: attrs.callback === undefined ? null : scope.callback()
            //                });
            //            }
            //        }, attrs.objectequality === undefined ? false : attrs.objectequality === 'true');
            //    }
            //};
        }
        }])

        /**
        * A simple directive to create a (horizontal) barchart.
        * Usage: <bar-chart data="[10,20,30,40,50]"></bar-chart>
        * @seealso: https://gist.github.com/odiseo42/6731571
        */
        .directive('barChart', ['$filter',
            function ($filter): ng.IDirective {
                return {
                    terminal: true,       // do not compile any other internal directives 
                    restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                    scope: {
                        data: '=',
                    },
                    link: function (scope: IBarchartScope, element, attrs) {
                        //in D3, any selection[0] contains the group
                        //selection[0][0] is the DOM node
                        //but we won't need that this time
                        var chart = d3.select(element[0]);
                        //to our original directive markup bars-chart
                        //we add a div with out chart stling and bind each
                        //data entry to the chart
                        chart.append("div").attr("class", "chart")
                            .selectAll('div')
                            .data(scope.data).enter().append("div")
                            .transition().ease("elastic")
                            .style("width", function (d) { return d + "%"; })
                            .text(function (d) { return d + "%"; });
                        //a little of magic: setting it's width based
                        //on the data value (d) 
                        //and text all with a smooth transition
                    } 
                }
            }
        ]);
}
  