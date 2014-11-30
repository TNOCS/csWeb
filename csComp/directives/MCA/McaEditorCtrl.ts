module Mca {
    'use strict';

    import Feature       = csComp.Services.Feature;
    import IFeature      = csComp.Services.IFeature;
    import IFeatureType  = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;
    import IGeoJsonFile  = csComp.Services.IGeoJsonFile;

    export interface IMcaEditorScope extends ng.IScope {
        vm: McaEditorCtrl;
    }

    export interface IExtendedPropertyInfo extends csComp.Services.IPropertyType {
        isSelected?         : boolean;
        hasCategory?        : boolean;
        category?           : string;  
        scores?             : string;  
        scoringFunctionType?: Models.ScoringFunctionType;
    }

    export class McaEditorCtrl {
        public dataset            : IGeoJsonFile;
        public propInfos          : Array<IExtendedPropertyInfo> = [];
        public headers            : Array<string> = [];
        public selectedFeatureType: IFeatureType;
        public mcaTitle           : string;
        public rankTitle          : string;
        public hasRank            : boolean;

        public scoringFunctions   : Models.ScoringFunction[] = [];

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

            messageBusService.subscribe('mca', (title: string, data: { mca: Models.Mca }) => {
                switch (title) {
                    case 'edit':
                        var mca                  = data.mca;
                        this.mcaTitle            = mca.title;
                        this.rankTitle           = mca.rankTitle;
                        this.hasRank             = this.rankTitle != '';
                        this.selectedFeatureType = this.dataset.featureTypes[mca.featureIds[0]];
                        this.updatePropertyInfo(this.selectedFeatureType);
                        this.updatePropertyInfoUponEdit(mca);
                        break;
                    case 'create':
                        this.mcaTitle            = '';
                        this.rankTitle           = '';
                        this.hasRank             = false;
                        this.selectedFeatureType = null;
                        this.loadMapLayers();
                        break;
                }
            });
        }

        private updatePropertyInfoUponEdit(criterion: Models.Criterion, category?: string) {
            criterion.criteria.forEach((c) => {
                if (c.label) {
                    for (var i in this.propInfos) {
                        var mi = this.propInfos[i];
                        if (mi.label != c.label) continue;
                        mi.isSelected = true;
                        if (category) {
                            mi.hasCategory = true;
                            mi.category    = category;
                        }
                        break;
                    }
                } else {
                    this.updatePropertyInfoUponEdit(c, c.title);
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
            var data         : IGeoJsonFile = {
                type         : '',
                features     : [],
                featureTypes : {}
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
                if (!(data.featureTypes.hasOwnProperty(f.featureTypeName)))
                    data.featureTypes[f.featureTypeName] = this.$layerService.featureTypes[f.featureTypeName];
            });

            this.dataset = data;
            for (var key in data.featureTypes) {
                this.selectedFeatureType = data.featureTypes[key];
                this.updatePropertyInfo(this.selectedFeatureType);
                return;
            }
        }

        private updatePropertyInfo(featureType: IFeatureType): void {
            this.propInfos = [];
            this.headers   = [];
            var titles: Array<string>                = [];
            var pis   : Array<IExtendedPropertyInfo> = [];
            // Push the Name, so it always appears on top.
            pis.push({
                label               : "Name",
                visibleInCallOut    : true,
                title               : "Naam",
                type                : "text",
                filterType          : "text",
                isSelected          : false,
                scoringFunctionType : this.scoringFunctions[0].type,
            });
            if (featureType.propertyTypeKeys != null) {
                var keys : Array<string> = featureType.propertyTypeKeys.split(';');
                keys.forEach((k) => {
                    if (this.$layerService.propertyTypeData.hasOwnProperty(k))
                        pis.push(this.$layerService.propertyTypeData[k]);
                    else if (featureType.propertyTypeData != null) {
                        var result = $.grep(featureType.propertyTypeData, e => e.label === k);
                        if (result.length >= 1) pis.push(result);
                    }
                });
            } else if (featureType.propertyTypeData != null) {
                featureType.propertyTypeData.forEach((mi) => pis.push(mi));
            }
            pis.forEach((pi) => {
                // TODO Later, we could also include categories and not only numbers, where each category represents a certain value.
                if (pi.visibleInCallOut && pi.type === 'number' && pi.label.indexOf("mca_") < 0 && titles.indexOf(pi.title) < 0) {
                    titles.push(pi.title);
                    this.propInfos.push(pi);
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
            if (this.hasRank && this.rankTitle && this.rankTitle.length === 0) return true;
            if (this.propInfos.length === 0 || !this.propInfos.reduce((p,c) => { return p || c.isSelected; })) return true;
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
            for (var key in this.dataset.featureTypes) {
                if (this.dataset.featureTypes[key] === this.selectedFeatureType)
                    mca.featureIds = [key];
            }

            this.propInfos.forEach((mi) => {
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
                        parent.isPlaUpdated = false;
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