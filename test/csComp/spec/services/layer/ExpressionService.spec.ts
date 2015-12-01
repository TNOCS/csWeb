describe('csComp.Services.ExpressionService', function() {

    // load the module
    beforeEach(angular.mock.module('csComp'));

    var f: Array<csComp.Services.IFeature> = [],
        r: csComp.Services.ITypesResource,
        expressionService: csComp.Services.ExpressionService;

    beforeEach(inject(function(_expressionService_) {
        expressionService = _expressionService_;
    }));

    beforeEach(() => {
        let f1 = <csComp.Services.IFeature>{};
        f1.properties = {
            'amount_men': 10000,
            'percentage_children': 0.1
        };
        let f2 = <csComp.Services.IFeature>{};
        f2.properties = {
            'amount_men': 20000,
            'percentage_children': 0.2
        };
        let f3 = <csComp.Services.IFeature>{};
        f3.properties = {
            'amount_men': 30000,
            'percentage_children': 0.1
        };
        f3.fType = {};
        f.push(f1);
        f.push(f2);
        f.push(f3);

        r = <csComp.Services.ITypesResource>{};
        r.propertyTypeData = {
            'amount_men': {
                'label': 'amount_men'
            },
            'percentage_children': {
                'label': 'percentage_children'
            },
            'amount_children': {
                'label': 'amount_children',
                'expression': 'properties.amount_men * properties.percentage_children'
            }
        };
    });

    describe('When evaluating an expression', () => {
        it('should be calculated correctly.', () => {
            var children = r.propertyTypeData['amount_children'];
            expect(expressionService)
            var result = expressionService.evalExpression(children.expression, f, f[0]);
            expect(result).toBe(1000);
        });

        it('should compute the common operations correctly.', () => {
            var scope = {
                features: f
            };
            expect(expressionService.evalExpression('min(features, "amount_men")', f, f[0])).toBe(10000);
            expect(expressionService.evalExpression('max(features, "amount_men")', f, f[0])).toBe(30000);
            expect(expressionService.evalExpression('count(features, "amount_men")', f, f[0])).toBe(3);
            expect(expressionService.evalExpression('sum(features, "amount_men")', f, f[0])).toBe(60000);
            expect(expressionService.evalExpression('avg(features, "amount_men")', f, f[0])).toBe(20000);
            expect(expressionService.evalExpression('std(features, "amount_men")', f, f[0])).toBeCloseTo(8165, 1);
        });

    });

});