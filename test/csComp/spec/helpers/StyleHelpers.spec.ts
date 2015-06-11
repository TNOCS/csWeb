var MockColorTranslation = (function() {
    function MockColorTranslation() {
        this.then = function(translation) {
            translation('color');
        };
    }
    return MockColorTranslation;
})();
;
describe('StyleHelpers', function() {
    beforeEach(module('csComp'));
    var mockTranslate;
    beforeEach(function() {
        module(function($provide) {
            $provide.value('$translate', mockTranslate);
        });
        mockTranslate = function(key) {
            var mct = new MockColorTranslation();
            return mct;
        };
    });
    var groupStyle, translate;
    beforeEach(inject(function($translate) {
        translate = $translate;
        groupStyle = new csComp.Services.GroupStyle(translate);
    }));
    describe('Initial state', () => {
        it('should have function getColorFromStringValue', function() {
            var color = csComp.Helpers.getColorFromStringValue('wrongFormat', groupStyle);
            expect(color).toBeUndefined();
            groupStyle.activeLegend = {id: 'test', 'legendEntries': [], 'legendKind': 'discretestrings'};
            var color = csComp.Helpers.getColorFromStringValue('wrongFormat', groupStyle);
            expect(color).toEqual('#000000');
            groupStyle.activeLegend.legendEntries.push({'stringValue': 'blue', 'color': '#000011'});
            groupStyle.activeLegend.legendEntries.push({'stringValue': 'green', 'color': '#001100'});
            var color = csComp.Helpers.getColorFromStringValue('green', groupStyle);
            expect(color).toEqual('#001100');
            var color = csComp.Helpers.getColorFromStringValue('red', groupStyle);
            expect(color).toEqual('#000000');
        });
    });
});
