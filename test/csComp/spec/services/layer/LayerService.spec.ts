describe('csComp.Services.LayerService', function() {

    // load the module
    beforeEach(module('csComp'));

    beforeEach(module(function($provide) {
        $provide.value('$translate', jasmine.createSpyObj('translateSpy', ['preferredLanguage']));
        $provide.value('localStorageService', jasmine.createSpyObj('localStorageServiceSpy', ['get']));
        $provide.value('$mapService', jasmine.createSpyObj('mapServiceSpy', ['get']));
    }));

    var layerService: csComp.Services.LayerService;
    var scope;
    beforeEach(inject(function(_layerService_, $translate, localStorageService, $mapService) {
        layerService = _layerService_;
    }));

    describe('Initial state', () => {
        it('Should have created a layerservice', () => {
            expect(layerService).toBeDefined();
        });
    });
});
