declare var bullet;

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

    export interface IBulletchartScope extends ng.IScope {
        data: any;
        update: boolean;
        width: number;
        height: number;
        margin: number;
    }

    myModule.directive('bulletChart', ['$filter',
        function($filter): ng.IDirective {

            var demoData = [{// demo data
                title: "Drop outs",
                subtitle: "%",
                ranges: [150, 225, 300],
                measures: [220, 270],
                markers: [250]
            }];

            function doDraw(scope, element) {
                if (scope.data) {
                    var doBullet = d3.bullet()
                        .width(scope.width)
                        .height(scope.height);

                    //bullet expects de following data
                    /**
                    title :
                    subtitle :

                    ranges : array of context ranges (absolute, not relative)
                    measures : array of values shown (absolute, not relative)
                    markers : (absolute, not relative)
                    */
                    //

                    $(element[0]).empty();
                    var chart = d3.select(element[0]);
                    var parsedData = [];
                    if (scope.data) { parsedData = JSON.parse(scope.data); };

                    var svg = chart.append("div").attr("class", "chart")
                        .selectAll('div')
                        .data(parsedData)
                    //.data(demoData)
                        .enter().append("svg")
                        .attr("class", "bullet")
                        .attr("width", scope.width+15)
                        .attr("height", +scope.height + 40)
                        .append("g")
                        .attr("transform", "translate(7,20)")
                        .call(doBullet,false);

                    var title = svg.append("g")
                        .style("text-anchor", "begin")
                        .attr("transform", "translate(0,-5)");

                    title.append("text")
                        .attr("class", "title")
                        .text(function(d) { return d.title; });

                    title.append("text")
                        .attr("class", "subtitle")
                        .attr("dy", "1em")
                        .text(function(d) { return d.subtitle; });
                };
            }

            return {
                terminal: true,       // do not compile any other internal directives
                restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                scope: {
                    //data: '=',
                    data: '=',
                    update: '=',
                    width: '=',  // the value is used as is
                    height: '@',
                    margin: '@'
                },
                link: (scope: IBulletchartScope, element, attrs) => {
                    //in D3, any selection[0] contains the group
                    //selection[0][0] is the DOM node
                    //but we won't need that this time

                    doDraw(scope, element);

                    scope.$watch("data", () => {
                        doDraw(scope, element);
                    })
                    scope.$watch("update", () => {
                        doDraw(scope, element);
                    })
                }
            }
        }
    ])

}
