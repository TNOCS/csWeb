module LegendList {
    export interface ILegendItem {
        title: string;
        uri: string;
        html: string;
    }

    export interface ILegendListScope extends ng.IScope {
        vm: LegendListCtrl;
        numberOfItems: number;
        legendItems: ILegendItem[];
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
            'messageBusService',
            '$sce'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ILegendListScope,
            private $layerService: csComp.Services.LayerService,
            private $mapService: csComp.Services.MapService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $sce: ng.ISCEService
            ) {
            $scope.vm = this;

            $messageBusService.subscribe('project', (title) => {
                switch (title) {
                    case "loaded":
                        // Update the legend when a project is loaded.
                        this.updateLegendItems();
                        break;
                }
            });

            $messageBusService.subscribe('layer', (title) => {
                switch (title) {
                    case "activated":
                    case "deactivate":
                        // Update the legend when a layer is added or removed.
                        this.updateLegendItems();
                        break;
                }
            });

            this.updateLegendItems();

            $scope.legendItems = [];

            $scope.numberOfItems = 10;  // This is being reset in the directive upon receiving a resize.
        }

        // Two approaches for creating a legend can be used:
        // 1. Using the featureTypes loaded in LayerService, which is quick, but also includes items that are not on the list.
        //    Also, when deactivating the layer, items persist in the legendlist. Finally, items with an icon based on a property
        //    are only shown once (e.g., houses with energylabels).
        // 2. Second approach is to loop over all features on the map and select unique legend items. This is slower for large
        //    amounts of features, but the items in the legendlist are always complete and correct.
        // For 1. use "updateLegendItemsUsingFeatureTypes()", for 2. use "updateLegendItemsUsingFeatures()"
        private updateLegendItems() {
            this.updateLegendItemsUsingFeatures()
        }

        private updateLegendItemsUsingFeatureTypes() {
            var legendItems: Array<ILegendItem> = [];
            var existingItems: Array<String> = [];
            for (var key in this.$layerService._featureTypes) {
                var ft = this.$layerService._featureTypes[key];
                var uri = this.getImageUri(ft);
                var html = '';
                var title = this.getName(key, ft);
                var existingItem = title + uri;
                if (existingItems.indexOf(existingItem) < 0) {
                    existingItems.push(existingItem);
                    legendItems.push({ "title": title, "uri": uri, "html": html });
                }
            }
            legendItems.sort((a: ILegendItem, b: ILegendItem) => {
                if (a.title > b.title) return 1;
                if (a.title < b.title) return -1;
                return 0;
            });
            this.$scope.legendItems = legendItems;
        }

        private updateLegendItemsUsingFeatures() {
            var legendItems: Array<ILegendItem> = [];
            var existingItems: Array<String> = [];
            if (!this.$layerService.project || this.$layerService.project.features.length === 0) {
                this.$scope.legendItems = legendItems;
                return;
            }
            this.$layerService.project.features.forEach((f) => {
                var ft = f.fType;
                var uri = (ft && ft.style && ft.style.hasOwnProperty('iconUri')) ? csComp.Helpers.convertStringFormat(f, ft.style.iconUri) : this.getImageUri(ft);
                if (uri.indexOf('_Media') >= 0) f.effectiveStyle.iconUri = "cs/images/polygon.png";
                var html = csComp.Helpers.createIconHtml(f, ft)['html'];
                var title = ft.name || f.layer.title || ((ft.id) ? ft.id.split('#').pop() : 'undefined');
                var existingItem = title + uri;
                if (existingItems.indexOf(existingItem) < 0) {
                    existingItems.push(existingItem);
                    legendItems.push({ "title": title, "uri": uri, "html": html });
                }
            });
            legendItems.sort((a: ILegendItem, b: ILegendItem) => {
                if (a.title > b.title) return 1;
                if (a.title < b.title) return -1;
                return 0;
            });
            this.$scope.legendItems = legendItems;
        }


        private getImageUri(ft: csComp.Services.IFeatureType): string {
            var iconUri = ft.style.iconUri;
            if (iconUri == null) iconUri = "cs/images/marker.png";
            if (iconUri.indexOf('{') >= 0) iconUri = iconUri.replace('{', '').replace('}', '');

            if (ft.style != null && ft.style.drawingMode != null && ft.style.drawingMode.toLowerCase() != "point") {
                if (iconUri.indexOf('_Media') < 0)
                    return iconUri;
                else
                    return "cs/images/polygon.png";
            }
            else if (ft.style != null && iconUri != null) {
                return iconUri;
            }
            else {
                return "cs/images/marker.png";
            }
        }

        private getName(key: string, ft: csComp.Services.IFeatureType): string {
            return ft.name || key.split('#').pop()
        }


        public toTrusted(html: string): string {
            try {
                if (html === undefined || html === null)
                    return this.$sce.trustAsHtml(html);
                return this.$sce.trustAsHtml(html.toString());
            } catch (e) {
                console.log(e + ': ' + html);
                return '';
            }
        }
    }
}
