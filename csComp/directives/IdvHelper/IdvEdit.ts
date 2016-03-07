module IdvEdit {
    /**
      * Config
      */
    var moduleName = 'csComp';    

    export interface IIdvEditScope extends ng.IScope {
        vm: IdvEditCtrl;
    }
    

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

  

    export class IdvEditCtrl {
        private scope: IIdvEditScope;
        public DataLoaded: boolean;
        public eta: any;
        public incomming: any;
        public _initialized: boolean;
        public scan : Idv.Idv; 
        
        public static $inject = [
            '$scope',            
            'mapService',
            'layerService',
            'messageBusService',
        ];

       

       

        
        
        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IIdvEditScope,            
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService
        ) {
            this.scope = $scope;
            $scope.vm = this;
            this.scan = <Idv.Idv>(<any>$scope.$parent).data;
            
            console.log(this);

        }
        
        public toggleChart(chart : Idv.ChartConfig)
        {
            chart.enabled = !chart.enabled;
        }
        
        public update()
        {
            this.scan.updateCharts();
        }
        
        public reset()
        {
            alert('reset');
        }

    }

    /**
    * Directive to display the available map layers.
    */
    myModule.directive('idvedit', [
        '$window', '$compile',
        function($window, $compile): ng.IDirective {
            return {
                terminal: true,  // do not compile any other internal directives
                restrict: 'E',    // E = elements, other options are A=attributes and C=classes
                scope: {},     // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/IdvHelper/IdvEdit.tpl.html',                
                link: (scope: any, element, attrs) => {
                    // Deal with resizing the element list
                    
                },
                replace: false,    // Remove the directive from the DOM
                transclude: false,    // Add elements and attributes to the template
                controller: IdvEditCtrl
            }
        }
    ]);

}
