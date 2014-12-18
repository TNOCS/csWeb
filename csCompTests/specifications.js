var _this = this;
describe('The MCA model ', function () {
    beforeEach(function () {
        _this.mca = new Mca.Models.Mca();
        _this.mca.criteria.push({ userWeight: 5, criteria: [] });
        _this.mca.criteria.push({ userWeight: 3, criteria: [] });
        _this.mca.criteria.push({ userWeight: 2, criteria: [] });
    });

    it('should calculate the correct weights based on the user weights.', function () {
        _this.mca.calculateWeights();

        expect(_this.mca.criteria[0].weight).toBe(0.5);
        expect(_this.mca.criteria[1].weight).toBe(0.3);
        expect(_this.mca.criteria[2].weight).toBe(0.2);
    });

    it('should assign a color to each criterion after updating.', function () {
        expect(_this.mca.criteria[0].color != null).toBe(false);
        expect(_this.mca.criteria[1].color != null).toBe(false);
        expect(_this.mca.criteria[2].color != null).toBe(false);

        _this.mca.update();

        expect(_this.mca.criteria[0].color != null).toBe(true);
        expect(_this.mca.criteria[1].color != null).toBe(true);
        expect(_this.mca.criteria[2].color != null).toBe(true);
    });

    it('should use the minValue and maxValue when provided for computing the PLA', function () {
        var features = [
            {
                layerId: '',
                type: '',
                geometry: null,
                properties: { 'test': 9 }
            },
            {
                layerId: '',
                type: '',
                geometry: null,
                properties: { 'test': 5 }
            },
            {
                layerId: '',
                type: '',
                geometry: null,
                properties: { 'test': 3 }
            }
        ];
        var selectedFeature = features[1];
        var criterion = new Mca.Models.Criterion();
        criterion.label = 'test';
        criterion.scores = Mca.Models.ScoringFunction.createScores(1 /* Ascending */);
        criterion.userWeight = 1;
        criterion.isPlaScaled = true;
        criterion.updatePla(features);
        var result = Math.round(criterion.getScore(selectedFeature) * 1000);

        expect(result).toBe(292);

        criterion = new Mca.Models.Criterion();
        criterion.label = 'test';
        criterion.scores = Mca.Models.ScoringFunction.createScores(1 /* Ascending */);
        criterion.minValue = 1;
        criterion.maxValue = 11;
        criterion.userWeight = 1;
        criterion.isPlaScaled = true;
        criterion.updatePla(features);
        result = criterion.getScore(selectedFeature);

        expect(result).toBe(0.4);
    });
});
//# sourceMappingURL=specifications.js.map
