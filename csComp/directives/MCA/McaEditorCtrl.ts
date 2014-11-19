module Mca {
    import IGeoJsonFile = csComp.GeoJson.IGeoJsonFile;
    import IMetaInfo = csComp.GeoJson.IMetaInfo;
    import IFeature = csComp.GeoJson.IFeature;
    import ProjectLayer = csComp.Services.ProjectLayer;

    export interface IMcaEditorScope extends ng.IScope {
        vm: McaEditorCtrl;
    }

    export class McaEditorCtrl {
        public dataset: IGeoJsonFile;
        public metaInfos: Array<IMetaInfo> = [];
        public headers: Array<string> = [];

        public static $inject = [
            '$scope',
            '$modal',
            'layerService',
            'messageBusService'
        ];

        constructor(
            private $scope           : IMcaEditorScope,
            private $modal           : any,
            private $layerService    : csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService
        ) {
            $scope.vm = this;
            console.log("McaEditorCtlr");
            messageBusService.subscribe('layer', (title, layer: csComp.Services.ProjectLayer) => {
                switch (title) {
                    case 'activated':
                    case 'deactivate':
                        this.loadMapLayers();
                        break;
                }
            });

        }

        public sayHi() {
            alert('Hello ' + this.$scope.$parent);
        }

        /** 
         * Load the features as visible on the map.
         */
        private loadMapLayers(): void {
            var data: IGeoJsonFile = {
                type: '',
                features: [],
                poiTypes: {}
            };
            // If we are filtering, load the filter results
            this.$layerService.project.groups.forEach((group) => {
                if (group.filterResult != null)
                    group.filterResult.forEach((f) => data.features.push(f));
            });
            // Otherwise, take all loaded features
            if (data.features.length === 0)
                data.features = this.$layerService.project.features;

            data.features.forEach((f: IFeature) => {
                if (!(f.featureTypeName in data.poiTypes))
                    data.poiTypes[f.featureTypeName] = this.$layerService.featureTypes[f.featureTypeName];
            });

            this.dataset = data;
            this.updateMetaInfo(data);
        }

        private updateMetaInfo(data: IGeoJsonFile): void {
            this.metaInfos = [];
            this.headers = [];
            var titles: Array<string> = [];
            var mis: Array<IMetaInfo> = [];
            // Push the Name, so it always appears on top.
            mis.push({
                label: "Name",
                visibleInCallOut: true,
                title: "Naam",
                type: "text",
                filterType: "text",
                isSearchable: true
            });
            var featureType: csComp.GeoJson.IFeatureType;
            for (var key in data.poiTypes) {
                featureType = data.poiTypes[key];
                if (featureType.metaInfoKeys != null) {
                    var keys: Array<string> = featureType.metaInfoKeys.split(';');
                    keys.forEach((k) => {
                        if (k in this.$layerService.metaInfoData)
                            mis.push(this.$layerService.metaInfoData[k]);
                        else if (featureType.metaInfoData != null) {
                            var result = $.grep(featureType.metaInfoData, e => e.label === k);
                            if (result.length >= 1) mis.push(result);
                        }
                    });
                } else if (featureType.metaInfoData != null) {
                    featureType.metaInfoData.forEach((mi) => mis.push(mi));
                }
                mis.forEach((mi) => {
                    if ((mi.visibleInCallOut || mi.label === "Name") && titles.indexOf(mi.title) < 0) {
                        titles.push(mi.title);
                        this.metaInfos.push(mi);
                    }
                });
            }
            // Select the first couple of headers
            var nmbrOfDefaultSelectedHeaders = 3;
            for (var i = 0; i < nmbrOfDefaultSelectedHeaders; i++) {
                this.headers.push(titles[i]);
            }
            //this.rows = this.getRows();
        }

    }
} 