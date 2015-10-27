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

        /**
         * Three approaches for creating a legend can be used:
         * 1. Using the featureTypes loaded in LayerService, which is quick, but also includes items that are not on the list.
         *    Also, when deactivating the layer, items persist in the legendlist. Finally, items with an icon based on a property
         *    are only shown once (e.g., houses with energylabels).
         * 2. Second approach is to loop over all features on the map and select unique legend items. This is slower for large
         *    amounts of features, but the items in the legendlist are always complete and correct.
         * 3. Third approach is to use a legend that is defined in a featuretype. This is useful if you want to show a custom legend.
         * For 1. use "updateLegendItemsUsingFeatureTypes()", for 2. use "updateLegendItemsUsingFeatures(), for 3. use "updateLegendStatically()"
         */
        private updateLegendItems() {
            //this.updateLegendItemsUsingFeatureTypes(); // 1.
            this.updateLegendItemsUsingFeatures(); // 2.
            //this.updateLegendStatically(); // 3.
        }

        /**
         * Loops over every layer in the project. If a layer is enabled, has a typeUrl and a defaultFeatureType,
         * that corresponding featureType is acquired. When the featureType has a property 'legend' in which legenditems are defined,
         * these items are added to the legend.
         * Example definition in the FeatureType:
         * "MyFeatureType" : {
         *   "legendItems" : [{
         *     "title" : "My feature",
         *     "uri" : "images/myicon.png"
         *   }]
         * }
         */
        private updateLegendStatically() {
            var project = this.$layerService.project;
            if (!project) return;
            if (!project.hasOwnProperty('groups')) { console.log('Creating legend failed: no groups found'); return; }
            var legendItems: Array<ILegendItem> = [];
            var processedFeatureTypes = {};
            project.groups.forEach((g) => {
                if (g.hasOwnProperty('layers')) {
                    g.layers.forEach((l) => {
                        if (l.enabled && l.hasOwnProperty('typeUrl') && l.hasOwnProperty('defaultFeatureType')) {
                            var typeName = l.typeUrl + "#" + l.defaultFeatureType;
                            var fType = this.$layerService.getFeatureTypeById(typeName);
                            if (!processedFeatureTypes.hasOwnProperty(typeName) && fType && fType.hasOwnProperty('legendItems')) {
                                fType['legendItems'].forEach((i) => {
                                    legendItems.push({title: i.title, uri: i.uri || '', html: i.html || ''});
                                });
                            }
                            processedFeatureTypes[typeName] = true;
                        }
                    })
                }
            })
            this.$scope.legendItems = legendItems;
        }

        private updateLegendItemsUsingFeatureTypes() {
            var legendItems: Array<ILegendItem> = [];
            var existingItems: Array<String> = [];
            for (var key in this.$layerService._featureTypes) {
                var ft = this.$layerService._featureTypes[key];
                var uri = csComp.Helpers.getImageUri(ft);
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
                if (!ft) ft = this.$layerService.getFeatureType(f);
                var uri = (ft && ft.style && ft.style.hasOwnProperty('iconUri')) ? csComp.Helpers.convertStringFormat(f, ft.style.iconUri) : csComp.Helpers.getImageUri(ft);
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
