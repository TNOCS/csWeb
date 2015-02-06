module LegendList {
    export interface ILegendItem {
        title: string;
        uri : string;
    }

    export interface ILegendListScope extends ng.IScope {
        vm           : LegendListCtrl;
        numberOfItems: number;
        legendItems  : ILegendItem[];
    }

    export class LegendListCtrl {
        // $inject annotation.   
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'mapService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector 
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope            : ILegendListScope,
            private $layerService     : csComp.Services.LayerService,
            private $mapService       : csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;
            
            $messageBusService.subscribe('project', () => {
                // Update the legend when a project is loaded.
                this.updateLegendItems();
            });

            $messageBusService.subscribe('layer', () => {
                // Update the legend when a layer is added or removed.
                this.updateLegendItems();
            });

            this.updateLegendItems();

            $scope.legendItems = [];

            $scope.numberOfItems = 10;  // This is being reset in the directive upon receiving a resize.
        }

        private updateLegendItems() {
            var legendItems: Array<ILegendItem> = [];
            var existingItems: Array<String>    = [];
            for (var key in this.$layerService.featureTypes) {
                var ft           = this.$layerService.featureTypes[key];
                var uri          = this.getImageUri(ft);
                var title        = this.getName(key, ft);
                var existingItem = name + uri;
                if (existingItems.indexOf(existingItem) < 0) {
                    existingItems.push(existingItem);
                    legendItems.push({ "title": title, "uri": uri });
                }
            }
            legendItems.sort((a: ILegendItem, b: ILegendItem) => {
                if (a.title > b.title) return 1;
                if (a.title < b.title) return -1;
                return 0;
            });
            this.$scope.legendItems = legendItems;
        }

        private getImageUri(ft: csComp.Services.IFeatureType): string {
            var iconUri = ft.style.iconUri;
            if (iconUri.indexOf('{') >= 0) iconUri = iconUri.replace('{', '').replace('}', '');
            
            if (ft.style != null && ft.style.drawingMode!=null && ft.style.drawingMode.toLowerCase() != "point") {
                if (iconUri && iconUri.indexOf('_Media') < 0)
                    return iconUri;
                else
                    return "includes/images/polygon.png";
            }
            else if (ft.style != null && iconUri != null) {
                return iconUri;
            }
            else {
                return "includes/images/marker.png";
            }
        }

        private getName(key: string, ft: csComp.Services.IFeatureType): string {
            return ft.name || key.replace('_Default', '');
        }

    }
} 