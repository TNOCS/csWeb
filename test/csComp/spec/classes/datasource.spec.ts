describe('DataSource', function() {
    it('should construct a new datasource', () => {
        var ds = new csComp.Services.DataSource();
        expect(ds).toBeDefined();
    });

    var datasource: csComp.Services.DataSource;
    beforeEach(() => {
        datasource = new csComp.Services.DataSource();
    });

    beforeEach(module('mockedDataSource'));
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
        it('should load the data with the correct path', function() {
            spyOn($, 'getJSON');
            datasource.url = './path/to/json';
            csComp.Services.DataSource.LoadData(datasource, () => { });
            expect($.getJSON).toHaveBeenCalledWith('./path/to/json', jasmine.any(Function));
        });

        it('should parse the data correctly', function() {
            //var jsonSpy = spyOn($, 'getJSON').and.callFake(function(url, callback) {
            //    callback({ 'id' : 'datasource', 'title' : 'test', 'sensors' : {'test' : {'id' : 'test', 'timestamps': [1, 2], 'values' : [2, 3] } } });
            //});
            var jsonSpy = spyOn($, 'getJSON').and.callFake(function(url, callback) {
               callback(mockJSON);
            });
            datasource.url = 'test.json';
            csComp.Services.DataSource.LoadData(datasource, () => {
            });

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
