module Filters {


    export interface IBarFilterScope extends ng.IScope {
        vm: BarFilterCtrl;
        filter : csComp.Services.GroupFilter;
        options : Function;
    }

    export class BarFilterCtrl {
        private scope: IBarFilterScope;
        private widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService',
            '$timeout'

        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            public $scope       : IBarFilterScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $timeout : ng.ITimeoutService
            ) {
              $scope.vm = this;



              var par = <any>$scope.$parent.$parent;

              if (par.hasOwnProperty('filter'))
              {
                $scope.filter = par['filter'];
              }
              else
              {

              }
              if ($scope && $scope.filter)
              {
                setTimeout(()=>this.initBarFilter());
                //$timeout.call(()=>this.initBarFilter());

              //this.updateTextFilter();
              //this.widget = (par.widget);
              $scope.$watch('filter.stringValue', ()=> {
                  //this.updateTextFilter();
              });

              $scope.options = (()=>{
                var res = [];
                res.push(['reset',()=>this.initBarFilter()]);
                return res;
              });


              }

            }

            private displayFilterRange(min,max)
            {
              var filter = this.$scope.filter;
              (<any>filter).from = min;
              (<any>filter).to = max;
              this.$scope.$apply();
            }

            private dcChart : any;


            public initBarFilter()
            {
              var filter = this.$scope.filter;
              var group = filter.group;
              var divid = 'filter_' + filter.id;

              this.dcChart = <any>dc.barChart('#' + divid);

              this.$scope.$apply();

              var filterFrom = $('#fsfrom_' + filter.id);
              var filterTo = $('#fsto_' + filter.id);
              var info = this.$layerService.calculatePropertyInfo(group, filter.property);

              var nBins = 20;
              var min = info.sdMin;
              var max = info.sdMax;

              var binWidth = (max - min) / nBins;

              var dcDim = group.ndx.dimension(d => {
                  if (!d.properties.hasOwnProperty(filter.property)) return null;
                  else {
                      if (d.properties[filter.property] != null) {
                          var a = parseInt(d.properties[filter.property]);
                          if (a >= min && a <= max) {
                              return Math.floor(a / binWidth) * binWidth;
                          } else {
                              return null;
                          }
                      }
                      return null;
                      //return a;
                  }
              });
              filter.dimension = dcDim;
              var dcGroup = dcDim.group();

              //var scale =
              this.dcChart.width(275)
                  .height(100)
                  .dimension(dcDim)
                  .group(dcGroup)
                  .transitionDuration(100)
                  .centerBar(true)
                  .gap(5) //d3.scale.quantize().domain([0, 10]).range(d3.range(1, 4));
                  .elasticY(true)
                  .x(d3.scale.linear().domain([min,max]).range([-1, nBins + 1]))
                  .filterPrinter(filters => {
                  var s = '';
                  if (filters.length > 0) {
                      var localFilter = filters[0];
                      this.displayFilterRange(localFilter[0].toFixed(2),localFilter[1].toFixed(2))
                    //  $("#filterfrom_" + filter.id).empty();
                    //$("#filterfrom_" + filter.id).text(localFilter[0].toFixed(2));


                      s += localFilter[0];
                  }

                  return s;
              })
                  .on('filtered', (e) => {
                  var fil = e.hasFilter();
                  if (fil) {
                      //filterRange.show();
                  } else {
                      //filterRange.hide();
                  }
                  dc.events.trigger(() => {
                      group.filterResult = dcDim.top(Infinity);
                      this.$layerService.updateFilterGroupCount(group);
                  }, 0);
                  dc.events.trigger(() => {
                    this.$layerService.updateMapFilter(group);
                  }, 100);
              });
              this.displayFilterRange(min,max);


              this.dcChart.xUnits(() => { return 13; });

              filterFrom.on('change', () => {
                  if ($.isNumeric(filterFrom.val())) {
                      var min = parseInt(filterFrom.val());
                      var filters = this.dcChart.filters();
                      if (filters.length > 0) {
                          filters[0][0] = min;
                          this.dcChart.filter(filters[0]);
                          this.dcChart.render();
                          //dcDim.filter(filters[0]);
                          dc.redrawAll();
                          //dc.renderAll();
                      }
                  }
              });
              filterTo.on('change', () => {
                  if ($.isNumeric(filterTo.val())) {
                      var max = parseInt(filterTo.val());
                      var filters = this.dcChart.filters();
                      if (filters.length > 0) {
                          filters[0][1] = max;
                          this.dcChart.filter(filters[0]);
                          dcDim.filter(filters[0]);
                          dc.renderAll();
                      }
                      //dc.redrawAll();
                  }
                  //dcDim.filter([min, min + 100]);
              });

              this.$scope.$watch('filter.from',()=>this.updateFilter());
              this.$scope.$watch('filter.to',()=>this.updateFilter());

              //if (filter.meta != null && filter.meta.minValue != null) {
              //    dcChart.x(d3.scale.linear().domain([filter.meta.minValue, filter.meta.maxValue]));
              //} else {
              //    var propInfo = this.calculatePropertyInfo(group, filter.property);
              //    var dif = (propInfo.max - propInfo.min) / 100;
              //    dcChart.x(d3.scale.linear().domain([propInfo.min - dif, propInfo.max + dif]));
              //}

              this.dcChart.yAxis().ticks(5);
              this.dcChart.xAxis().ticks(5);
              //this.dcChart.mouseZoomable(true);
              dc.renderAll();
            //  this.updateChartRange(this.dcChart,filter);

            }

            private updateFilter()
            {
              setTimeout(()=>{
                this.dcChart.filter([(<any>this.$scope.filter).from,(<any>this.$scope.filter).to]);
                this.dcChart.render();
                this.$layerService.updateMapFilter(this.$scope.filter.group);
                console.log('update filter');
              },10);

            }

        public remove()
        {

          return;

          if (this.$scope.filter)
          {
            this.$scope.filter.dimension.dispose();
            this.$scope.filter.group.filters = this.$scope.filter.group.filters.filter(f=>{return f!=this.$scope.filter;});
            //this.$layerService.updateMapFilter(this.$scope.filter.group);
            this.$layerService.resetMapFilter(this.$scope.filter.group);
          }
        }


    }
}
