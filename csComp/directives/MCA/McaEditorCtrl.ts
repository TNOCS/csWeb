module Mca {
    'use strict';

    import IFeature      = csComp.Services.IFeature;
    import IFeatureType  = csComp.Services.IFeatureType;
    import IGeoJsonFile  = csComp.Services.IGeoJsonFile;

    export interface IMcaEditorScope extends ng.IScope {
        vm: McaEditorCtrl;
    }

    export interface IExtendedPropertyInfo extends csComp.Services.IPropertyType {
        isSelected?         : boolean;
        category?           : string;  
        scores?             : string;  
        scoringFunctionType?: Models.ScoringFunctionType;
        /** The data is considered invalid when below this value */
        minCutoffValue?     : number;
        /** The data is considered invalid when above this value */
        maxCutoffValue?     : number;
        userWeight?         : number;
    }

    export class McaEditorCtrl {
        dataset            : IGeoJsonFile;
        propInfos          : Array<IExtendedPropertyInfo> = [];
        headers            : Array<string> = [];
        selectedFeatureType: IFeatureType;
        mcaTitle           : string;
        rankTitle          : string;
        scoringFunctions   : Models.ScoringFunction[] = [];

        showItem           : number;
        scaleMax           : number;
        scaleMin           : number;


        static $inject = [
            '$scope',
            '$modalInstance',
            'layerService',
            '$translate',
            'messageBusService',
            'mca'
        ];

        constructor(
            private $scope           : IMcaEditorScope,
            private $modalInstance   : any,
            private $layerService    : csComp.Services.LayerService,
            private $translate       : ng.translate.ITranslateService,
            private messageBusService: csComp.Services.MessageBusService,
            private mca?             : Models.Mca
        ) {
            $scope.vm = this;

            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.Ascending));
            //this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.Descending));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.AscendingSigmoid));
            //this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.DescendingSigmoid));
            this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.GaussianPeak));
            //this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.GaussianValley));
            //this.scoringFunctions.push(new Models.ScoringFunction(Models.ScoringFunctionType.Manual));

            $translate('MCA.LINEAR').then(translation => {
                this.scoringFunctions[0].title = translation;
            });
            $translate('MCA.SIGMOID').then(translation => {
                this.scoringFunctions[1].title = translation;
            });
            $translate('MCA.GAUSSIAN').then(translation => {
                this.scoringFunctions[2].title = translation;
            });

            this.dataset = csComp.Helpers.loadMapLayers(this.$layerService);

            messageBusService.subscribe('layer',() => {
                this.dataset = csComp.Helpers.loadMapLayers(this.$layerService);
            });

            this.mcaTitle            = mca.title;
            this.rankTitle           = mca.rankTitle;
            this.scaleMin            = mca.scaleMinValue;
            this.scaleMax            = mca.scaleMaxValue;
            this.selectedFeatureType = mca.featureIds.length === 0 ? '' : this.dataset.featureTypes[mca.featureIds[0]];
            if (this.selectedFeatureType) {
                this.updatePropertyInfo(this.selectedFeatureType);
                this.updatePropertyInfoUponEdit(mca);
            } else {
                this.selectFirstFeatureType();
            }
        }

        private updatePropertyInfoUponEdit(criterion: Models.Criterion, category?: string) {
            criterion.criteria.forEach((c) => {
                if (c.label) {
                    var propInfos = this.propInfos;
                    for (var i in propInfos) {
                        if (!propInfos.hasOwnProperty(i)) continue;
                        var mi = propInfos[i];
                        if (mi.label !== c.label) continue;
                        mi.isSelected = true;
                        mi.minCutoffValue = c.minCutoffValue;
                        mi.maxCutoffValue = c.maxCutoffValue;
                        mi.minValue       = c.minValue;
                        mi.maxValue       = c.maxValue;
                        mi.userWeight     = c.userWeight;
                        if (category) {
                            mi.category = category;
                        }
                        break;
                    }
                } else {
                    this.updatePropertyInfoUponEdit(c, c.title);
                }
            });
        }

        loadPropertyTypes() {
            this.updatePropertyInfo(this.selectedFeatureType);
        }

        ///** 
        // * Load the features as visible on the map.
        // */
        //private loadMapLayers(): void {
        //    var data         : IGeoJsonFile = {
        //        type         : '',
        //        features     : [],
        //        featureTypes : {}
        //    };
        //    // If we are filtering, load the filter results
        //    this.$layerService.project.groups.forEach((group) => {
        //        if (group.filterResult != null)
        //            group.filterResult.forEach((f) => data.features.push(f));
        //    });
        //    // Otherwise, take all loaded features
        //    if (data.features.length === 0)
        //        data.features = this.$layerService.project.features;

        //    data.features.forEach((f: IFeature) => {
        //        if (!(data.featureTypes.hasOwnProperty(f.featureTypeName))) {
        //            var featureType = data.featureTypes[f.featureTypeName];
        //            if (!featureType.name) featureType.name = f.featureTypeName.replace('_Default', '');
        //            data.featureTypes[f.featureTypeName] = featureType;
        //        }
        //    });

        //    this.dataset = data;
        //}

        private selectFirstFeatureType() {
            var featureTypes = this.dataset.featureTypes;
            for (var key in featureTypes) {
                if (!featureTypes.hasOwnProperty(key)) continue;
                this.selectedFeatureType = featureTypes[key];
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
                label               : 'Name',
                visibleInCallOut    : true,
                title               : 'Naam',
                type                : 'text',
                filterType          : 'text',
                isSelected          : false,
                scoringFunctionType : this.scoringFunctions[0].type
            });
            if (featureType.propertyTypeKeys != null) {
                var keys = featureType.propertyTypeKeys.split(/[,;]+/);
                keys.forEach((k) => {
                    if (this.$layerService.propertyTypeData.hasOwnProperty(k))
                        pis.push(this.$layerService.propertyTypeData[k]);
                    else if (featureType._propertyTypeData != null) {
                        var result = $.grep(featureType._propertyTypeData, e => e.label === k);
                        if (result.length >= 1) pis.push(result);
                    }
                });
            } else if (featureType._propertyTypeData != null) {
                featureType._propertyTypeData.forEach((mi) => pis.push(mi));
            }
            pis.forEach((pi) => {
                // TODO Later, we could also include categories and not only numbers, where each category represents a certain value.
                if (pi.visibleInCallOut && pi.type === 'number' && pi.label.indexOf('mca_') < 0 && titles.indexOf(pi.title) < 0) {
                    titles.push(pi.title);
                    // Clone object inline. See http://stackoverflow.com/a/122704/319711
                    this.propInfos.push({
                        title       : pi.title,
                        label       : pi.label,
                        stringFormat: pi.stringFormat,
                        isSelected  : false,
                        maxValue    : pi.maxValue,
                        minValue    : pi.minValue,
                        defaultValue: pi.defaultValue,
                        description : pi.description
                    }); 
                }
            });
        }

        toggleSelection(metaInfoTitle: string) {
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

        isDisabled(): boolean {
            if (typeof this.mcaTitle === 'undefined' || this.mcaTitle.length === 0) return true;
            if (this.propInfos.length === 0 || !this.propInfos.reduce((p,c) => { return p || c.isSelected; })) return true;
            return false;
        }

        /**
         * Create a new MCA criterion
         */
        save() {
            var mca             = new Models.Mca();
            mca.title           = this.mcaTitle || 'New MCA criterion';
            mca.label           = 'mca_' + mca.title.replace(' ', '_');
            mca.stringFormat    = '{0:0.0}';
            if (this.rankTitle) {
                mca.rankTitle   = this.rankTitle || 'Rank';
                mca.rankFormat  = '{0} / {1}';
            }
            if (this.scaleMin && this.scaleMax) {
                mca.scaleMinValue = this.scaleMin;
                mca.scaleMaxValue = this.scaleMax;
            }
            mca.userWeightMax = 5;
            var featureTypes = this.dataset.featureTypes;
            for (var key in featureTypes) {
                if (!featureTypes.hasOwnProperty(key)) continue;
                if (featureTypes[key] === this.selectedFeatureType)
                    mca.featureIds = [key];
            }

            this.propInfos.forEach((mi) => {
                if (!mi.isSelected) return;
                var criterion         = new Models.Criterion();
                criterion.label       = mi.label;
                criterion.title       = mi.title;
                criterion.isPlaScaled = true;
                criterion.description = mi.description;
                criterion.userWeight  = mi.userWeight || 1;

                criterion.minCutoffValue = mi.minCutoffValue ? +mi.minCutoffValue : undefined;
                criterion.maxCutoffValue = mi.maxCutoffValue ? +mi.maxCutoffValue : undefined;
                criterion.minValue       = mi.minValue ? +mi.minValue : undefined;
                criterion.maxValue       = mi.maxValue ? +mi.maxValue : undefined;

                if (mi.scoringFunctionType === Models.ScoringFunctionType.Manual) {
                    criterion.scores = mi.scores;
                } else {
                    criterion.scores = Models.ScoringFunction.createScores(mi.scoringFunctionType);
                }
                if (mi.category) {
                    var parent: Models.Criterion;
                    for (var i in mca.criteria) {
                        if (!mca.criteria.hasOwnProperty(i)) continue;
                        var c = mca.criteria[i];
                        if (c.title !== mi.category) continue;
                        parent = c;
                        break;
                    }
                    if (parent == null) {
                        parent              = new Models.Criterion;
                        parent.title        = mi.category;
                        parent.isPlaUpdated = false;
                        mca.criteria.push(parent);
                    }
                    parent.criteria.push(criterion);
                } else {
                    mca.criteria.push(criterion);
                }               
            });
            this.$modalInstance.close(mca);
        }

        cancel() {
            this.mcaTitle  = '';
            this.rankTitle = '';
            this.headers   = [];
            this.$modalInstance.dismiss('cancel');
        }

        toggleItemDetails(index: number) {
            this.showItem = this.showItem == index ? -1 : index;
        }

    }
} 