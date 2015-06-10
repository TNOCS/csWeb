describe('DataTable.DataTable', function() {

    var scope, httpBackend, $compile, $templateCache;
    var element;

    // load the module
    beforeEach(module('csComp'));
    beforeEach(module('csWebApp'));

    beforeEach(inject(function ($rootScope, _$compile_, _$templateCache_, $httpBackend) {
        scope = $rootScope.$new();
        httpBackend = $httpBackend;
        httpBackend.when("GET", 'bower_components/angular-utils-pagination/dirPagination.tpl.html').respond();
        $compile = _$compile_;
        $templateCache = _$templateCache_;
        element = $templateCache.get('directives/DataTable/DataTable.tpl.html');
      }));

    describe('Initial template', () => {
        it('should contain the string selectedLayerId', () => {
            expect(element).toContain('selectedLayerId');
        });
    });

    //Does not work yet
    describe('Compiling template', () => {
        xit('should compile correctly', () => {
            scope = $compile(element)(scope);
            scope.$digest(); // Digest is not a function???
            expect(scope).toBeDefined();
        });
    });
});
