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

    export interface IBarchartScope extends ng.IScope {
        data: number[];
        update: boolean;
    }

    myModule.directive('barChart', ['$filter',
            function($filter): ng.IDirective {
                return {
                    terminal: true,       // do not compile any other internal directives
                    restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                    scope: {
                        data: '=',
                        update: '='
                    },
                    link: function(scope: IBarchartScope, element, attrs) {
                        //in D3, any selection[0] contains the group
                        //selection[0][0] is the DOM node
                        //but we won't need that this time
                        var chart = d3.select(element[0]);

                        chart.append("div").attr("class", "chart")
                            .selectAll('div')
                            .data(scope.data).enter().append("div")
                            .transition().ease("elastic")
                            .style("width", function(d) { return d + "%"; })
                            .text(function(d) { return d + "%"; });


                        //to our original directive markup bars-chart
                        //we add a div with out chart stling and bind each
                        //data entry to the chart

                    }
                }
            }
        ])



}
