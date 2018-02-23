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

    /**
     * Directive (editor) for the button widget.
     */
    myModule.directive('buttonwidgetEdit', [function() : ng.IDirective {
            return {
                restrict   : 'E',     // E = elements, other options are A=attributes and C=classes
                scope      : {
                },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Widgets/ButtonWidget/ButtonWidget-edit.tpl.html',
                replace      : true,    // Remove the directive from the DOM
                transclude   : false,   // Add elements and attributes to the template
                controller   : ButtonWidgetEditCtrl
            };
        }
    ]);

    export interface IButtonWidgetMessage {
        name: string;
        httpMethod: {name: string};
        url: string;
        message: string;
        description: string;
    }

    export interface ButtonWidgetEditorData {
        messages: IButtonWidgetMessage[];
        /** Set to true to show a smaller widget, with only the messages and an execute button */
        smallSize: boolean;
    }

    export interface IButtonWidgetEditScope extends ng.IScope {
        vm: ButtonWidgetEditCtrl;
        selectedMessage: IButtonWidgetMessage;
        data: ButtonWidgetEditorData;
        methods: {name: string}[];
    }

    export class ButtonWidgetEditCtrl {
        private scope: IButtonWidgetEditScope;
        public widget: csComp.Services.IWidget;

        // $inject annotation.
        public static $inject = [
            '$scope',
            '$timeout',
            'messageBusService',
            'dashboardService'
        ];

        constructor(
            private $scope: IButtonWidgetEditScope,
            private $timeout: ng.ITimeoutService,
            private $messageBus: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
            ) {
            $scope.vm = this;
            $scope.methods = [
                { name: 'GET'},
                { name: 'PUT'},
                { name: 'POST'},
                { name: 'DELETE'}
            ];
            var par = <any>$scope.$parent;
            this.widget = <csComp.Services.IWidget>par.data;
            $scope.data = <ButtonWidgetEditorData>this.widget.data;
            if (!$scope.data.messages) {
                $scope.data.messages = [];
                this.addMessage();
            } else {
                $scope.selectedMessage = $scope.data.messages[0];
            }
        }

        public addMessage() {
            this.$scope.selectedMessage = <IButtonWidgetMessage> {
                name: 'New message...',
                httpMethod: this.$scope.methods[2]
            };
            this.$scope.data.messages.push(this.$scope.selectedMessage);
        }

        public deleteMessage() {
            if (!this.$scope.selectedMessage) return;
            var index = this.$scope.data.messages.indexOf(this.$scope.selectedMessage);
            if (index < 0) return;
            this.$scope.data.messages.slice(index, 1);
            if (this.$scope.data.messages.length === 0)
                this.addMessage();
            else
                this.$scope.selectedMessage = this.$scope.data.messages[0];
        }
    }
}
