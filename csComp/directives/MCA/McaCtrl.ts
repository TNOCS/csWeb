module Mca {
    'use strict';

    // TODO Add advanced option: in advanced mode, you can create, update, delete MCA criteria, and inspect sparklines.
    // TODO Add advanced option: add canCreate, canUpdate, canDelete options, can Inspect to MCA.
    // TODO Add sparkline (under weight, in case canInspect==true and expertMode==true.
    // TODO Add scores to sparkline
    // TODO Add current (selectedFeature) value to sparkline
    // TODO Add score * weight result to d3-tip.

    import Feature       = csComp.Services.Feature;
    import IFeature      = csComp.Services.IFeature;
    import IFeatureType  = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;

    export interface IMcaScope extends ng.IScope {
        vm: McaCtrl;
        ratingStates: any;
    }

    declare var String;//: csComp.StringExt.IStringExt;

    export class McaCtrl {
        private static mcas = 'MCAs';
        private static confirmationMsg1: string;
        private static confirmationMsg2: string;

        public selectedFeature: IFeature;
        public properties     : FeatureProps.CallOutProperty[];
        public showDialog     : boolean = false;
        public showFeature    : boolean;
        public showChart      : boolean;
        public featureIcon    : string;

        public expertMode     : boolean = true;

        public mca              : Models.Mca;
        public selectedCriterion: Models.Criterion;
        public availableMcas    : Models.Mca[] = [];

        private groupStyle: csComp.Services.GroupStyle;

        public static $inject = [
            '$scope',
            '$modal',
            '$translate',
            'localStorageService',
            'layerService',
            'messageBusService'
        ];

        constructor(
            private $scope              : IMcaScope,
            private $modal              : any,
            private $translate          : ng.translate.ITranslateService,
            private $localStorageService: ng.localStorage.ILocalStorageService,
            private $layerService       : csComp.Services.LayerService,
            private messageBusService   : csComp.Services.MessageBusService
        ) {
            $scope.vm = this;

            messageBusService.subscribe('layer', (title) => {//, layer: csComp.Services.ProjectLayer) => {
                switch (title) {
                    case 'activated':
                    case 'deactivate':
                        this.updateAvailableMcas();
                        this.calculateMca();
                        break;
                }
            });

            messageBusService.subscribe('project', (title) => {//, layer: csComp.Services.ProjectLayer) => {
                switch (title) {
                    case 'loaded':
                        if (typeof $layerService.project.mcas === 'undefined' || $layerService.project.mcas == null)
                            $layerService.project.mcas = [];
                        var mcas = this.$localStorageService.get(McaCtrl.mcas);
                        if (typeof mcas === 'undefined' || mcas === null) return;
                        mcas.forEach((mca) => {
                            $layerService.project.mcas.push(new Models.Mca().deserialize(mca));
                        });
                        this.createDummyMca();
                        break;
                }
            });

            messageBusService.subscribe("feature", this.featureMessageReceived);

            $translate('MCA.DELETE_MSG').then(translation => {
                McaCtrl.confirmationMsg1 = translation;
            });
            $translate('MCA.DELETE_MSG2').then(translation => {
                McaCtrl.confirmationMsg2 = translation;
            });
        }

        private getVotingClass(criterion: Models.Criterion) {
            if (criterion == null || this.mca == null || criterion.userWeight == 0 || criterion.userWeight < -this.mca.userWeightMax || criterion.userWeight > this.mca.userWeightMax)
                return 'disabledMca';
            return criterion.userWeight > 0 ? 'prefer' : 'avoid';
        }

        private createDummyMca() {
            var mca = new Models.Mca();
            mca.title = 'Mijn Zelfredzaamheid';
            mca.description = 'Analyse van de zelfredzaamheid van een gemeente.';
            mca.label = 'mca_zelfredzaamheid';
            mca.stringFormat = '{0:0.0}';
            mca.rankTitle = 'Positie';
            mca.rankDescription = 'Relatieve positie in de lijst.';
            mca.rankFormat = '{0} van {1}';
            mca.userWeightMax = 5;
            mca.featureIds = ['cities_Default'];

            var criterion = new Models.Criterion();
            criterion.label = 'p_00_14_jr';
            criterion.scores = '[0,0 20,1]';
            criterion.userWeight = 1;
            mca.criteria.push(criterion);

            criterion = new Models.Criterion();
            criterion.label = 'p_15_24_jr';
            criterion.scores = '[0,0 20,1]';
            criterion.userWeight = 1;
            mca.criteria.push(criterion);

            criterion = new Models.Criterion();
            criterion.label = 'p_65_eo_jr';
            criterion.scores = '[0,0 25,1]';
            criterion.userWeight = 3;
            mca.criteria.push(criterion);
            this.$layerService.project.mcas.push(mca);

            mca = new Models.Mca();
            mca.title = 'test';
            mca.label = 'mca_test';
            mca.stringFormat = '{0:0.0}';
            mca.rankTitle = 'Rang';
            mca.rankFormat = '{0} van {1}';
            mca.userWeightMax = 3;
            mca.featureIds = ['cities_Default'];

            criterion = new Models.Criterion();
            criterion.label = 'p_15_24_jr';
            criterion.scores = '[0,0 20,1]';
            criterion.userWeight = 1;
            mca.criteria.push(criterion);

            criterion = new Models.Criterion();
            criterion.label = 'p_65_eo_jr';
            criterion.scores = '[0,0 25,1]';
            criterion.userWeight = 3;
            mca.criteria.push(criterion);
            this.$layerService.project.mcas.push(mca);
        }

        weightUpdated(criterion: Models.Criterion) {
            this.addMca(this.mca);
            this.updateMca(criterion);
        }

        updateMca(criterion?: Models.Criterion) {
            this.calculateMca();
            if (!this.selectedFeature)
                this.drawChart(criterion);
        }

        editMca(mca: Models.Mca) {
            this.showMcaEditor(mca);
        }

        createMca() {
            this.showMcaEditor(new Models.Mca());
        }

        private showMcaEditor(newMca: Models.Mca): void {
            var modalInstance = this.$modal.open({
                templateUrl: 'mcaEditorView.html',
                controller: McaEditorCtrl,
                resolve: {
                    mca: () => newMca
                }
            });
            modalInstance.result.then((mca: Models.Mca) => {
                this.addMca(mca);
                this.updateMca();
                console.log(JSON.stringify(mca, null, 2));
            }, () => {
                console.log('Modal dismissed at: ' + new Date());
            });
        }

        removeMca(mca: Models.Mca) {
            if (!mca) return;
            var title = String.format(McaCtrl.confirmationMsg1, mca.title);
            this.messageBusService.confirm(title, McaCtrl.confirmationMsg2, (result) => {
                if (!result) return;
                this.deleteMca(mca);
                if (this.mca) this.updateMca();
            });
        }

        private getMcaIndex(mca: Models.Mca): number {
            var mcaIndex = -1;
            var mcas = this.$layerService.project.mcas;
            for (var i = 0; i < mcas.length; i++) {
                if (mcas[i].title != mca.title) continue;
                mcaIndex = i;
                break;
            }
            return mcaIndex;
        }

        private addMca(mca: Models.Mca) {
            if (!mca) return;
            this.deleteMca(mca);
            this.$layerService.project.mcas.push(mca);
            this.addMcaToLocalStorage(mca);
            this.updateAvailableMcas();
            this.mca = mca;
        }

        private deleteMca(mca: Models.Mca) {
            if (!mca) return;
            var mcaIndex = this.getMcaIndex(mca);
            if (mcaIndex < 0) return;
            var mcas = this.$layerService.project.mcas;
            if (mcaIndex >= 0)
                mcas.splice(mcaIndex, 1);
            this.removeMcaFromLocalStorage(mca);
            this.updateAvailableMcas();
            if (this.availableMcas.length > 0) {
                this.mca = this.availableMcas[0];
            }
        }

        private addMcaToLocalStorage(mca: Models.Mca) {
            var mcas: Models.Mca[] = this.$localStorageService.get(McaCtrl.mcas);
            if (typeof mcas === 'undefined' || mcas === null) mcas = [];
            this.removeMcaFromLocalStorage(mca);
            mcas.push(mca);
            this.$localStorageService.set(McaCtrl.mcas, mcas); // You first need to set the key
        }

        private removeMcaFromLocalStorage(mca: Models.Mca) {
            var mcas: Models.Mca[] = this.$localStorageService.get(McaCtrl.mcas);
            if (typeof mcas === "undefined" || mcas === null) return;
            var mcaIndex = -1;
            for (var i = 0; i < mcas.length; i++) {
                if (mcas[i].title !== mca.title) continue;
                mcaIndex = i;
                break;
            }
            if (mcaIndex < 0) return;
            mcas.splice(mcaIndex, 1);
            this.$localStorageService.set(McaCtrl.mcas, mcas); // You first need to set the key
        }

        private featureMessageReceived = (title: string, feature: IFeature): void => {
            //console.log("MC: featureMessageReceived");
            if (this.mca == null) return;
            switch (title) {
            case "onFeatureSelect":
                this.updateSelectedFeature(feature);
                break;
            case "onFeatureDeselect":
                this.showFeature = false;
                this.selectedFeature = null;
                this.drawChart();
                break;
            default:
                console.log(title);
                break;
            }
            if (this.$scope.$root.$$phase !== "$apply" && this.$scope.$root.$$phase !== "$digest") {
                this.$scope.$apply();
            }
        }

        private updateSelectedFeature(feature: Feature) {
            if (typeof feature === "undefined" || feature == null) {
                this.featureIcon = "";
                return;
            }
            this.selectedFeature = feature;
            this.featureIcon = this.selectedFeature.fType != null && this.selectedFeature.fType.style != null
                ? this.selectedFeature.fType.style.iconUri
                : "";
            if (!feature.properties.hasOwnProperty(this.mca.label)) return;

            this.showFeature = true;
            this.properties = [];
            var mi = McaCtrl.createPropertyType(this.mca);
            var displayValue = csComp.Helpers.convertPropertyInfo(mi, feature.properties[mi.label]);
            this.properties.push(new FeatureProps.CallOutProperty(mi.title, displayValue, mi.label, true, true, feature, false, mi.description));
            if (this.mca.rankTitle) {
                mi = McaCtrl.createRankPropertyType(this.mca);
                displayValue = csComp.Helpers.convertPropertyInfo(mi, feature.properties[mi.label]);
                this.properties.push(new FeatureProps.CallOutProperty(mi.title, displayValue, mi.label, false, false, feature, false, mi.description));
            }
            this.drawChart();
        }

        drawChart(criterion?: Models.Criterion) {
            this.showChart = true;
            if (this.showFeature)
                this.drawAsterPlot(criterion);
            else
                this.drawPieChart(criterion);

            if (!this.expertMode) return;

            var i = 0;
            this.mca.criteria.forEach((crit) => {
                var id = "histogram_" + i++;
                if (crit.criteria.length === 0) {
                    csComp.Helpers.Plot.drawMcaPlot(crit.propValues, {
                        id              : id,
                        width           : 220,
                        height          : 70,
                        xy              : { x: crit.x, y: crit.y },
                        featureValue    : this.selectedFeature ? this.selectedFeature.properties[crit.label] : null
                    });
                } else {
                    var j = 0;
                    crit.criteria.forEach((c) => {
                        csComp.Helpers.Plot.drawMcaPlot(c.propValues, {
                            id          : id + "_" + j++,
                            width       : 220,
                            height      : 70,
                            xy          : { x: c.x, y: c.y },
                            featureValue: this.selectedFeature ? this.selectedFeature.properties[c.label] : null
                        });
                    });
                }
            });

        }

        private getParentOfSelectedCriterion(criterion?: Models.Criterion) {
            var parent: Models.Criterion[];
            this.mca.update();
            if (typeof criterion === 'undefined' || this.mca.criteria.indexOf(criterion) >= 0) {
                this.selectedCriterion = null;
                parent = this.mca.criteria;
            } else {
                this.mca.criteria.forEach((c) => {
                    if (c.criteria.indexOf(criterion) >= 0) {
                        this.selectedCriterion = c;
                        parent = c.criteria;
                    }
                });
            }
            return parent;
        }

        private drawAsterPlot(criterion?: Models.Criterion) {
            if (!this.mca || !this.selectedFeature) return;
            var currentLevel = this.getParentOfSelectedCriterion(criterion);
            if (typeof currentLevel === 'undefined' || currentLevel == null) return;
            var data: csComp.Helpers.AsterPieData[] = [];
            var i = 0;
            currentLevel.forEach((c) => {
                var rawScore   = c.getScore(this.selectedFeature);
                var pieData    = new csComp.Helpers.AsterPieData();
                pieData.id     = i++;
                pieData.label  = c.getTitle();
                pieData.weight = Math.abs(c.weight);
                pieData.color  = c.color;
                pieData.score  = (c.weight > 0 ? rawScore : 1-rawScore) * 100;
                data.push(pieData);
            });
            csComp.Helpers.Plot.drawAsterPlot(100, data, 'mcaPieChart');
        }

        private drawPieChart(criterion?: Models.Criterion) {
            if (!this.mca) return;
            var currentLevel = this.getParentOfSelectedCriterion(criterion);
            if (typeof currentLevel === 'undefined' || currentLevel == null) return;
            var data: csComp.Helpers.PieData[] = [];
            var i = 0;
            currentLevel.forEach((c) => {
                var pieData    = new csComp.Helpers.PieData();
                pieData.id     = i++;
                pieData.label  = c.getTitle();
                pieData.weight = Math.abs(c.weight);
                pieData.color  = c.color;
                data.push(pieData);
            });
            csComp.Helpers.Plot.drawPie(100, data, 'mcaPieChart');
        }

        /** Based on the currently loaded features, which MCA can we use */
        public updateAvailableMcas() {
            this.showChart     = false;
            this.mca           = null;
            this.availableMcas = [];

            this.$layerService.project.mcas.forEach((m) => {
                m.featureIds.forEach((featureId: string) => {
                    if (this.availableMcas.indexOf(m) < 0 && featureId in this.$layerService.featureTypes) {
                        this.availableMcas.push(m);
                        var featureType = this.$layerService.featureTypes[featureId];
                        this.applyPropertyInfoToCriteria(m, featureType);
                    }
                });
            });
            if (this.availableMcas.length >= 0) this.mca = this.availableMcas[0];
        }

        public calculateMca() {
            if (!this.mca) return;
            var mca = this.mca;
            mca.featureIds.forEach((featureId: string) => {
                if (!(this.$layerService.featureTypes.hasOwnProperty(featureId))) return;
                this.addPropertyInfo(featureId, mca);
                var features: IFeature[] = [];
                this.$layerService.project.features.forEach((feature) => {
                    features.push(feature);
                });
                mca.updatePla(features);
                mca.update();
                var tempScores: { score: number; index: number; }[] = [];
                var index = 0;
                this.$layerService.project.features.forEach((feature) => {
                    var score = mca.getScore(feature);
                    if (mca.rankTitle) {
                        var tempItem = { score: score, index: index++ };
                        tempScores.push(tempItem);
                    }
                    feature.properties[mca.label] = score * 100;
                    this.$layerService.updateFeature(feature);
                });
                if (mca.rankTitle) {
                    // Add rank information
                    tempScores.sort((a, b) => { return b.score - a.score; });
                    var length = this.$layerService.project.features.length;
                    var prevScore = -1;
                    var rank: number = 1;
                    for (var i = 0; i < length; i++) {
                        var item = tempScores[i];
                        // Assign items with the same value the same rank.
                        if (item.score != prevScore)
                            rank = i + 1;
                        prevScore = item.score;
                        this.$layerService.project.features[item.index].properties[mca.label + "#"] = rank + ',' + length;
                    }
                }
            });
            this.updateSelectedFeature(this.selectedFeature);
            if (this.selectedFeature) {
                this.messageBusService.publish('feature', 'onFeatureSelect', this.selectedFeature);
            }
            if (this.groupStyle) this.$layerService.updateStyle(this.groupStyle);
        }

        private applyPropertyInfoToCriteria(mca: Models.Mca, featureType: IFeatureType) {
            mca.criteria.forEach((criterion) => {
                var label = criterion.label;
                featureType.propertyTypeData.forEach((propInfo) => {
                    if (propInfo.label === label) {
                        criterion.title = propInfo.title;
                        criterion.description = propInfo.description;
                    }
                });
            });
        }

        private addPropertyInfo(featureId: string, mca: Models.Mca) {
            var featureType = this.$layerService.featureTypes[featureId];
            if (featureType.propertyTypeData.reduce((prevValue, curItem) => { return prevValue || (curItem.label === mca.label); }, false))
                return;

            var pi = McaCtrl.createPropertyType(mca);
            featureType.propertyTypeData.push(pi);

            if (!mca.rankTitle) return;
            pi = McaCtrl.createRankPropertyType(mca);
            featureType.propertyTypeData.push(pi);
        }

        public setStyle(item: FeatureProps.CallOutProperty) {
            if (this.groupStyle)
                this.$layerService.updateStyle(this.groupStyle);
            else {
                this.groupStyle = this.$layerService.setStyle(item, false);
                this.groupStyle.colors = ['red', 'green'];
                this.$layerService.updateStyle(this.groupStyle);
            }
        }

        private static createPropertyType(mca: Models.Mca): IPropertyType {
            var mi: IPropertyType = {
                title        : mca.title,
                label        : mca.label,
                type         : 'number',
                maxValue     : 1,
                minValue     : 0,
                description  : mca.description,
                stringFormat : mca.stringFormat,
                section      : mca.section || 'MCA'
            };
            return mi;
        }

        private static createRankPropertyType(mca: Models.Mca): IPropertyType {
            var mi : IPropertyType = {
                title        : mca.rankTitle,
                label        : mca.label + '#',
                type         : 'rank',
                description  : mca.rankDescription,
                stringFormat : mca.rankFormat,
                section      : mca.section || 'MCA'
            };
            return mi;
        }

    }
}
