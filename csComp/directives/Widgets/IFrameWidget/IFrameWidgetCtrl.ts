module IFrameWidget {
    export class IFrameWidgetData {
        title: string;
        url: string;
        _safeurl: string;
    }

    export interface IIFrameWidgetScope extends ng.IScope {
        vm: IFrameWidgetCtrl;
        data: IFrameWidgetData;
    }

    export class IFrameWidgetCtrl {
        private scope: IIFrameWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;

        public static $inject = [
            '$scope',
            '$sce'
        ];

        constructor(
            private $scope: IIFrameWidgetScope,
            private $sce: any
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <IFrameWidgetData>this.widget.data;
        }


        public update() {
            this.$scope.data._safeurl = this.$sce.trustAsResourceUrl(this.$scope.data.url);
        }


    }

}
