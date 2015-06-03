module GroupEdit {

  export interface IGroupEditScope extends ng.IScope {
    vm: GroupEditCtrl;
    group : csComp.Services.ProjectGroup;
  }

  export class GroupEditCtrl {
    private scope: IGroupEditScope;

    public noLayerSelected : boolean = true;


    // $inject annotation.
    // It provides $injector with information about dependencies to be injected into constructor
    // it is better to have it close to the constructor, because the parameters must match in count and type.
    // See http://docs.angularjs.org/guide/di
    public static $inject = [
      '$scope',
      'mapService',
      'layerService',
      'messageBusService',
      'dashboardService'
    ];

    // dependencies are injected via AngularJS $injector
    // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
    constructor(
      private $scope: IGroupEditScope,
      private $mapService: csComp.Services.MapService,
      private $layerService: csComp.Services.LayerService,
      private $messageBusService: csComp.Services.MessageBusService,
      private $dashboardService: csComp.Services.DashboardService
      ) {
      this.scope = $scope;
      $scope.vm = this;
      $scope.group = $scope.$parent["data"];
      console.log($scope.group);
      this.updateLayers();
      this.$messageBusService.subscribe('layer',()=>{
        this.updateLayers();
      });
    }

    public updateLayers()
    {
      this.noLayerSelected = this.$scope.group.layers.some((l : csComp.Services.ProjectLayer)=>l.enabled);
      //console.log("selected " + this.noLayerSelected)
      //this.$scope.group.oneLayerActive
    }

    public addLayer()
    {

    }

    public toggleClustering()
    {
      console.log('toggle clustering');
    }





  }
}
