describe('Widget', function() {
    it('should construct a new widget', () => {
        var w = new csComp.Services.Widget();
        expect(w).toBeDefined();
    });
});


describe('BaseWidget', function() {
    it('should construct a new BaseWidget', () => {
        var bw = new csComp.Services.BaseWidget();
        expect(bw).toBeDefined();
    });

    var basewidget: csComp.Services.BaseWidget;
    beforeEach(() => {
        basewidget = new csComp.Services.BaseWidget();
    });

    describe('initial state', () => {
        it('should have an undefined url and empty data object', function() {
            expect(basewidget.url).toBeUndefined();
            expect(basewidget.enabled).toBeTruthy();
        });
    });

    describe('initial constructed state', () => {
        it('should have an undefined url and empty data object', function() {
            var tempbasewidget = new csComp.Services.BaseWidget('newTitle');
            expect(tempbasewidget.title).toEqual('newTitle');
            expect(tempbasewidget.properties).toEqual({});
        });
    });

    describe('getting serializable data', () => {
        it('should return serializable data', function() {
            basewidget.id = 'newName';
            basewidget.title = 'newTitle';
            basewidget.dataSets = [];
            var result: any = csComp.Services.BaseWidget.serializeableData(basewidget);
            expect(result.id).toEqual('newName');
            expect(result.title).toEqual('newTitle');
            expect(result.dataSets).toBeUndefined();
        });
    });
});
