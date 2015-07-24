module StyleList {
    export interface IStyleListScope extends ng.IScope {
        vm: StyleListCtrl;
    }

    export class StyleListCtrl {
        private scope: IStyleListScope;

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope       : IStyleListScope,
            private $layerService: csComp.Services.LayerService
            ) {
            $scope.vm = this;
        }

        getStyle(legend: csComp.Services.Legend, le: csComp.Services.LegendEntry, key: number) {
            return {
                'float': 'left',
                'position': 'relative',
                'top': '10px',
                'background': `linear-gradient(to bottom, ${le.color}, ${legend.legendEntries[legend.legendEntries.length-key-2].color})`
            }
        }

    }
}
