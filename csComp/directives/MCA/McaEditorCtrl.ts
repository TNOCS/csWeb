module Mca {
    'use strict';

    import IGeoJsonFile = csComp.GeoJson.IGeoJsonFile;
    import IMetaInfo    = csComp.GeoJson.IMetaInfo;
    import IFeature     = csComp.GeoJson.IFeature;
    import IFeatureType = csComp.GeoJson.IFeatureType;

    export interface IMcaEditorScope extends ng.IScope {
        vm: McaEditorCtrl;
    }

    export interface IExtendedPropertyInfo extends csComp.GeoJson.IMetaInfo {
        isSelected?         : boolean;
        category?           : string;  
        scores?             : string;  
        scoringFunctionType?: Models.ScoringFunctionType;
    }

    export class McaEditorCtrl {
        public dataset            : IGeoJsonFile;
        public metaInfos          : Array<IExtendedPropertyInfo> = [];
        public headers            : Array<string> = [];
        public selectedFeatureType: IFeatureType;
        public mcaTitle           : string;
        public rankTitle          : string;
        public hasRank            : boolean;

        public scoringFunctions: Models.ScoringFunction[] = [];

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

            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.Ascending));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.Descending));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.AscendingSigmoid));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.DescendingSigmoid));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.GaussianPeak));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.GaussianValley));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.Manual));

            messageBusService.subscribe('layer', (title: string) => {//, layer: csComp.Services.ProjectLayer) => {
                switch (title) {
                    case 'activated':
                    case 'deactivate':
                        this.loadMapLayers();
                        break;
                }
            });

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
            this.headers   = [];
            var titles: Array<string>                = [];
            var mis   : Array<IExtendedPropertyInfo> = [];
            // Push the Name, so it always appears on top.
            mis.push({
                label                     : "Name",
                visibleInCallOut          : true,
                title                     : "Naam",
                type                      : "text",
                filterType                : "text",
                isSelected                : false,
                scoringFunctionType       : this.scoringFunctions[0].type,
            });
            if (featureType.metaInfoKeys != null) {
                var keys                  : Array<string>             = featureType.metaInfoKeys.split(';');
                keys.forEach((k)                    => {
                    if (k in this.$layerService.metaInfoData)
                        mis.push(this.$layerService.metaInfoData[k]);
                    else if (featureType.metaInfoData != null) {
                        var result                  = $.grep(featureType.metaInfoData, e => e.label === k);
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

        public isDisabled(): boolean {
            if (typeof this.mcaTitle === 'undefined' || this.mcaTitle.length === 0) return true;
            if (this.hasRank && this.rankTitle.length === 0) return true;
            if (!this.metaInfos.reduce((p,c) => { return p || c.isSelected; })) return true;
            return false;
        }

        /**
         * Create a new MCA criterion
         */
        public save() {
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

            this.metaInfos.forEach((mi) => {
                if (!mi.isSelected) return;
                var criterion         = new Models.Criterion();
                criterion.label       = mi.label;
                criterion.title       = mi.title;
                criterion.isPlaScaled = true;
                criterion.description = mi.description;
                criterion.userWeight  = 1;

                if (mi.scoringFunctionType === Models.ScoringFunctionType.Manual) {
                    criterion.scores = mi.scores;
                } else {
                    criterion.scores = Models.ScoringFunction.createScores(mi.scoringFunctionType);
                    criterion.isPlaScaled = true;
                }
                if (mi.category) {
                    var parent: Models.Criterion;
                    for (var i in mca.criteria) {
                        var c = mca.criteria[i];
                        if (c.title != mi.category) continue;
                        parent = c;
                        break;
                    }
                    if (parent == null) {
                        parent = new Models.Criterion;
                        parent.title = mi.category;
                        parent.isPlaUpdated = true;
                        mca.criteria.push(parent);
                    }
                    parent.criteria.push(criterion);
                } else {
                    mca.criteria.push(criterion);
                }               
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