describe('csComp.Services.LayerService', function () {
    beforeEach(module('csComp'));
    beforeEach(module(function ($provide) {
        $provide.value('$translate', jasmine.createSpyObj('translateSpy', ['preferredLanguage']));
        $provide.value('localStorageService', jasmine.createSpyObj('localStorageServiceSpy', ['get']));
        $provide.value('$mapService', jasmine.createSpyObj('mapServiceSpy', ['get']));
    }));
    var layerService;
    var scope;
    beforeEach(inject(function (_layerService_, $translate, localStorageService, $mapService) {
        layerService = _layerService_;
    }));
    describe('Initial state', function () {
        it('Should have created a layerservice', function () {
            expect(layerService).toBeDefined();
        });
    });
});
