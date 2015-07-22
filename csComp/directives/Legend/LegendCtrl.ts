module Legend {
    // created 12 May 2015, RPS, TNO
    // TODO1: decide how to determine which legend (from which layer) shows up immediately after loading
    // currently the last added layer shows up which is the netatmo layer in csMapUS.
    // And after a reload (refresh), the one for the current indicator's layer shows up
    // TODO2: disappear when empty -> reopen legend for the most recently activated layer that is still active
    // TODO3: positioning: from bottom up (using "bottom" in the project.json file didn't work)
    // TODO4: provide possibility to not show a legend at all. Either by a hide button (but how to show then)
    // or via a project/user setting

    export class LegendData {
        propertyTypeKey: string;
        mode: string;
    }

    export interface ILegendDirectiveScope extends ng.IScope {
        vm: LegendCtrl;
        //title: string;
        //timestamp: string;
        //s1: string;
        //s2: string;
        //s3: string;
        data: LegendData;
        legend: csComp.Services.Legend;
    }

    export class LegendCtrl {
        private scope: ILegendDirectiveScope;

        private widget: csComp.Services.IWidget;

        private passcount: number = 1;

        // $inject annotation
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
            private $scope: ILegendDirectiveScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = (par.widget);
            //console.log(JSON.stringify(this.widget.data));
            //$scope.title = this.widget.title;
            //$scope.timestamp = '19:45';
            $scope.data = <LegendData>this.widget.data;
            //$scope.s1 = $scope.data.propertyTypeKey;
            var ptd = this.$layerService.propertyTypeData[$scope.data.propertyTypeKey];
            //if (ptd) $scope.s2 = ptd.title;
            //$scope.s3 = 'passcount=' + this.passcount.toString();

            this.$messageBus.subscribe("updatelegend", (title: string, ptdataKey: string) => {
                //this.passcount++;
                //$scope.s3 = 'passcount=' + this.passcount.toString();
                //$scope.s1 = title;
                //$scope.s2 = ptdataKey;
                //var ptd = this.$layerService.project.propertyTypeData[ptdataKey];
                if (ptd && ptd.legend) {
                    //$scope.s3 = ptd.legend.description;
                    $scope.legend = ptd.legend;
                }
            });
        }
    }
}
