module IFrameWidget {
    /**
      * Config
      */
    var moduleName = 'csComp';

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

    /**
      * Directive to display the available map layers.
      */
    myModule.directive('iframewidgetEdit', [
        '$compile',
        function($compile): ng.IDirective {
            return {
                terminal: true,    // do not compile any other internal directives
                restrict: 'E',     // E = elements, other options are A=attributes and C=classes
                scope: {},      // isolated scope, separated from parent. Is however empty, as this directive is self contained by using the messagebus.
                templateUrl: 'directives/Widgets/IFrameWidget/IFrame-edit.tpl.html',
                replace: true,    // Remove the directive from the DOM
                transclude: true,    // Add elements and attributes to the template
                controller: IFrameEditCtrl
            }
        }
    ]);


    export interface IIFrameEditCtrl extends ng.IScope {
        vm: IFrameEditCtrl;
        data: any;
    }

    export class IFrameEditCtrl {
        private scope: IIFrameEditCtrl;
        public widget: csComp.Services.IWidget;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$sce'

        ];

        constructor(
            private $scope: IIFrameEditCtrl,
            private $sce: any
            ) {

            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = <csComp.Services.IWidget>par.data;
            $scope.data = <any>this.widget.data;
            this.update();


        }

        public update() {
            this.$scope.data._safeurl = this.$sce.trustAsResourceUrl(this.$scope.data.url);
        }

    }
}
