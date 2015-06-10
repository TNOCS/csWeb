describe('Project', function() {
    it('should construct a new project', () => {
        var p = new csComp.Services.Project();
        expect(p).toBeDefined();
    });

    var project: csComp.Services.Project;
    beforeEach(() => {
        project = new csComp.Services.Project();
    });

    describe('Initial state', () => {
        it('should have an empty markers object', function() {
            expect(project.markers).toEqual({});
        });

        it('should have an empty groups object', function() {
            expect(project.groups).toBeUndefined();
        });

        it('should have expertise set to expert', function () {
            expect(project.expertMode === csComp.Services.Expertise.Expert).toBeTruthy();
        });

        describe('setting stuff after initialization', () => {
            it('should set stuff properly', function() {
                project.id = 'newName';
                expect(project.id).toEqual('newName');
            });

            it('should still work after serialization', function() {
                project.id = 'newName';
                project.title = 'testTitle';
                var result = project.serialize();
                expect(result).toContain('newName');
                expect(result).toContain('testTitle');
            });

            it('should still work after deserialization', function() {
                project.title = 'testTitle';
                var result = project.serialize();
                var dProject = csComp.Services.Project.prototype.deserialize(project);
                expect(dProject.timeLine).toBeUndefined();
                expect(dProject.id).toEqual(project.title);
            });
        });
    });
});

describe('DateRange', function() {
    var dr: csComp.Services.DateRange;
    beforeEach(() => {
        dr = new csComp.Services.DateRange();
    });

    it('should construct a new DateRange', () => {
        expect(dr).toBeDefined();
    });

    it('should deserialize properly when no focus time is set', () => {
        spyOn(Date, 'now').and.returnValue(new Date(100).getTime());
        var result = csComp.Services.DateRange.deserialize(dr);
        expect(result).toBeDefined();
        expect(result.focus).toEqual(new Date(100).getTime());
        expect(result.focus).not.toEqual(new Date(101).getTime());
    });

    it('should deserialize properly when a focus time is set', () => {
        dr.focus = new Date(100).getTime();
        var result = csComp.Services.DateRange.deserialize(dr);
        expect(result).toBeDefined();
        expect(result.focus).toEqual(new Date(100).getTime());
    });

    it('should set a focus time properly', () => {
        expect(dr.zoomLevel).toBeUndefined();
        var d = new Date(100);
        var s = new Date(50);
        var e = new Date(200);
        dr.setFocus(d, s, e);
        expect(dr.zoomLevel).toBeDefined();
    });

    it('should set a start and end time properly', () => {
        dr.range = 1000;
        var d = new Date(25);
        var s = new Date(50);
        var e = new Date(10);
        dr.setFocus(d, s, e);
        expect(dr.startDate()).toBeDefined();
        expect(dr.focusDate()).toBeDefined();
        expect(dr.endDate()).toBeDefined();
    });
});
