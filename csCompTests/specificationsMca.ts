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

});