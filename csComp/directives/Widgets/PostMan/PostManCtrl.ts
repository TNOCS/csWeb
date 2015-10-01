module PostMan {
    export interface IPostManScope extends ng.IScope {
        vm: PostManCtrl;
        data: PostManEditorData;
        selectedMessage: IPostManMessage;
    }

    export class PostManCtrl {
        private result: string;

        public static $inject = [
            '$scope',
            '$http',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: IPostManScope,
            private $http: ng.IHttpService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            $scope.data = <PostManEditorData>par.widget.data;

            if ($scope.data.messages) {
                $scope.selectedMessage = $scope.data.messages[0];
            }
        }

        public execute() {
            if (!this.$scope.selectedMessage) return;
            var msg = this.$scope.selectedMessage;
            this.result = '';
            switch (msg.httpMethod.name.toUpperCase()) {
                case 'POST':
                    this.$http.post(msg.url, msg.message)
                        .success(() => { this.result = 'OK' })
                        .error((err) => { this.result = `Error: ${err}` });
                    break;
                case 'PUT':
                    this.$http.put(msg.url, msg.message)
                        .success(() => { this.result = 'OK' })
                        .error((err) => { this.result = `Error: ${err}` });
                    break;
                case 'GET':
                    this.$http.get(msg.url, msg.message)
                        .success((data) => { this.result = `Result: ${data}` })
                        .error((err) => { this.result = `Error: ${err}` });
                    break;
                case 'DELETE':
                    this.$http.delete(msg.url, msg.message)
                        .success(() => { this.result = 'OK' })
                        .error((err) => { this.result = `Error: ${err}` });
                    break;
            }
        }
    }
}
