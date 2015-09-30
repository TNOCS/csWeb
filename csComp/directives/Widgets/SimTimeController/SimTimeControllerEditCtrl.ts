module SimTimeController {
    export interface SimTimeControllerEditorData {
        httpMethod: {name: string};
        url: string;
        message: string;
    }

    export interface ISimTimeControllerEditCtrl extends ng.IScope {
        vm: SimTimeControllerEditCtrl;
        data: SimTimeControllerEditorData;
        methods: [{name: string}];
    }

    export class SimTimeControllerEditCtrl {
        private scope: ISimTimeControllerEditCtrl;
        public widget: csComp.Services.IWidget;
        editor: any;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$timeout',
            'messageBusService',
            'dashboardService'
        ];

        constructor(
            private $scope: ISimTimeControllerEditCtrl,
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
            $scope.data = <SimTimeControllerEditorData>this.widget.data;
            $scope.data.httpMethod = $scope.methods[2];
        }

    }
}
