describe('DataSource', function () {
    it('should construct a new datasource', function () {
        var ds = new csComp.Services.DataSource();
        expect(ds).toBeDefined();
    });
    var datasource;
    beforeEach(function () {
        datasource = new csComp.Services.DataSource();
    });
    describe('initial state', function () {
        it('should have an undefined id and index', function () {
            expect(datasource.id).toBeUndefined();
            expect(datasource.url).toBeUndefined();
        });
    });
    describe('setting stuff after initialization', function () {
        it('should set stuff properly', function () {
            datasource.id = 'newName';
            datasource.url = 'www.nl';
            expect(datasource.id).toEqual('newName');
            expect(datasource.url).toEqual('www.nl');
        });
    });
    describe('loading a datafile', function () {
        xit('should parse the data properly', function () {
            datasource.url = 'path/to/json';
            csComp.Services.DataSource.LoadData(datasource, function () { });
        });
    });
});
describe('SensorSet', function () {
    it('should construct a new sensorset', function () {
        var s = new csComp.Services.SensorSet();
        expect(s).toBeDefined();
    });
    var sensorset;
    beforeEach(function () {
        sensorset = new csComp.Services.SensorSet();
    });
    describe('initial state', function () {
        it('should have an undefined id and index', function () {
            expect(sensorset.id).toBeUndefined();
            expect(sensorset.title).toBeUndefined();
        });
    });
    describe('setting stuff after initialization', function () {
        it('should set stuff properly', function () {
            sensorset.id = 'newName';
            sensorset.title = 'www.nl';
            expect(sensorset.id).toEqual('newName');
            expect(sensorset.title).toEqual('www.nl');
        });
    });
});
