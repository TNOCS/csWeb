describe('ProjectGroup', function () {
    it('should construct a new group', function () {
        var pg = new csComp.Services.ProjectGroup();
        expect(pg).toBeDefined();
    });
    var projectgroup;
    beforeEach(function () {
        projectgroup = new csComp.Services.ProjectGroup();
    });
    describe('initial state', function () {
        it('should have an undefined id and title', function () {
            expect(projectgroup.id).toBeUndefined();
            expect(projectgroup.title).toBeUndefined();
        });
    });
    describe('setting stuff after initialization', function () {
        it('should set stuff properly', function () {
            projectgroup.id = 'newName';
            projectgroup.title = 'newTitle';
            expect(projectgroup.id).toEqual('newName');
            expect(projectgroup.title).toEqual('newTitle');
        });
        it('should return serializable data', function () {
            projectgroup.id = 'newName';
            projectgroup.title = 'newTitle';
            projectgroup.ndx = 'something';
            var result = csComp.Services.ProjectGroup.serializeableData(projectgroup);
            expect(result.id).toEqual('newName');
            expect(result.title).toEqual('newTitle');
            expect(result.ndx).toBeUndefined();
        });
    });
});
