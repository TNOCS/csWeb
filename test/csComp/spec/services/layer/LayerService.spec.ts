describe('csComp.Services.LayerService', function() {

    // load the module
    beforeEach(module('csComp'));

    beforeEach(module(function($provide) {
        $provide.value('$translate', jasmine.createSpyObj('translateSpy', ['preferredLanguage']));
        $provide.value('localStorageService', jasmine.createSpyObj('localStorageServiceSpy', ['get']));
        $provide.value('$mapService', jasmine.createSpyObj('mapServiceSpy', ['get']));
    }));

    var layerService: csComp.Services.LayerService;
    var scope, translate;
    beforeEach(inject(function(_layerService_, $translate, localStorageService, $mapService) {
        layerService = _layerService_;
        translate = $translate;
    }));

    describe('Initial state', () => {
        it('should have created a layerservice', () => {
            expect(layerService).toBeDefined();
        });
        it('should have an empty title and accentColor', () => {
            expect(layerService.title).toEqual('');
            expect(layerService.accentColor).toEqual('');
        });
        it('should have preferred language as currentLocale', () => {
            expect(layerService.currentLocale).toEqual(translate.preferredLanguage());
        });
    });

    // describe('Remove layer', () => {
    //     it('Should add layer',()=>{
    //
    //     });
    //
    //     it('Should remove layer',()=>{
    //         layerService.project = new csComp.Services.Project();
    //     });
    // })
});
