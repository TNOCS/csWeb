describe('ProjectGroup', function() {
    it('should construct a new group', () => {
        var pg = new csComp.Services.ProjectGroup();
        expect(pg).toBeDefined();
    });

    var projectgroup: csComp.Services.ProjectGroup;
    beforeEach(() => {
        projectgroup = new csComp.Services.ProjectGroup();
    });

    describe('Projectgroup initial state', () => {
        it('should have an undefined id and title', function() {
            expect(projectgroup.id).toBeUndefined();
            expect(projectgroup.title).toBeUndefined();
        });
    });

    describe('setting stuff after initialization', () => {
        it('should set stuff properly', function() {
            projectgroup.id = 'newName';
            projectgroup.title = 'newTitle';
            expect(projectgroup.id).toEqual('newName');
            expect(projectgroup.title).toEqual('newTitle');
        });

        it('should return serializable data', function() {
            projectgroup.id = 'newName';
            projectgroup.title = 'newTitle';
            projectgroup.ndx = 'something';
            var result: any = csComp.Services.ProjectGroup.serializeableData(projectgroup);
            expect(result.id).toEqual('newName');
            expect(result.title).toEqual('newTitle');
            expect(result.ndx).toBeUndefined();
        });
    });

    describe('Loading data from OWS service', () =>{
        var targetURL = '/ows';
        var $httpBackend;
        var $myInjector;
        var fakeXML;

        beforeEach(module("mockedOWSXML"));
        beforeEach(inject(($injector, defaultXML) => {
            $httpBackend = $injector.get('$httpBackend');
            $myInjector = $injector;
            fakeXML = defaultXML;
        }));

        it('should load some layers', () => {
            $httpBackend.whenGET(targetURL).respond(200, fakeXML);

            projectgroup.owsurl = targetURL;
            projectgroup.loadLayersFromOWS($myInjector);

            $httpBackend.expectGET(targetURL);
            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();

            expect(projectgroup.layers).not.toBe(null);
            expect(projectgroup.layers.length).toBeGreaterThan(0);
        });
    });
});


class MockColorTranslation{
    then = function(translation) {
        translation('color');
    }
    constructor() {}
};

describe('csComp.Services.GroupStyle', function() {

    // load the module
    beforeEach(module('csComp'));

    var mockTranslate;
    beforeEach(() => {
        module(function($provide) {
            $provide.value('$translate', mockTranslate);
        });
        mockTranslate = function(key) {
            var mct = new MockColorTranslation();
            return mct;
        };
    });

    var groupStyle: csComp.Services.GroupStyle;
    var translate;
    beforeEach(inject(function($translate) {
        translate = $translate;
        groupStyle = new csComp.Services.GroupStyle(translate);
    }));

    describe('Groupstyle initial state', () => {
        it('should have an undefined id and title', function() {
            expect(groupStyle.id).toBeUndefined();
            expect(groupStyle.title).toBeUndefined();
        });
    });
});
