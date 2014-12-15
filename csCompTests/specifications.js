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
});
//# sourceMappingURL=specifications.js.map
