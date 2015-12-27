describe('csComp.Helpers', function() {

    describe('Initial state', () => {
        it('should get score for a string', function() {
            expect('Helloworld'.score('Hello', 1)).toBeDefined();
        });
        it('should get score 1 for a equal strings', function() {
            expect('Helloworld'.score('Helloworld', 1)).toEqual(1);
        });
        it('should get score 0 for comparing with an empty strings', function() {
            expect('Helloworld'.score('', 1)).toEqual(0);
        });
        it('should get score 1 for a equal strings', function() {
            expect('Helloworld'.score('Hello', undefined)).toBeDefined();
        });
        it('should get score 1 for a equal strings', function() {
            expect('Helloworld'.score('a', undefined)).toEqual(0);
        });
    });
});
