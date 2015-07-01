module KanbanColumn {
    export interface IKanbanBoardScope extends ng.IScope {
        vm: KanbanBoardCtrl;
    }

    export class KanbanConfig {
        columns: Column[];
    }


    export class KanbanBoardCtrl {
        private scope: IKanbanBoardScope;
        public feeds: csComp.Services.Feed[] = [];

        public kanban: KanbanColumn.KanbanConfig;

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
            private $scope: IKanbanBoardScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.kanban = par.widget.data;
            console.log('init board');
        }
    }
}
