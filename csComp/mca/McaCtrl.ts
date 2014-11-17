module csComp.Mca {
    import Plot = csComp.Helpers.Plot;

    export interface IMcaScope extends ng.IScope {
        vm: McaCtrl;
    }

    export class McaCtrl {
        public selectedFeature: csComp.GeoJson.IFeature;
        public properties     : FeatureProps.CallOutProperty[];
        public showFeature: boolean;

        public mca          : Models.Mca;
        public mcas         : Models.Mca[] = [];
        public availableMcas: Models.Mca[] = [];

        private groupStyle: csComp.Services.GroupStyle;

        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        constructor(
            private $scope: IMcaScope,
            private $layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService
        ) {
            $scope.vm = this;

            messageBusService.subscribe('layer', (title, layer: csComp.Services.ProjectLayer) => {
                this.availableMca();
                this.calculateMca();
                this.calculateMca();
            });

            messageBusService.subscribe("feature", this.featureMessageReceived);

            var mca             = new Models.Mca();
            mca.title           = 'Zelfredzaamheid';
            mca.description     = 'Analyse van de zelfredzaamheid van een gemeente.';
            mca.label           = 'mca_zelfredzaamheid';
            mca.stringFormat    = '{0:0.0}';
            mca.rankTitle       = 'Positie';
            mca.rankDescription = 'Relatieve positie in de lijst.';
            mca.rankFormat      = '{0} van {1}';
            mca.userWeightMax   = 5;
            mca.featureIds      = ['cities_Default'];

            var criterion        = new Models.Criterion();
            criterion.label      = 'p_00_14_jr';
            criterion.scores     = '[0,0 20,1]';
            criterion.userWeight = 1;
            mca.criteria.push(criterion);

            criterion            = new Models.Criterion();
            criterion.label      = 'p_15_24_jr';
            criterion.scores     = '[0,0 20,1]';
            criterion.userWeight = 1;
            mca.criteria.push(criterion);

            criterion            = new Models.Criterion();
            criterion.label      = 'p_65_eo_jr';
            criterion.scores     = '[0,0 25,1]';
            criterion.userWeight = 3;
            mca.criteria.push(criterion);
            this.mcas.push(mca);

            mca               = new Models.Mca();
            mca.title         = 'test';
            mca.label         = 'mca_test';
            mca.stringFormat  = '{0:0.0}';
            mca.rankTitle     = 'Rang';
            mca.rankFormat    = '{0} van {1}';
            mca.userWeightMax = 3;
            mca.featureIds    = ['cities_Default'];

            criterion            = new Models.Criterion();
            criterion.label      = 'p_15_24_jr';
            criterion.scores     = '[0,0 20,1]';
            criterion.userWeight = 1;
            mca.criteria.push(criterion);

            criterion            = new Models.Criterion();
            criterion.label      = 'p_65_eo_jr';
            criterion.scores     = '[0,0 25,1]';
            criterion.userWeight = 3;
            mca.criteria.push(criterion);
            this.mcas.push(mca);

            $scope.$watch('vm.mca', (d) => {
                if (!this.mca) return;
                this.calculateMca();
                this.drawChart();
                // console.log(JSON.stringify(d));
            }, true);
        }

        private featureMessageReceived = (title: string, feature: csComp.GeoJson.IFeature): void => {
            //console.log("MC: featureMessageReceived");
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
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        private updateSelectedFeature(feature: csComp.GeoJson.Feature) {
            if (typeof feature === 'undefined' || feature == null) return;
            this.selectedFeature = feature;
            if (this.mca.label in feature.properties) {
                this.showFeature = true;
                this.properties = [];
                var mi = McaCtrl.createMetaInfo(this.mca);
                var displayValue = FeatureProps.CallOut.convertPropertyInfo(mi, feature.properties[mi.label]);
                this.properties.push(new FeatureProps.CallOutProperty(mi.title, displayValue, mi.label, true, true, feature, false, mi.description));
                if (this.mca.rankTitle) {
                    mi = McaCtrl.createMetaInfoRank(this.mca);
                    displayValue = FeatureProps.CallOut.convertPropertyInfo(mi, feature.properties[mi.label]);
                    this.properties.push(new FeatureProps.CallOutProperty(mi.title, displayValue, mi.label, false, false, feature, false, mi.description));
                }
                this.drawChart();
            }
        }

        public drawChart(criterion?: Models.Criterion) {
            if (this.showFeature)
                this.drawAsterPlot(criterion);
            else
                this.drawPieChart(criterion);
        }

        private getParentOfSelectedCriterion(criterion?: Models.Criterion) {
            var parent: Models.Criterion[];
            this.mca.update();
            if (typeof criterion === 'undefined' || this.mca.criteria.indexOf(criterion) >= 0) {
                parent = this.mca.criteria;
            } else {
                this.mca.criteria.forEach((c) => {
                    if (c.criteria.indexOf(criterion) >= 0)
                        parent = c.criteria;
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
                var pieData = new csComp.Helpers.AsterPieData();
                pieData.id = i++;
                pieData.label = c.getTitle();
                pieData.weight = c.weight;
                pieData.color = c.color;
                pieData.score = c.getScore(this.selectedFeature, c) * 100;
                data.push(pieData);
            });
            Plot.drawAsterPlot(100, data, 'mcaPieChart');
        }


        private drawPieChart(criterion?: Models.Criterion) {
            if (!this.mca) return;
            var currentLevel = this.getParentOfSelectedCriterion(criterion);
            if (typeof currentLevel === 'undefined' || currentLevel == null) return;
            var data: csComp.Helpers.PieData[] = [];
            var i = 0;
            currentLevel.forEach((c) => {
                var pieData = new csComp.Helpers.PieData();
                pieData.id = i++;
                pieData.label = c.getTitle();
                pieData.weight = c.weight;
                pieData.color = c.color;
                data.push(pieData);
            });
            Plot.drawPie(100, data, 'mcaPieChart');
        }

        /** Based on the currently loaded features, which MCA can we use */
        public availableMca() {
            this.mca = null;
            this.availableMcas = [];
            this.mcas.forEach((m) => {
                m.featureIds.forEach((featureId: string) => {
                    if (this.availableMcas.indexOf(m) < 0 && featureId in this.$layerService.featureTypes) {
                        this.availableMcas.push(m);
                        var featureType = this.$layerService.featureTypes[featureId];
                        this.applyPropertyInfoToCriteria(m, featureType);
                    }
                });
            });
            if (this.availableMcas.length > 0) this.mca = this.availableMcas[0];
        }

        public calculateMca() {
            if (!this.mca) return;
            var mca = this.mca;
            mca.featureIds.forEach((featureId: string) => {
                if (!(featureId in this.$layerService.featureTypes)) return;
                this.addPropertyInfo(featureId, mca);
                var features: csComp.GeoJson.IFeature[] = [];
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
                        var item = { score: score, index: index++ };
                        tempScores.push(item);
                    }
                    feature.properties[mca.label] = score * 100;
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
                        this.$layerService.project.features[item.index].properties[mca.label + '#'] = rank + ',' + length;
                    }
                }
            });
            this.updateSelectedFeature(this.selectedFeature);
            if (this.groupStyle) this.$layerService.updateStyle(this.groupStyle);
        }

        private applyPropertyInfoToCriteria(mca: Models.Mca, featureType: csComp.GeoJson.IFeatureType) {
            mca.criteria.forEach((criterion) => {
                var label = criterion.label;
                featureType.metaInfoData.forEach((propInfo) => {
                    if (propInfo.label === label) {
                        criterion.title = propInfo.title;
                        criterion.description = propInfo.description;
                    }
                });
            });
        }

        private addPropertyInfo(featureId: string, mca: Models.Mca) {
            var featureType = this.$layerService.featureTypes[featureId];
            if (featureType.metaInfoData.reduce((prevValue, curItem) => { return prevValue || (curItem.label === mca.label); }, false))
                return;

            var mi = McaCtrl.createMetaInfo(mca);
            featureType.metaInfoData.push(mi);

            if (!mca.rankTitle) return;
            mi = McaCtrl.createMetaInfoRank(mca);
            featureType.metaInfoData.push(mi);
        }

        public setStyle(item: FeatureProps.CallOutProperty) {
            if (this.groupStyle)
                this.$layerService.updateStyle(this.groupStyle);
            else
                this.groupStyle = this.$layerService.setStyle(item);
        }

        private static createMetaInfo(mca: Models.Mca): csComp.GeoJson.MetaInfo {
            var mi          = new csComp.GeoJson.MetaInfo();
            mi.title        = mca.title;
            mi.label        = mca.label;
            mi.type         = 'number';
            mi.maxValue     = 1;
            mi.minValue     = 0;
            mi.description  = mca.description;
            mi.stringFormat = mca.stringFormat;
            mi.section      = mca.section || 'MCA';
            return mi;
        }

        private static createMetaInfoRank(mca: Models.Mca): csComp.GeoJson.MetaInfo {
            var mi          = new csComp.GeoJson.MetaInfo();
            mi.title        = mca.rankTitle;
            mi.label        = mca.label + '#';
            mi.type         = 'rank';
            mi.description  = mca.rankDescription;
            mi.stringFormat = mca.rankFormat;
            mi.section      = mca.section || 'MCA';
            return mi;
        }
    }
} 