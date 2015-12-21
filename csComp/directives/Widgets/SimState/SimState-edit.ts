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
    myModule.directive('simstateEdit', [function(): ng.IDirective {
        return {
            restrict: 'E',     // E = elements, other options are A=attributes and C=classes
            scope: {
            },      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
            templateUrl: 'directives/Widgets/SimState/SimState.tpl.html',
            replace: true,    // Remove the directive from the DOM
            transclude: false,   // Add elements and attributes to the template
            controller: SimStateEditCtrl
        }
    }
    ]);

    export interface ISimStateEditScope extends ng.IScope {
        vm: SimStateEditCtrl;
    }

    export class SimStateEditCtrl {
        public static $inject = [
            '$scope',
            '$http',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: ISimStateEditScope,
            private $http: ng.IHttpService,
            private messageBusService: csComp.Services.MessageBusService,
            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            //var par = <any>$scope.$parent;
            //$scope.data = <PostManEditorData>par.widget.data;
        }
    }
}
