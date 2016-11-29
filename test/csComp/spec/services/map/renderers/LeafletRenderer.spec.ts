describe('csComp.Services.LeafletRenderer', function() {

    // load the module
    beforeEach(angular.mock.module('csComp'));

    beforeEach(angular.mock.module(function($provide) {
        $provide.value('$location', jasmine.createSpyObj('locationSpy', ['search']));
        $provide.value('$translate', jasmine.createSpyObj('translateSpy', ['preferredLanguage']));
        $provide.value('localStorageService', jasmine.createSpyObj('localStorageServiceSpy', ['get']));
        $provide.value('$mapService', jasmine.createSpyObj('mapServiceSpy', ['get']));
        $provide.value('messageBusService', jasmine.createSpyObj('messageBusServiceSpy', ['subscribe', 'publish', 'initConnection', 'serverSubscribe']));
    }));

    var f: csComp.Services.IFeature,
        r: csComp.Services.ITypesResource,
        e: L.LeafletMouseEvent,
        group: csComp.Services.ProjectGroup,
        service: csComp.Services.LayerService,
        renderer: csComp.Services.LeafletRenderer;

    var mapService: csComp.Services.MapService;
    var scope, translate, msgBusService, location;
    beforeEach(inject(function($location, $translate, $mapService, messageBusService) {
        location = $location,
        translate = $translate;
        msgBusService = messageBusService;
        mapService = $mapService;
    }));

    describe('A Leaflet tooltip', () => {
        beforeEach(() => {
            renderer = new csComp.Services.LeafletRenderer();
            service = new csComp.Services.LayerService(location, null, translate, msgBusService, mapService, null, null, null, null, <any>{init: () => {}}, null);
            renderer.init(service);

            f = <csComp.Services.IFeature>{};
            f.properties = {
                'Name': 'Test',
                'amount_men': 1000000,
                'percentage_children': 0.125
            };
            f.fType = {
                _propertyTypeData: [{
                    'label': 'amount_men',
                    'title': 'Number of men',
                    'type': 'number',
                    'stringFormat': '{0:0,0}'
                }, {
                    'label': 'percentage_children',
                    'title': 'Percentage of children',
                    'type': 'number',
                    'stringFormat': '{0:0.00%}'
                }]
            };

            e = <L.LeafletMouseEvent>{};
            e.target = {
                'feature': f
            };

            group = new csComp.Services.ProjectGroup();
        });

        it ('should only have a title when no filter or style is selected', () => {
            var tooltip = renderer.generateTooltipContent(e, group);
            expect(tooltip).toBeDefined();
            expect(tooltip.content).toContain(f.properties['Name']);
        });

        it('should have an entry for each filter.', () => {
            var filter = new csComp.Services.GroupFilter();
            filter.property = 'amount_men';
            filter.title = 'Number of men';
            group.filters = [filter];
            var tooltip = renderer.generateTooltipContent(e, group);
            expect(tooltip).toBeDefined();
            expect(tooltip.content).toContain('Number of men');
            expect(tooltip.content.replace('.', ',')).toContain('1,000,000'); // change thousand separator in Dutch
        });

        it('should have an entry for each style.', () => {
            var style = <csComp.Services.GroupStyle>{};
            style.property = 'percentage_children';
            style.title = 'Percentage of children';
            group.styles = [style];
            group.filters = [];
            var tooltip = renderer.generateTooltipContent(e, group);
            expect(tooltip).toBeDefined();
            expect(tooltip.content).toContain('Percentage of children');
            expect(tooltip.content.replace(',', '.')).toContain('12.50%'); // change decimal point in Dutch
        });

    });

});