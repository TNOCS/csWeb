describe('ProjectGroup', function() {
    it('should construct a new group', () => {
        var pg = new csComp.Services.ProjectGroup();
        expect(pg).toBeDefined();
    });

    var projectgroup: csComp.Services.ProjectGroup;
    beforeEach(() => {
        projectgroup = new csComp.Services.ProjectGroup();
    });

    describe('initial state', () => {
        it('should have an undefined id and title', function() {
            expect(projectgroup.id).toBeUndefined();
            expect(projectgroup.title).toBeUndefined();
        });
    });

    describe('setting stuff after initialization', () => {
        it('should set stuff properly', function() {
            projectgroup.id = 'newName';
            projectgroup.title = 'newTitle';
            expect(projectgroup.id).toEqual('newName');
            expect(projectgroup.title).toEqual('newTitle');
        });

        it('should return serializable data', function() {
            projectgroup.id = 'newName';
            projectgroup.title = 'newTitle';
            projectgroup.ndx = 'something';
            var result: any = csComp.Services.ProjectGroup.serializeableData(projectgroup);
            expect(result.id).toEqual('newName');
            expect(result.title).toEqual('newTitle');
            expect(result.ndx).toBeUndefined();
        });
    });
});
