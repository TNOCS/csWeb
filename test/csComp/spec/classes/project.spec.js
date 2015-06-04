describe('Project', function () {
    it('should construct a new project', function () {
        var p = new csComp.Services.Project();
        expect(p).toBeDefined();
    });
    var project;
    beforeEach(function () {
        project = new csComp.Services.Project();
    });
    describe('initial state', function () {
        it('should have an empty markers object', function () {
            expect(project.markers).toEqual({});
        });
        it('should have an empty groups object', function () {
            expect(project.groups).toBeUndefined();
        });
        it('should have expertise set to expert', function () {
            expect(project.expertMode === csComp.Services.Expertise.Expert).toBeTruthy();
        });
        describe('setting stuff after initialization', function () {
            it('should set stuff properly', function () {
                project.id = 'newName';
                expect(project.id).toEqual('newName');
            });
            it('should still work after serialization', function () {
                project.id = 'newName';
                project.title = 'testTitle';
                var result = project.serialize();
                expect(result).toContain('newName');
                expect(result).toContain('testTitle');
            });
        });
    });
});
