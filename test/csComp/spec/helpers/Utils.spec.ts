describe('Utils', function() {

    describe('Initial state', () => {
        it('should have constructed a new utils class', function() {
            var ut = new csComp.Utils();
            expect(ut).toBeDefined();
            expect(csComp.Utils.loadedFiles).toEqual([]);
        });
        it('should load a js file ', function() {
            var dummy = 0;
            var js = csComp.Utils.loadJsCssfile('test.js', csComp.FileType.Js, ()=> {});
            expect(csComp.Utils.loadedFiles).toContain('test.js');
        });
        it('should load a css file ', function() {
            var css = csComp.Utils.loadJsCssfile('test.cs', csComp.FileType.Css, ()=> {});
            expect(csComp.Utils.loadedFiles).toContain('test.cs');
        });
        it('should notload a css file if its already loaded', function() {
            var css1 = csComp.Utils.loadJsCssfile('test.cs', csComp.FileType.Css);
            var css2 = csComp.Utils.loadJsCssfile('test.cs', csComp.FileType.Css);
            expect(csComp.Utils.loadedFiles.length).toEqual(2);
        });
    });
});
