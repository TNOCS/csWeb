describe('DataSource', function() {
    it('should construct a new datasource', () => {
        var ds = new csComp.Services.DataSource();
        expect(ds).toBeDefined();
    });

    var datasource: csComp.Services.DataSource;
    beforeEach(() => {
        datasource = new csComp.Services.DataSource();
    });

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
        xit('should parse the data properly', function() {
            datasource.url = 'path/to/json';
            csComp.Services.DataSource.LoadData(datasource, () => {});
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
