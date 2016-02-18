module ButtonWidget {
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
    myModule.directive('buttonwidget', [function(): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/ButtonWidget/ButtonWidget.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: ButtonWidgetCtrl
        }
    }
    ]);

    export interface IButtonWidgetScope extends ng.IScope {
        vm: ButtonWidgetCtrl;
    }

    export interface IButtonWidget {
        id: string;
        name: string;
        state: string;
        time: Date;
        msg?: string;
    }

    export class ButtonWidgetCtrl {
        private states: { [id: string]: IButtonWidget } = {};

        public static $inject = [
            '$scope',
            '$http',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: IButtonWidgetScope,
            private $http: ng.IHttpService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            messageBusService.serverSubscribe('Sim.ButtonWidget.', 'key', (title: string, msg: any) => {
                if (!msg || !msg.hasOwnProperty('data') || !msg.data.hasOwnProperty('item')) return;
                //console.log(`Server subscription received: ${title}, ${JSON.stringify(msg, null, 2) }.`);
                this.$timeout(() => {
                    var state = <IButtonWidget> msg.data.item;
                    if (state.state === 'Exit')
                        delete this.states[state.id];
                    else
                        this.states[state.name] = state; // Although id would be better, we could end up with the remains of restarted services.
                }, 0);
            })
        }
    }
}
