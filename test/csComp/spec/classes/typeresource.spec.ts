describe('TypeResource', function() {
        it('should construct a new TypeResource object', () => {
            var tr = new csComp.Services.TypeResource();
            expect(tr).toBeDefined();
        });

    var typeresource: csComp.Services.TypeResource;
    beforeEach(() => {
        typeresource = new csComp.Services.TypeResource();
    });

    describe('initial state', () => {
        it('should have an undefined url and featureTypes', function() {
            expect(typeresource.url).toBeUndefined();
            expect(typeresource.featureTypes).toBeUndefined();
        });
    });

    describe('setting stuff after initialization', () => {
        it('should set stuff properly', function() {
            typeresource.url = 'newUrl';
            var featTypes : csComp.Services.IProperty = {};
            var ft : csComp.Services.IFeature;
            featTypes['key'] = ft;
            typeresource.featureTypes = featTypes;
            expect(typeresource.url).toEqual('newUrl');
            expect(typeresource.featureTypes.hasOwnProperty('key')).toBeTruthy();
            expect(typeresource.featureTypes.hasOwnProperty('notPresent')).toBeFalsy();
        });
    });
});
