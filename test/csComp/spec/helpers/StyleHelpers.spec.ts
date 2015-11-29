describe('StyleHelpers', function() {
    beforeEach(angular.mock.module('csComp'));

    var mockTranslate;

    beforeEach(function() {
        angular.mock.module(function($provide) {
            $provide.value('$translate', mockTranslate);
        });
        mockTranslate = function(key) {
            var mct = new ColorTranslationMock.MockColorTranslation();
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
            groupStyle.activeLegend = { id: 'test', 'legendEntries': [], 'legendKind': 'discreteStrings' };
            color = csComp.Helpers.getColorFromStringValue('wrongFormat', groupStyle);
            expect(color).toEqual('#000000');
            groupStyle.activeLegend.legendEntries.push({ 'stringValue': 'blue', 'color': '#000011' });
            groupStyle.activeLegend.legendEntries.push({ 'stringValue': 'green', 'color': '#001100' });
            color = csComp.Helpers.getColorFromStringValue('green', groupStyle);
            expect(color).toEqual('#001100');
            color = csComp.Helpers.getColorFromStringValue('red', groupStyle);
            expect(color).toEqual('#000000');
        });

        it('should have function getColorFromStringLegend', function() {
            var legend = new csComp.Services.Legend();
            legend.legendEntries = [];
            var color = csComp.Helpers.getColorFromStringLegend('wrongFormat', legend);
            expect(color).toEqual('#000000');
            legend.legendKind = 'discreteStrings';
            color = csComp.Helpers.getColorFromStringLegend('wrongFormat', legend);
            expect(color).toEqual('#000000');
            legend.legendEntries.push({ 'stringValue': 'blue', 'color': '#000011', 'label': 'blue', 'interval': { 'min': 0, 'max': 1 }, 'value': 0 });
            legend.legendEntries.push({ 'stringValue': 'green', 'color': '#001100', 'label': 'green', 'interval': { 'min': 0, 'max': 1 }, 'value': 0 });
            color = csComp.Helpers.getColorFromStringLegend('green', legend);
            expect(color).toEqual('#001100');
            color = csComp.Helpers.getColorFromStringLegend('red', legend);
            expect(color).toEqual('#000000');
            legend.legendKind = 'notExisting';
            color = csComp.Helpers.getColorFromStringLegend('green', legend);
            expect(color).toEqual('#000000');
        });

        it('should have function getColorFromLegend', function() {
            var legend = new csComp.Services.Legend();
            legend.legendEntries = [];
            var color = csComp.Helpers.getColorFromLegend(0.5, legend);
            expect(color).toEqual('#000000');
            color = csComp.Helpers.getColorFromLegend(0.5, legend, '#001100');
            expect(color).toEqual('#001100');
            legend.legendKind = 'interpolated';
            legend.legendEntries.push({ 'stringValue': 'blue', 'color': '#000011', 'label': 'blue', 'interval': { 'min': 0, 'max': 1 }, 'value': 0 });
            legend.legendEntries.push({ 'stringValue': 'green', 'color': '#001100', 'label': 'blue', 'interval': { 'min': 0, 'max': 1 }, 'value': 1 });
            color = csComp.Helpers.getColorFromLegend(-0.5, legend, '#000000');
            expect(color).toEqual('#000011');
            color = csComp.Helpers.getColorFromLegend(1.5, legend, '#000000');
            expect(color).toEqual('#001100');
            color = csComp.Helpers.getColorFromLegend(1, legend);
            expect(color).toEqual('#001100');
            color = csComp.Helpers.getColorFromLegend(0, legend);
            expect(color).toEqual('#000011');
            legend.legendKind = 'discrete';
            color = csComp.Helpers.getColorFromLegend(1.1, legend);
            expect(color).toEqual('#001100');
            color = csComp.Helpers.getColorFromLegend(0, legend);
            expect(color).toEqual('#000011');
            color = csComp.Helpers.getColorFromLegend(-0.1, legend);
            expect(color).toEqual('#000011');
            legend.legendKind = 'notExisting';
            color = csComp.Helpers.getColorFromLegend(0.5, legend);
            expect(color).toEqual('#000000');
        });

        it('should have function getColor', function() {
            groupStyle.info = {max: 1, min: 0, mean:0.5};
            groupStyle.colors = ['#000000', '#002200'];
            var color = csComp.Helpers.getColor(0, groupStyle);
            expect(color).toEqual('#000000');
            color = csComp.Helpers.getColor(-0.1, groupStyle);
            expect(color).toEqual('#000000');
            color = csComp.Helpers.getColor(0.5, groupStyle);
            expect(color).toEqual('#001100');
            color = csComp.Helpers.getColor(1.1, groupStyle);
            expect(color).toEqual('#002200');
        });

        it('should have function getColorString', function() {
            var color = csComp.Helpers.getColorString(undefined, '#abc');
            expect(color).toEqual('#abc');
            color = csComp.Helpers.getColorString(undefined);
            expect(color).toEqual('#f00');
            color = csComp.Helpers.getColorString('#000');
            expect(color).toEqual('#000');
            color = csComp.Helpers.getColorString('#001122');
            expect(color).toEqual('#001122');
            color = csComp.Helpers.getColorString('#00112233');
            expect(color).toEqual('#112233');
            color = csComp.Helpers.getColorString('#notReallyAColor');
            expect(color).toEqual('#f00');
        });
    });
});
