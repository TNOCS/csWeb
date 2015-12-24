describe('csComp.Services.LayerService', function() {

    // load the module
    beforeEach(angular.mock.module('csComp'));
    beforeEach(angular.mock.module('solutionMock'));
    beforeEach(angular.mock.module('projectMock'));
    beforeEach(angular.mock.module('mockedDataSource'));

    beforeEach(angular.mock.module(function($provide) {
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
        var $httpBackend: ng.IHttpBackendService;
        beforeEach(inject(($injector) => {
            $httpBackend = $injector.get('$httpBackend');
        }));

        it('should load projects.json', () => {
            $httpBackend.expectGET('projects.json');
            $httpBackend.whenGET('projects.json')
                .respond({});

            layerService.openSolution('projects.json');

            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
        });

        xit('should parse projects.json correctly', () => {
            let i = 0;
            $httpBackend.expectGET('projects.json');
            $httpBackend.whenGET('projects.json')
                .respond(mockSolution);

            // Mock for data sources...
            $httpBackend.expectGET(mockProject.datasources[0].url);
            $httpBackend.whenGET(mockProject.datasources[0].url)
                .respond(mockDatasource);

            // $httpBackend.expectGET(mockSolution.projects[0].url);
            $httpBackend.whenGET(mockSolution.projects[0].url)
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

            // the project defined in the solution should be opened
            console.log('OK: ' + ++i);
            expect(layerService.loadedLayers).toEqual(new csComp.Helpers.Dictionary<csComp.Services.ProjectLayer>());
            console.log('OK: ' + ++i);
            expect(layerService.maxBounds).toEqual(mockSolution.maxBounds);
            console.log('OK: ' + ++i);
            console.log('LS: ' + JSON.stringify(mapService.baseLayers, null, 2));
            expect(mapService.baseLayers.hasOwnProperty(mockSolution.baselayers[0].title)).toBeTruthy();

            console.log('OK: ' + ++i);
            expect(layerService.project.dashboards.length).toEqual(4);
            console.log('OK: ' + ++i);
            expect(layerService.project.datasources.length).toEqual(1);

            var ds;
            layerService.findSensorSet('datasource/test', (cb) => {ds = cb;} );
            console.log('OK: ' + ++i);
            expect(ds.id).toEqual('test');

            // Flush and verify calls to datasources
            console.log('OK: ' + ++i);
            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
        });
    });

    describe('Remove layer', () => {
        xit('should remove layer', () => {
            //layerService.project = new csComp.Services.Project();
        });
    });

    describe('Calculating property info', () => {
        it('should calculate the basic statistical functions', () => {
            var layer = <csComp.Services.ProjectLayer> {
                type: 'fake',
                id: 'people',
                enabled: true
            };
            var group = <csComp.Services.ProjectGroup>{
                layers: [ layer ]
            };
            layerService.project = new csComp.Services.Project();
            layerService.project.features = [];
            layerService.project.features.push(<csComp.Services.IFeature> {
                index: 0,
                layerId: 'people',
                layer: layer,
                geometry: <csComp.Services.IGeoJsonGeometry>{},
                effectiveStyle: {},
                lastUpdated: Date.now(),
                timestamps: [],
                properties: {
                    'people': 10
                },
                _gui:<csComp.Services.IGuiObject>{}
            });
            layerService.project.features.push(<csComp.Services.IFeature> {
                index: 0,
                layerId: 'people',
                layer: layer,
                geometry: <csComp.Services.IGeoJsonGeometry>{},
                effectiveStyle: {},
                lastUpdated: Date.now(),
                timestamps: [],
                properties: {
                    'people': 20
                },
                _gui:<csComp.Services.IGuiObject>{}
            });
            layerService.project.features.push(<csComp.Services.IFeature> {
                index: 0,
                layerId: 'people',
                layer: layer,
                geometry: <csComp.Services.IGeoJsonGeometry>{},
                effectiveStyle: {},
                lastUpdated: Date.now(),
                timestamps: [],
                properties: {
                    'people': 30
                },
                _gui:<csComp.Services.IGuiObject>{}
            });
            var stats = layerService.calculatePropertyInfo(group, 'people');
            expect(stats.count).toBe(3);
            expect(stats.min).toBe(10);
            expect(stats.max).toBe(30);
            expect(stats.mean).toBe(20);
            expect(stats.varience).toBeCloseTo(66.667, 0.001);
            expect(stats.sd).toBeCloseTo(8.165, 0.001);
        });
    });
});
