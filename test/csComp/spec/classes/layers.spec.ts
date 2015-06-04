describe('Project Layers', function() {
    it('Should construct a new layer', () => {
        var p = new csComp.Services.ProjectLayer();
        expect(p).toBeDefined();
    });

    var layer: csComp.Services.ProjectLayer;
    beforeEach(() => {
        layer = new csComp.Services.ProjectLayer();
    });

    describe('initial state', () => {
        it('Should have an empty markers object', function() {
            expect(layer.id).toBeUndefined();
        });

        describe('setting stuff after initialization', () => {
            it('Should set stuff properly', function() {
                layer.id = 'newLayer';
                expect(layer.id).toEqual('newLayer');
            });

            it('should serialize id', function() {
                layer.id = 'newLayer';
                var result = csComp.Services.ProjectLayer.serializeableData(layer);
                expect(result['id'] === 'newLayer').toBeTruthy();
            });

            it('should not serialize isLoading', function() {
                layer.isLoading = true;
                var result = csComp.Services.ProjectLayer.serializeableData(layer);
                expect(result.hasOwnProperty('isLoading')).toBeFalsy(); 
            });
        });
    });

});
