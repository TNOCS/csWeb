module SimState {
    /** Config */
    var moduleName = 'csComp';

    /** Module */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    /** Directive to send a message to a REST endpoint. Similar in goal to the Chrome plugin POSTMAN. */
    myModule.directive('simstate', [function(): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/SimState/SimState.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: SimStateCtrl
        }
    }
    ]);


    export interface ISimStateScope extends ng.IScope {
        vm: SimStateCtrl;
    }

    export interface ISimState {
        name: string;
        status: string;
    }

    export class SimStateCtrl {
        private states: ISimState[] = [];

        public static $inject = [
            '$scope',
            '$http',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: ISimStateScope,
            private $http: ng.IHttpService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            //var par = <any>$scope.$parent;
            //$scope.data = <PostManEditorData>par.widget.data;

            messageBusService.serverSubscribe('Sim.SimState', 'key', (title: string, data: any) => {
                console.log(`Server subscription received: ${title}, ${JSON.stringify(data, null, 2) }.`);
                
                //if (!data || !data.hasOwnProperty('data') || !data.data.hasOwnProperty('keyId') || !data.data.hasOwnProperty('item') || !data.data.item || data.data.keyId.indexOf('SimTime/') < 0) return;
                // this.$timeout(() => {
                //     this.time = new Date(data.data.item);
                //     console.log(`TIME: ${this.time}`);
                // }, 0);
            })

        }

    }
}
