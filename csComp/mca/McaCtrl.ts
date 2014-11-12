module csComp.Mca {
    export interface IMcaScope extends ng.IScope {
        vm: McaCtrl;
    }

    export class McaCtrl {
        private mca: Models.Mca = new Models.Mca();

        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        constructor(
            private $scope            : IMcaScope,
            private $layerService     : csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {
            $scope.vm = this;

            this.mca.title         = 'Zelfredzaamheid';
            this.mca.description   = 'Analyse van de zelfredzaamheid van een gemeente.';
            this.mca.label         = 'mca_zelfredzaamheid';
            this.mca.stringFormat  = '{0:0.0%}';
            this.mca.rankTitle     = 'Rang';
            this.mca.rankFormat    = '{0} van {1}';
            this.mca.userWeightMax = 10;
            this.mca.featureIds    = ['cities.default'];

            var criterion          = new Models.Criterion();
            criterion.label        = 'p_00_14_jr';
            criterion.color        = 'green';
            criterion.scores       = '[0,0 0.2,1]';
            criterion.userWeight   = 1;
            this.mca.criteria.push(criterion);

            criterion              = new Models.Criterion();
            criterion.label        = 'p_65_eo_jr';
            criterion.color        = 'red';
            criterion.scores       = '[0,0 0.25,1]';
            criterion.userWeight   = 3;
            this.mca.criteria.push(criterion);
        }

        public calculateMca() {
            if (!(this.mca.featureIds[0] in this.$layerService.featureTypes)) return;

        }
    }
} 