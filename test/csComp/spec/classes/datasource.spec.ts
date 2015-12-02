describe('DataSource', function() {
    it('should construct a new datasource', () => {
        var ds = new csComp.Services.DataSource();
        expect(ds).toBeDefined();
    });

    var datasource: csComp.Services.DataSource;
    beforeEach(() => {
        datasource = new csComp.Services.DataSource();
    });

    // See also: https://netdevplus.wordpress.com/2015/10/20/angularjs-with-typescript-unit-testing-services/
    beforeEach(angular.mock.module('mockedDataSource'));
    var mockJSON;
    beforeEach(inject(function(defaultJSON) {
        mockJSON = defaultJSON;
    }));

    describe('initial state', () => {
        it('should have an undefined id and index', function() {
            expect(datasource.id).toBeUndefined();
            expect(datasource.url).toBeUndefined();
        });
    });

    describe('setting stuff after initialization', () => {
        it('should set stuff properly', function() {
            datasource.id = 'newName';
            datasource.url = 'www.nl';
            expect(datasource.id).toEqual('newName');
            expect(datasource.url).toEqual('www.nl');
        });
    });

    describe('loading a datafile', () => {
        var $http;
        var $httpBackend;
        var targetURL = './path/to/json';

        beforeEach(inject(($injector) => {
            $http = $injector.get('$http');
            $httpBackend = $injector.get('$httpBackend');
            $httpBackend.when('GET', targetURL).respond(200, mockJSON);
        }));

        it('should load the data with the correct path', function() {
            $httpBackend.expectGET(targetURL);

            datasource.url = targetURL;
            csComp.Services.DataSource.LoadData($http, datasource, () => { });

            $httpBackend.flush();
        });

        it('should parse the data correctly', function() {
            $httpBackend.expectGET(targetURL);

            datasource.url = targetURL;
            csComp.Services.DataSource.LoadData($http, datasource, () => {});

            $httpBackend.flush();

            expect(datasource.id).toEqual('datasource');
            expect(datasource.hasOwnProperty('sensors')).toBeTruthy();
            expect(datasource.sensors.hasOwnProperty('test')).toBeTruthy();
        });
    });
});

describe('SensorSet', function() {
    it('should construct a new sensorset', () => {
        var s = new csComp.Services.SensorSet();
        expect(s).toBeDefined();
    });

    var sensorset: csComp.Services.SensorSet;
    beforeEach(() => {
        sensorset = new csComp.Services.SensorSet();
    });

    describe('initial state', () => {
        it('should have an undefined id and index', function() {
            expect(sensorset.id).toBeUndefined();
            expect(sensorset.title).toBeUndefined();
        });
    });

    describe('setting stuff after initialization', () => {
        it('should set stuff properly', function() {
            sensorset.id = 'newName';
            sensorset.title = 'www.nl';
            expect(sensorset.id).toEqual('newName');
            expect(sensorset.title).toEqual('www.nl');
        });
    });
});
