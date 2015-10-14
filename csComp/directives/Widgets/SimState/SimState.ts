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
        id: string;
        name: string;
        state: string,
        time: Date,
        msg?: string
    }

    export class SimStateCtrl {
        private states: { [id: string]: ISimState } = {};

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

            messageBusService.serverSubscribe('Sim.SimState.', 'key', (title: string, msg: any) => {
                if (!msg || !msg.hasOwnProperty('data') || !msg.data.hasOwnProperty('item')) return;
                //console.log(`Server subscription received: ${title}, ${JSON.stringify(msg, null, 2) }.`);
                this.$timeout(() => {
                    var state = <ISimState> msg.data.item;
                    if (state.state === 'Exit')
                        delete this.states[state.id];
                    else
                        this.states[state.id] = state;
                }, 0);
            })
        }
    }
}
