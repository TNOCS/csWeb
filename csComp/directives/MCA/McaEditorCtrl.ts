module Mca {
    'use strict';

    import IGeoJsonFile = csComp.GeoJson.IGeoJsonFile;
    import IMetaInfo    = csComp.GeoJson.IMetaInfo;
    import IFeature     = csComp.GeoJson.IFeature;
    import IFeatureType = csComp.GeoJson.IFeatureType;

    export interface IMcaEditorScope extends ng.IScope {
        vm: McaEditorCtrl;
    }

    export class McaEditorCtrl {
        public dataset            : IGeoJsonFile;
        public metaInfos          : Array<IMetaInfo> = [];
        public headers            : Array<string> = [];
        public selectedFeatureType: IFeatureType;
        public mcaTitle           : string;
        public rankTitle          : string;
        public hasRank            : boolean;

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
            messageBusService.subscribe('layer', (title: string, layer: csComp.Services.ProjectLayer) => {
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

        public loadPropertyTypes() {
            console.log("loadPropertyTypes");
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
            for (var key in data.poiTypes) {
                this.selectedFeatureType = data.poiTypes[key];
                this.updateMetaInfo(this.selectedFeatureType);
                return;
            }
        }

        private updateMetaInfo(featureType: IFeatureType): void {
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
                // TODO Later, we could also include categories and not only numbers, where each category represents a certain value.
                if (mi.visibleInCallOut && mi.type === 'number' && mi.label.indexOf("mca_") < 0 && titles.indexOf(mi.title) < 0) {
                    titles.push(mi.title);
                    this.metaInfos.push(mi);
                }
            });
        }

        public toggleSelection(metaInfoTitle: string) {
            var idx = this.headers.indexOf(metaInfoTitle);
            // is currently selected
            if (idx > -1) {
                this.headers.splice(idx, 1);
            }
            // is newly selected
            else {
                this.headers.push(metaInfoTitle);
            }
        }

        /**
         * Create a new MCA criterion
         */
        public ok() {
            console.log("McaEditorCtrl says OK");

            var mca             = new Models.Mca();
            mca.title           = this.mcaTitle || 'New MCA criterion';
            mca.label           = 'mca_' + mca.title.replace(' ', '_');
            mca.stringFormat    = '{0:0.0}';
            if (this.hasRank) {
                mca.rankTitle   = this.rankTitle || 'Rank';
                mca.rankFormat  = '{0} / {1}';
            }
            mca.userWeightMax = 5;
            for (var key in this.dataset.poiTypes) {
                if (this.dataset.poiTypes[key] === this.selectedFeatureType)
                    mca.featureIds = [key];
            }

            var meta: Array<IMetaInfo> = [this.headers.length];
            this.metaInfos.forEach((mi: IMetaInfo) => {
                // Keep headers and mi in the right order
                var index = this.headers.indexOf(mi.title);
                if (index >= 0) meta[index] = mi;
            });

            meta.forEach((mi) => {
                var criterion         = new Models.Criterion();
                criterion.label       = mi.label;
                criterion.title       = mi.title;
                criterion.description = mi.description;
                criterion.scores      = '[0,0 20,1]';
                criterion.userWeight  = 1;
                mca.criteria.push(criterion);               
            });
            this.messageBusService.publish('mca', 'add', { mca: mca });
        }

        public cancel() {
            this.mcaTitle = '';
            this.hasRank = false;
            this.rankTitle = '';
            this.headers = [];
        }
    }
} 