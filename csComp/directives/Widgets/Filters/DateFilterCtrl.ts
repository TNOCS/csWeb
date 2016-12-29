module Filters {


  export interface IDateFilterScope extends ng.IScope {
    vm: DateFilterCtrl;
    filter: csComp.Services.GroupFilter;
  }

  export class DateFilterCtrl {
    private scope: IDateFilterScope;
    private widget: csComp.Services.IWidget;
    public switch: string = 'range';
    private subHandle: csComp.Services.MessageBusHandle;

    // $inject annotation.
    // It provides $injector with information about dependencies to be injected into constructor
    // it is better to have it close to the constructor, because the parameters must match in count and type.
    // See http://docs.angularjs.org/guide/di
    public static $inject = [
      '$scope',
      'layerService',
      'messageBusService'

    ];

    // dependencies are injected via AngularJS $injector
    // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
    constructor(
      public $scope: IDateFilterScope,
      private $layerService: csComp.Services.LayerService,
      private $messageBus: csComp.Services.MessageBusService
    ) {
      $scope.vm = this;

      var par = <any>$scope.$parent.$parent;

      if (par.hasOwnProperty('filter')) {
        $scope.filter = par['filter'];
      }
      else {

      }
      if ($scope && $scope.filter) {
        this.initTextFilter();
        //this.updateTextFilter();
        //this.widget = (par.widget);
        //$messageBus.subscribe('')
        this.subHandle = $messageBus.subscribe('timeline', (trigger: string) => {
          switch (trigger) {
            case 'focusChange':
              this.updateDateFilter();
              break;
          }
        });
        $scope.$watch('vm.switch', () => { this.updateDateFilter(); });
        // $scope.$watch('filter.stringValue', ()=> {
        //
        // });

      }

    }

    public select() {
      //  console.log('select:' + this.switch);
    }

    private check(d: string): boolean {
      if (d != null) {
        var dt;
        if (_.isNumber(d)) dt = d;
        if (_.isDate(d)) dt = Date.parse(d);

        switch (this.switch) {
          case "before": return dt >= this.$layerService.project.timeLine.focus;
          case "after": return dt <= this.$layerService.project.timeLine.focus;
          case "range": return dt >= this.$layerService.project.timeLine.start && dt <= this.$layerService.project.timeLine.end;
        }

      }
      return false;
    }

    public initTextFilter() {
      var filter = this.$scope.filter;
      var group = filter.group;

      var dcDim = group.ndx.dimension(d => {
        if (d.properties.hasOwnProperty(filter.property)) {
          return d.properties[filter.property];
        } else return null;
      });
      filter.dimension = dcDim;
      filter.group = group;
      this.$layerService.project.timeLine.focusDate
      dcDim.filterFunction((d: string) => {
        return this.check(d);
      });
    }

    public updateDateFilter() {
      var f = this.$scope.filter;
      if (!f.dimension) return;
      var group = f.group;

      f.dimension.filterFunction((d: string) => {
        return this.check(d);
      });


      group.filterResult = f.dimension.top(Infinity);
      this.$layerService.updateMapFilter(group);
      dc.renderAll();
    }

    public remove() {
      if (this.$scope.filter) {
        this.$layerService.removeFilter(this.$scope.filter);
      }
    }


  }
}
