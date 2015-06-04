describe('Feature', function () {
    it('should construct a new feature', function () {
        var f = new csComp.Services.Feature();
        expect(f).toBeDefined();
    });
    var feature;
    beforeEach(function () {
        feature = new csComp.Services.Feature();
    });
    describe('initial state', function () {
        it('should have an undefined id and index', function () {
            expect(feature.id).toBeUndefined();
            expect(feature.index).toBeUndefined();
        });
    });
    describe('setting stuff after initialization', function () {
        it('should set stuff properly', function () {
            feature.id = 'newName';
            feature.index = 42;
            expect(feature.id).toEqual('newName');
            expect(feature.index).toEqual(42);
        });
    });
});
describe('PropertyInfo', function () {
    it('should construct a new propertyInfo object', function () {
        var pi = new csComp.Services.PropertyInfo();
        expect(pi).toBeDefined();
    });
    var propinfo;
    beforeEach(function () {
        propinfo = new csComp.Services.Feature();
    });
    describe('initial state', function () {
        it('should have an undefined id and index', function () {
            expect(propinfo.id).toBeUndefined();
            expect(propinfo.index).toBeUndefined();
        });
    });
    describe('setting stuff after initialization', function () {
        it('should set stuff properly', function () {
            propinfo.id = 'newName';
            propinfo.index = 42;
            expect(propinfo.id).toEqual('newName');
            expect(propinfo.index).toEqual(42);
        });
    });
});
