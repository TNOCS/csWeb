module MarkdownWidget {
    export class MarkdownWidgetData {
        title:   string;
        content: string;
        url:     string;
    }

    export interface IMarkdownWidgetScope extends ng.IScope {
        vm  : MarkdownWidgetCtrl;
        data: MarkdownWidgetData;
    }

    export class MarkdownWidgetCtrl {
        private scope: IMarkdownWidgetScope;
        private widget: csComp.Services.IWidget;

        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope       : IMarkdownWidgetScope,
            private $timeout     : ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus  : csComp.Services.MessageBusService,
            private $mapService  : csComp.Services.MapService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <MarkdownWidgetData>this.widget.data;
            if (typeof $scope.data.url === 'undefined') return;
            $.get($scope.data.url, (data) => {
                $timeout(() => {
                    $scope.data.content = data;
                }, 0);
            });
        }


    }

}
