module csComp.Mca {
    export interface IMcaScope extends ng.IScope {
        vm: McaCtrl;
    }

    export class McaCtrl {
        private mca : Models.Mca;
        private mcas: Models.Mca[] = [];

        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        constructor(
            private $scope            : IMcaScope,
            private $layerService     : csComp.Services.LayerService,
            private messageBusService : csComp.Services.MessageBusService
            ) {
            $scope.vm = this;

            var mca = new Models.Mca();
            mca.title         = 'Zelfredzaamheid';
            mca.description   = 'Analyse van de zelfredzaamheid van een gemeente.';
            mca.label         = 'mca_zelfredzaamheid';
            mca.stringFormat  = '{0:0.0}';
            mca.rankTitle     = 'Rang';
            mca.rankFormat    = '{0} van {1}';
            mca.userWeightMax = 10;
            mca.featureIds    = ['cities_Default'];

            var criterion          = new Models.Criterion();
            criterion.label        = 'p_00_14_jr';
            criterion.color        = 'green';
            criterion.scores       = '[0,0 20,1]';
            criterion.userWeight   = 1;
            mca.criteria.push(criterion);

            criterion              = new Models.Criterion();
            criterion.label        = 'p_65_eo_jr';
            criterion.color        = 'red';
            criterion.scores       = '[0,0 25,1]';
            criterion.userWeight   = 3;
            mca.criteria.push(criterion);
            this.mcas.push(mca);
        }

        /** Based on the currently loaded features, which MCA can we use */
        public availableMca() {
            this.mca = null;
            var availableMcas: Models.Mca[] = [];
            this.mcas.forEach((m) => {
                m.featureIds.forEach((featureId: string) => {
                    if (availableMcas.indexOf(m) < 0 && featureId in this.$layerService.featureTypes) {
                        availableMcas.push(m);
                        var featureType = this.$layerService.featureTypes[featureId];
                        this.applyPropertyInfoToCriteria(m, featureType);
                    }
                });
            });
            if (availableMcas.length > 0) this.mca = availableMcas[0];
            return availableMcas;
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
                mca.calculateWeights();
                this.$layerService.project.features.forEach((feature) => {
                    var score = mca.getScore(feature);
                    feature.properties[mca.label] = score;
                });
                
            });
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
            if (featureType.metaInfoData.reduce(
                (prevValue, curItem) => { return prevValue || (curItem.label === mca.label); }, false)) return;
            var mi = new csComp.GeoJson.MetaInfo();
            mi.title = mca.title;
            mi.label = mca.label;
            mi.type = 'number';
            mi.maxValue = 1;
            mi.minValue = 0;
            mi.description = mca.description;
            mi.stringFormat = mca.stringFormat;
            mi.section = mca.section || 'Info';
            featureType.metaInfoData.push(mi);
        }
    }
} 