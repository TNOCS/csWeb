module Charts {
    'use strict'
    /**
      * Config
      */
    var moduleName = 'csComp';

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

    export interface ICircularchartScope extends ng.IScope {
        value: number;
        min: number;
        max: number;
        color?: string;
        titleClass: string;
        title: string;
        valueString: string;
        valueClass: string;
        animationDuration: number;
        width?: number;
        height?: number;
        margin?: { top: number; right: number; bottom: number; left: number; };
    }

    /**
      * Directive to create a sparkline chart.
      *
      * @seealso: http://odiseo.net/angularjs/proper-use-of-d3-js-with-angular-directives
      * @seealso: http://cmaurer.github.io/angularjs-nvd3-directives/sparkline.chart.html
      * @seealso: http://www.tnoda.com/blog/2013-12-19
      */
    myModule
        .directive('circularChart', [
        function(): ng.IDirective {
            return {
                terminal: true,       // do not compile any other internal directives
                restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                scope: {
                    value: '=',
                    max: '=',
                    title: '=',
                    valueString: '=',
                    color: '=',
                    valueClass: '@',
                    titleClass: '@',
                    animationDuration: '@',
                    width: '@',  // the value is used as is
                    height: '@',
                    margin: '@'
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
                link: function(scope: ICircularchartScope, element, attrs) {



                    var doDraw = (() => {
                        if (scope.value != null && scope.max != null) {
                            var margin = scope.margin || { top: 15, right: 5, bottom: 0, left: 10 };
                            var width = scope.width || 100;
                            var height = scope.height || 70;
                            var c = scope.color || "purple";
                            var animationDuration = scope.animationDuration || 0;
                            var cursorTextHeight = 12;// + (showAxis ? 5 : 0); // leave room for the cursor text (timestamp | measurement)
                            $(element[0]).empty();

                            var dataset = {
                                hddrives: [scope.value, scope.max - scope.value],
                            };

                            var width = scope.width,
                                height = scope.height,
                                radius = Math.min(width, height) / 2;

                            var color = d3.scale.ordinal()
                                .range([c, "lightgray"]);

                            var pie = d3.layout.pie()
                                .sort(null);

                            var arc = d3.svg.arc()
                                .innerRadius(radius - 100)
                                .outerRadius(radius - 80);

                            var svg = d3.select(element[0]).append("svg")
                                .attr("width", width)
                                .attr("height", height)
                                .append("g")
                                .attr("transform", "translate(" + width / 3 + "," + height / 3 + ")");

                            var path = svg.selectAll("path")
                                .data(pie(dataset.hddrives))
                                .enter().append("path")
                                .attr("class", "arc")
                                .attr("fill", function(d, i) { return color(i); })
                                .transition().delay(function(d, i) { return i * animationDuration; }).duration(animationDuration)
                                .attrTween("d", function(d) {
                                var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                                return function(t) {
                                    d.endAngle = i(t);
                                    return arc(d);
                                }
                            });

                            svg.append("text")
                                .attr("dy", "-0.25em")
                                .style("text-anchor", "middle")
                                .attr("class", scope.valueClass)
                                .text(function(d) { return scope.valueString; });
                            svg.append("text")
                                .attr("dy", "1em")
                                .style("text-anchor", "middle")
                                .attr("class", scope.titleClass)
                                .text(function(d) { return scope.title; });
                        }
                    }
                        );

                    doDraw();
                    scope.$watch("value", () => {
                        doDraw();
                    })
                    //scope.closed = true;


                }
            }
        }])


}
