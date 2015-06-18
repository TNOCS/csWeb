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
        width:number;
        height:number;
        margin:number;
    }

    myModule.directive('bulletChart', ['$filter',
            function($filter): ng.IDirective {
                return {
                    terminal: true,       // do not compile any other internal directives
                    restrict: 'EA',       // E = elements, other options are A=attributes and C=classes
                    scope: {
                        //data: '=',
                        data: '@',
                        width: '@',  // the value is used as is
                        height: '@',
                        margin: '@'
                    },
                    link: function(scope: IBulletchartScope, element, attrs) {
                        //in D3, any selection[0] contains the group
                        //selection[0][0] is the DOM node
                        //but we won't need that this time

                        var demoData = [{// demo data
                          title:"Drop outs",
                          subtitle:"%",
                          ranges : [150,225,300],
                          measures : [220,270],
                          markers : [250]

                        }];

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

                        var chart = d3.select(element[0]);

                        chart.append("div").attr("class", "chart")
                            .selectAll('div')
                            //.data(scope.data)
                              .data(demoData)
                              .enter().append("svg")
                              .attr("class", "bullet")
                              .attr("width", scope.width)
                              .attr("height", scope.height)
                            .append("g")
                              .call(doBullet);
                    }
                }
            }
        ])

}
