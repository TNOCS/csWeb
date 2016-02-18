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
        data: IButtonData;
    }

    export interface IButtonWidget {
        id: string;
        name: string;
    }

    export interface IButtonData {
        title: string;
        action: string;
        layer: string;

    }

    export class ButtonWidgetCtrl {

        public disabled = false;
        public active = false;

        public static $inject = [
            '$scope',
            '$http',
            'layerService',
            'messageBusService',
            '$timeout'
        ];

        constructor(
            private $scope: IButtonWidgetScope,
            private $http: ng.IHttpService,
            public layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,

            private $timeout: ng.ITimeoutService
        ) {
            $scope.vm = this;

            var par = <any>$scope.$parent;
            $scope.data = <IButtonData>par.widget.data;

            switch ($scope.data.action) {
                case "Activate Layer":
                    this.checkLayer($scope.data.layer);
                    this.messageBusService.subscribe("layer", (a, l) => this.checkLayer($scope.data.layer));
                    break;
            }
        }

        private checkLayer(layerId: string) {
            var pl = this.layerService.findLayer(layerId);
            if (typeof pl !== 'undefined') {
                this.disabled = false;
                this.active = pl.enabled;
            }
            else {
                this.disabled = true;
            }
        }

        public click() {
            switch (this.$scope.data.action) {
                case "Activate Layer":
                    var pl = this.layerService.findLayer(this.$scope.data.layer);
                    if (typeof pl !== 'undefined') {                        
                        this.layerService.addLayer(pl);
                        pl.enabled = true;
                    }
                    break;
            }

        }
    }
}
