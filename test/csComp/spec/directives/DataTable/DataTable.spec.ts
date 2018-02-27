describe('DataTable.DataTable', function() {

    var httpBackend: ng.IHttpBackendService;
    var $compile: ng.ICompileService;

    var scope, $templateCache, $translate, $sce;
    var element, compiled, mockTranslate, angElement;
    var layerService: csComp.Services.LayerService;
    var vm: DataTable.DataTableCtrl;

    // load the module
    beforeEach(angular.mock.module('csComp'));
    beforeEach(angular.mock.module('csWebApp'));

    // var mockTranslate;
    // beforeEach(() => {
    //     angular.mock.module(function($provide) {
    //         $provide.value('$translate', mockTranslate);
    //     });
    //     mockTranslate = function(key) {
    //         var mct = new ColorTranslationMock.MockColorTranslation();
    //         return mct;
    //     };
    // });

    beforeEach(angular.mock.inject(($rootScope: ng.IRootScopeService, _$compile_, _$templateCache_, _$httpBackend_, _$sce_, _layerService_, _$translate_) => {
        scope = $rootScope.$new();
        httpBackend = _$httpBackend_;
        $sce = _$sce_;
        layerService = _layerService_;
        $translate = _$translate_;
        httpBackend.whenGET('bower_components/angularUtils-pagination/dirPagination.tpl.html').respond({});
        $compile = _$compile_;
        $templateCache = _$templateCache_;
        element = $templateCache.get('directives/DataTable/DataTable.tpl.html');
        element = '<datatable>' + element + '</datatable>';
        angElement = angular.element(element);
        compiled = $compile(angElement)(scope);
        scope.$digest();
        vm = compiled.isolateScope().vm;
    }));

    it('scope to be defined', () => {
        expect(scope).toBeDefined();
    });

    describe('Initial template', () => {
        it('should contain the string selectedLayerId', () => {
            // console.log(JSON.stringify(element, null, 2));
            // expect(true).toBe(true);
            expect(element).toContain('selectedLayerId');
        });
    });

    describe('DataTableCtrl', () => {
        it('should have mapLabel map', () => {
            expect(compiled.isolateScope().vm.mapLabel).toEqual('map');
        });
    });

    // describe('DataTableCtrl', () => {
    //     it('should have a function updateLayerOptions', () => {
    //         expect(vm.layerOptions.length).toEqual(0);
    //         spyOn(vm, 'updateLayerOptions').and.callThrough();
    //         vm.updateLayerOptions();
    //         expect(vm.updateLayerOptions).toHaveBeenCalled();
    //         expect(vm.layerOptions.length).toEqual(1);
    //     });
    // });
    //
    // describe('DataTableCtrl', () => {
    //     it('should have a function loadLayer', () => {
    //         spyOn(vm, 'loadLayer').and.callThrough();
    //         vm.loadLayer();
    //         expect(vm.loadLayer).toHaveBeenCalled();
    //     });
    //     it('should have a function loadLayer', () => {
    //         vm.
    //         vm.selectedLayerId = 'map';
    //         spyOn(vm, 'loadLayer').and.callThrough();
    //         vm.loadLayer();
    //         expect(vm.loadLayer).toHaveBeenCalled();
    //     });
    // });
    //
    describe('DataTableCtrl', () => {
        it('should have a function getRows', () => {
            spyOn(vm, 'getRows').and.callThrough();
            var rows = vm.getRows();
            expect(vm.getRows).toHaveBeenCalled();
            expect(rows).toEqual([]);
        });
    });
    describe('DataTableCtrl', () => {
        it('should have a function sortOrderClass', () => {
            var result = vm.sortOrderClass(2, false);
            expect(result).toEqual('fa fa-sort');
            result = vm.sortOrderClass(2, null);
            expect(result).toEqual('fa fa-sort');
            vm.sortingColumn = 2;
            result = vm.sortOrderClass(2, true);
            expect(result).toEqual('fa fa-sort-desc');
        });
    });
    describe('DataTableCtrl', () => {
        it('should have a function orderBy', () => {
            var tf1 = new DataTable.TableField('21', 21, 'number', 'Number1');
            var tf2 = new DataTable.TableField('22', 22, 'number', 'Number2');
            var tf3 = new DataTable.TableField('23', 23, 'number', 'Number3');
            var tf4 = new DataTable.TableField('24', 24, 'number', 'Number1');
            var tf5 = new DataTable.TableField('25', 25, 'number', 'Number2');
            var tf6 = new DataTable.TableField('26', 26, 'number', 'Number3');
            var row1 = []; row1.push(tf1); row1.push(tf2); row1.push(tf3);
            var row2 = []; row2.push(tf4); row2.push(tf5); row2.push(tf6);
            vm.rows.push(row1); vm.rows.push(row2);
            var rows = vm.orderBy(0, false);
            expect(vm.rows.length).toEqual(2);
            expect(vm.rows[0].length).toEqual(3);
            expect(vm.rows[0][0].displayValue).toEqual('24');
            rows = vm.orderBy(0, true);
            expect(vm.rows[0][0].displayValue).toEqual('21');
        });
    });
    describe('DataTableCtrl', () => {
        it('should have a function toTrusted', () => {
            var result = vm.toTrusted(null);
            expect(result).toEqual(null);
            spyOn($sce, 'trustAsHtml').and.returnValue('mock');
            result = vm.toTrusted('<div></div>');
            expect(result).toEqual('mock');
        });
    });
    // describe('DataTableCtrl', () => {
    //     xit('should create a GeoJson', () => {
    //         var result = vm.downloadGeoJson();
    //     });
    // });
    // describe('DataTableCtrl', () => {
    //     xit('should create a Csv', () => {
    //         var result = vm.downloadCsv();
    //     });
    // });
});
