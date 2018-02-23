module PostMan {
    export interface IPostManMessage {
        name: string;
        httpMethod: {name: string};
        url: string;
        message: string;
        description: string;
    }

    export interface PostManEditorData {
        messages: IPostManMessage[];
        /** Set to true to show a smaller widget, with only the messages and an execute button */
        smallSize: boolean;
    }

    export interface IPostManEditScope extends ng.IScope {
        vm: PostManEditCtrl;
        selectedMessage: IPostManMessage;
        data: PostManEditorData;
        methods: {name: string}[];
    }

    export class PostManEditCtrl {
        private scope: IPostManEditScope;
        public widget: csComp.Services.IWidget;

        // $inject annotation.
        public static $inject = [
            '$scope',
            '$timeout',
            'messageBusService',
            'dashboardService'
        ];

        constructor(
            private $scope: IPostManEditScope,
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
            $scope.data = <PostManEditorData>this.widget.data;
            if (!$scope.data.messages) {
                $scope.data.messages = [];
                this.addMessage();
            } else {
                $scope.selectedMessage = $scope.data.messages[0];
            }
        }

        public addMessage() {
            this.$scope.selectedMessage = <IPostManMessage> {
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
