describe('csComp.Services.LayerService', function() {

    // load the module
    beforeEach(module('csComp'));
    beforeEach(module('solutionMock'));
    beforeEach(module('projectMock'));
    beforeEach(module('mockedDataSource'));

    beforeEach(module(function($provide) {
        $provide.value('$translate', jasmine.createSpyObj('translateSpy', ['preferredLanguage']));
        $provide.value('localStorageService', jasmine.createSpyObj('localStorageServiceSpy', ['get']));
        $provide.value('$mapService', jasmine.createSpyObj('mapServiceSpy', ['get']));
        $provide.value('messageBusService', jasmine.createSpyObj('messageBusServiceSpy', ['subscribe', 'publish', 'initConnection', 'serverSubscribe']));
    }));

    var mockSolution, mockProject, mockDatasource;
    var layerService: csComp.Services.LayerService;
    var mapService: csComp.Services.MapService;
    var scope, translate, msgBusService;
    beforeEach(inject(function(_layerService_, $translate, localStorageService, $mapService, messageBusService, defaultSolution, defaultProject, defaultJSON) {
        layerService = _layerService_;
        translate = $translate;
        msgBusService = messageBusService;
        mockSolution = defaultSolution;
        mockProject = defaultProject;
        mapService = $mapService;
        mockDatasource = defaultJSON;
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
        it('should subscribe to timeline', () => {
            expect(msgBusService.subscribe).toHaveBeenCalledWith('timeline', jasmine.any(Function));
        });
        it('should subscribe to language', () => {
            expect(msgBusService.subscribe).toHaveBeenCalledWith('language', jasmine.any(Function));
        });
        it('should subscribe to mapbbox', () => {
            expect(msgBusService.subscribe).toHaveBeenCalledWith('mapbbox', jasmine.any(Function));
        });
        it('should have layersource geojson', () => {
            expect(layerService.layerSources.hasOwnProperty('geojson')).toBeTruthy();
        });
        it('should have layersource geojson', () => {
            expect(layerService.layerSources.hasOwnProperty('geojson')).toBeTruthy();
        });
        it('should have layersource topojson', () => {
            expect(layerService.layerSources.hasOwnProperty('topojson')).toBeTruthy();
        });
        it('should have layersource dynamicgeojson', () => {
            expect(layerService.layerSources.hasOwnProperty('dynamicgeojson')).toBeTruthy();
        });
        it('should have layersource wms', () => {
            expect(layerService.layerSources.hasOwnProperty('wms')).toBeTruthy();
        });
        it('should have layersource tilelayer', () => {
            expect(layerService.layerSources.hasOwnProperty('tilelayer')).toBeTruthy();
        });
        it('should have layersource heatmap', () => {
            expect(layerService.layerSources.hasOwnProperty('heatmap')).toBeTruthy();
        });
        it('should have layersource hierarchy', () => {
            expect(layerService.layerSources.hasOwnProperty('hierarchy')).toBeTruthy();
        });
        it('should have layersource grid', () => {
            expect(layerService.layerSources.hasOwnProperty('grid')).toBeTruthy();
        });
        it('should have layersource daynight', () => {
            expect(layerService.layerSources.hasOwnProperty('daynight')).toBeTruthy();
        });
    });

    describe('Load required layers', () => {
        it('should call function getRequiredLayers', () => {
            var projLayer = new csComp.Services.ProjectLayer();
            projLayer.type = 'heatmap';
            spyOn(layerService.layerSources['heatmap'], 'getRequiredLayers');
            layerService.loadRequiredLayers(projLayer);
            expect(layerService.layerSources['heatmap'].getRequiredLayers).toHaveBeenCalled();
        });
    });

    describe('Add layers', () => {
        var fakeLayer = new csComp.Services.ProjectLayer();
        var emptyLayer = new csComp.Services.ProjectLayer();
        emptyLayer.enabled = false;
        fakeLayer.type = 'fake';
        fakeLayer.group = new csComp.Services.ProjectGroup();
        fakeLayer.group.oneLayerActive = true;
        fakeLayer.group.layers = [];
        fakeLayer.group.layers.push(emptyLayer);

        it('should publish to layer and updatelegend', () => {
            layerService.addLayer(fakeLayer);
            expect(msgBusService.publish).toHaveBeenCalledWith('layer', 'loading', fakeLayer);
        });
        xit('should call loadTypeResources', () => {
            spyOn(layerService, 'loadTypeResources');
            layerService.addLayer(fakeLayer);
            expect(layerService.loadTypeResources).toHaveBeenCalled();
        });
        xit('should call loadRequiredLayers', () => {
            spyOn(layerService, 'loadRequiredLayers');
            layerService.addLayer(fakeLayer);
            expect(layerService.loadRequiredLayers).toHaveBeenCalled();
        });
    });


    describe('Open solution', () => {
        var $httpBackend;
        beforeEach(inject(($injector) => {
            $httpBackend = $injector.get('$httpBackend');
        }));

        it('should load projects.json',()=>{
            $httpBackend.expectGET('projects.json');
            $httpBackend.when('GET', 'projects.json')
                .respond({});

            layerService.openSolution('projects.json');

            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
        });

        it('should parse projects.json correctly',()=>{
            $httpBackend.expectGET('projects.json');
            $httpBackend.when('GET', 'projects.json')
                .respond(mockSolution);

            // Mock for data sources...
            $httpBackend.expectGET(mockProject.datasources[0].url);
            $httpBackend.when('GET', mockProject.datasources[0].url)
                .respond(mockDatasource);

            // $httpBackend.expectGET(mockSolution.projects[0].url);
            $httpBackend.when('GET', mockSolution.projects[0].url)
                .respond(mockProject);

            // Hacky map initialization...
            layerService.$mapService = mapService;
            layerService.$mapService.map = <L.Map>{};
            layerService.$mapService.map.addLayer = function(group: any) { return null; };
            layerService.selectRenderer('leaflet');
            layerService.$mapService.map.setMaxBounds = function (a:any, b:any) {
                // return new L.Map('mapId', {maxBounds: mockSolution.maxBounds});
                return <L.Map>{};
            };
            layerService.$mapService.baseLayers = {};
            layerService.map = layerService.$mapService;

            layerService.openSolution('projects.json');

            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();

            // the project defined in the solution should be opened
            expect(layerService.loadedLayers).toEqual(new csComp.Helpers.Dictionary<csComp.Services.ProjectLayer>());
            expect(layerService.maxBounds).toEqual(mockSolution.maxBounds);
            expect(mapService.baseLayers.hasOwnProperty(mockSolution.baselayers[0].title)).toBeTruthy();

            // Flush and verify calls to datasources
            expect(layerService.project.dashboards.length).toEqual(4);
            expect(layerService.project.datasources.length).toEqual(1);

            var ds;
            layerService.findSensorSet('datasource/test', (cb) => {ds = cb;} );
            expect(ds.id).toEqual('test');
        });
    });

    describe('Remove layer', () => {
        xit('Should remove layer',()=>{
            //layerService.project = new csComp.Services.Project();
        });
    })
});
