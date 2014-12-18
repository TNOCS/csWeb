describe('The MCA model ', () => {
    beforeEach(() => {
        this.mca = new Mca.Models.Mca();
        this.mca.criteria.push({ userWeight: 5, criteria: [] });
        this.mca.criteria.push({ userWeight: 3, criteria: [] });
        this.mca.criteria.push({ userWeight: 2, criteria: [] });
    });

    it('should calculate the correct weights based on the user weights.', () => {
        this.mca.calculateWeights();

        expect(this.mca.criteria[0].weight).toBe(0.5);
        expect(this.mca.criteria[1].weight).toBe(0.3);
        expect(this.mca.criteria[2].weight).toBe(0.2);
    });

    it('should assign a color to each criterion after updating.', () => {
        expect(this.mca.criteria[0].color != null).toBe(false);
        expect(this.mca.criteria[1].color != null).toBe(false);
        expect(this.mca.criteria[2].color != null).toBe(false);

        this.mca.update();

        expect(this.mca.criteria[0].color != null).toBe(true);
        expect(this.mca.criteria[1].color != null).toBe(true);
        expect(this.mca.criteria[2].color != null).toBe(true);
    });

    it('should use the minValue and maxValue when provided for computing the PLA', () => {
        var features : csComp.Services.IFeature[] = [
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

        var criterion         = new Mca.Models.Criterion();
        criterion.label       = 'test';
        criterion.scores      = Mca.Models.ScoringFunction.createScores(Mca.Models.ScoringFunctionType.Ascending);
        criterion.userWeight  = 1;
        criterion.isPlaScaled = true;
        criterion.updatePla(features);
        var result            = Math.round(criterion.getScore(selectedFeature)*1000);

        expect(result).toBe(292);

        criterion             = new Mca.Models.Criterion();
        criterion.label       = 'test';
        criterion.scores      = Mca.Models.ScoringFunction.createScores(Mca.Models.ScoringFunctionType.Ascending);
        criterion.minValue    = 1;
        criterion.maxValue    = 11;
        criterion.userWeight  = 1;
        criterion.isPlaScaled = true;
        criterion.updatePla(features);
        result                = criterion.getScore(selectedFeature);

        expect(result).toBe(0.4);
    });

    it('should return a result of 0 when the value is outside the cut-off range.', () => {
        var features : csComp.Services.IFeature[] = [
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
        var selectedFeature   = features[0];

        var criterion         = new Mca.Models.Criterion();
        criterion.label       = 'test';
        criterion.userWeight  = 1;
        criterion.isPlaScaled = true;
        criterion.scores      = Mca.Models.ScoringFunction.createScores(Mca.Models.ScoringFunctionType.Ascending);

        criterion.minValue    = 2;
        criterion.maxValue    = 7;
        criterion.updatePla(features);
        var result            = criterion.getScore(selectedFeature);
        expect(result).toBe(1);

        criterion.maxCutoffValue = 8;
        result = criterion.getScore(selectedFeature);
        expect(result).toBe(0);

        selectedFeature = features[2];
        criterion.minValue = 1;
        criterion.maxValue = 11;
        criterion.updatePla(features);
        criterion.maxCutoffValue = null;
        criterion.minCutoffValue = 4;
        criterion.updatePla(features);
        result = criterion.getScore(selectedFeature);
        expect(result).toBe(0);
    });

});