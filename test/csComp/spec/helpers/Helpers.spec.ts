class SerializeableClass {
    id: string;

    public static serializeableData(SerializeableClass): Object {
        return { id: SerializeableClass.id };
    };
};

describe('Helpers spec:', function() {
    beforeEach(angular.mock.module('csComp'));

    var mockTranslate;
    beforeEach(function() {
        angular.mock.module(function($provide) {
            $provide.value('$translate', mockTranslate);
        });
        mockTranslate = function(key) {
            var mct = new ColorTranslationMock.MockColorTranslation();
            return mct;
        };
    });

    var groupStyle, translate;
    beforeEach(inject(function($translate, _$document_) {
        translate = $translate;
        groupStyle = new csComp.Services.GroupStyle(translate);
    }));

    describe('Initial state', () => {
        it('should serialize an object', function() {
            var sc = new SerializeableClass();
            sc.id = 'test';
            var scArray = [];
            scArray.push(sc);
            var result = csComp.Helpers.serialize<SerializeableClass>(scArray, SerializeableClass.serializeableData);
            expect(result.length).toEqual(1);
            var resultObj: any = result[0];
            expect(resultObj.id).toEqual('test');
        });

        it('should save data', function() {
            var e = document.createElement('a');
            e.click = () => {};
            spyOn(document, 'createElement').and.returnValue(e);
            var data = '{"testKey": "testVal"}';
            csComp.Helpers.saveData(data, 'fileName', 'txt');
            expect(document.createElement).toHaveBeenCalledWith('a');
        });

        it('should calculate standard deviation', function() {
            var values = [1, 2, 3, 4, 5, 6, 7, 8];
            var result = csComp.Helpers.standardDeviation(values);
            expect(result.stdDev).toBeCloseTo(2.29, 2);
            expect(result.avg).toBeCloseTo(4.5, 2);
        });

        it('should get property types', function() {
            var type = <csComp.Services.IFeatureType>{};
            var propertyTypeData = <csComp.Services.IPropertyTypeData>{};
            var result = csComp.Helpers.getPropertyTypes(type, propertyTypeData);
            expect(result).toEqual([]);
            var propertyType = <csComp.Services.IPropertyType>{};
            type._propertyTypeData = [];
            type._propertyTypeData.push(propertyType);
            result = csComp.Helpers.getPropertyTypes(type, propertyTypeData);
            expect(result.length).toEqual(1);
            type.propertyTypeKeys = 'test';
            result = csComp.Helpers.getPropertyTypes(type, propertyTypeData);
            expect(result.length).toEqual(1);
            propertyTypeData['test'] = propertyType;
            result = csComp.Helpers.getPropertyTypes(type, propertyTypeData);
            expect(result.length).toEqual(2);
        });

        // TODO Add test where the rt is not null!
        it('should add property types', function() {
            var f = <csComp.Services.IFeature>{},
                ft = <csComp.Services.IFeatureType>{},
                rt = <csComp.Services.TypeResource>{};
            var result = csComp.Helpers.addPropertyTypes(f, ft, rt);
            expect(result).toEqual(ft);
            f.properties = {};
            f.properties['test'] = 0;
            ft._propertyTypeData = [];
            result = csComp.Helpers.addPropertyTypes(f, ft, null);
            expect(result).toEqual(ft);
            var propertyType = <csComp.Services.IPropertyType>{};
            propertyType.label = 'test';
            ft._propertyTypeData.push(propertyType);
            result = csComp.Helpers.addPropertyTypes(f, ft, null);
            expect(result).toEqual(ft);
            f.properties['test2'] = false;
            result = csComp.Helpers.addPropertyTypes(f, ft, null);
            expect(result).toEqual(ft);
        });

        it('should create default types', function() {
            var f = <csComp.Services.IFeature>{};
            var rt = <csComp.Services.TypeResource>{};
            var result = csComp.Helpers.createDefaultType(f, rt);
            // expect(result.style).toEqual({
            //     nameLabel: 'Name',
            //     strokeWidth: 3,
            //     strokeColor: '#0033ff',
            //     fillOpacity: 0.75,
            //     fillColor: '#FFFF00',
            //     stroke: true,
            //     opacity: 1,
            //     rotate: 0,
            //     iconUri: 'bower_components/csweb/dist-bower/images/marker.png',
            //     iconHeight: 32,
            //     iconWidth: 32
            // });
            expect(result.style).toEqual({
                nameLabel: 'Name',
                drawingMode: 'Polygon',
                strokeWidth: 1,
                strokeColor: '#0033ff',
                fillOpacity: 0.75,
                strokeOpacity: 1,
                opacity: 0.75,
                fillColor: '#FFFF00',
                stroke: true,
                iconUri: 'bower_components/csweb/dist-bower/images/marker.png'
            });
            expect(result._propertyTypeData).toEqual(undefined);
        });

        describe('When converting propertyinfo', () => {
            var pt: csComp.Services.IPropertyType;
            beforeEach(function() {
                pt = <csComp.Services.IPropertyType>{};
            });
            it('should convert text', function() {
                pt.type = 'text';
                var result = csComp.Helpers.convertPropertyInfo(pt, 'text');
                expect(result).toEqual('text');
            });
            it('should convert numbers', function() {
                pt.type = 'number';
                var result = csComp.Helpers.convertPropertyInfo(pt, 'text');
                expect(result).toEqual('text');
                pt.type = 'number';
                result = csComp.Helpers.convertPropertyInfo(pt, '42.2');
                expect(result).toEqual('42.2');
                pt.stringFormat = '{0:0}';
                result = csComp.Helpers.convertPropertyInfo(pt, '42.2');
                expect(result).toEqual('42');
            });
            it('should convert options', function() {
                pt.type = 'options';
                var result = csComp.Helpers.convertPropertyInfo(pt, 'text');
                expect(result).toEqual('text');
                pt.options = ['optionOne', 'optionTwo'];
                result = csComp.Helpers.convertPropertyInfo(pt, '0');
                expect(result).toEqual('optionOne');
            });
            it('should convert ranks', function() {
                pt.type = 'rank';
                var result = csComp.Helpers.convertPropertyInfo(pt, 'text');
                expect(result).toEqual('text');
                result = csComp.Helpers.convertPropertyInfo(pt, '0,1');
                expect(result).toEqual('0 / 1');
            });
            it('should convert hierarchy', function() {
                pt.type = 'hierarchy';
                var result = csComp.Helpers.convertPropertyInfo(pt, 'text');
                expect(result).toEqual('text');
                result = csComp.Helpers.convertPropertyInfo(pt, '2;5');
                expect(result).toEqual('2');
            });
            it('should convert date', function() {
                pt.type = 'date';
                var result = csComp.Helpers.convertPropertyInfo(pt, 'June 12, 2015');
                expect(result).toEqual(new Date('June 12, 2015').toLocaleString());
            });
        });

        it('should create rightpaneltab', function() {
            var f = <csComp.Services.IFeature>{};
            var result = csComp.Helpers.createRightPanelTab('container', 'dir', 'data', 'title', 'popover', 'icon');
            expect(result.title).toEqual('title');
            expect(result.icon).toEqual('icon');
            result = csComp.Helpers.createRightPanelTab('container', 'dir', 'data', 'title', 'popover');
            expect(result.icon).toEqual('tachometer');
            result = csComp.Helpers.createRightPanelTab('container', 'dir', 'data', 'title');
            expect(result.popover).toEqual('');
        });

        it('should create guid', function() {
            var result = csComp.Helpers.getGuid();
            expect(result).toEqual(jasmine.any(String));
        });

        it('should convert stringformat', function() {
            var f = <csComp.Services.IFeature>{};
            f.properties = {};
            f.properties['pi'] = 3.1415;
            var result = csComp.Helpers.convertStringFormat(f, '{pi}');
            expect(result).toEqual('3.1415');
        });

        describe('When setting featurename', () => {
            var f = <csComp.Services.IFeature>{};
            beforeEach(function() {
                f = <csComp.Services.IFeature>{};
                f.properties = {};
                f.fType = {};
            });
            it('should set name', function() {
                f.properties['Name'] = 'test';
                var result: any = csComp.Helpers.setFeatureName(f);
                expect(result.properties['Name']).toEqual('test');
            });
            it('should set name from stringformat', function() {
                f.properties['first'] = 'First property';
                f.properties['pi'] = 3.1415;
                f.fType._propertyTypeData = [];
                var pt = <csComp.Services.IPropertyType>{
                    label: 'Name',
                    stringFormat: '{pi}'
                };
                f.fType._propertyTypeData.push(pt);
                var result = csComp.Helpers.setFeatureName(f);
                expect(result.properties['Name']).toEqual('3.1415');
            });
            it('should set name from style', function() {
                f.fType.style = {};
                f.fType.style.nameLabel = 'pi';
                f.properties['pi'] = '3.1415';
                var result: any = csComp.Helpers.setFeatureName(f);
                expect(result.properties['Name']).toEqual('3.1415');
            });
            it('should set name from first property', function() {
                f.properties['pi'] = '3.1415';
                var result: any = csComp.Helpers.setFeatureName(f);
                expect(result.properties['Name']).toEqual('pi');
            });
            it('should set name from guid', function() {
                expect(f.properties.hasOwnProperty('Name')).toBeFalsy();
                var result: any = csComp.Helpers.setFeatureName(f);
                expect(result.properties.hasOwnProperty('Name')).toBeTruthy();
            });
        });
    });

    describe('Icons', () => {
        var f: csComp.Services.IFeature;
        beforeEach(() => {
            f = <csComp.Services.IFeature>{
                effectiveStyle: <csComp.Services.IFeatureTypeStyle>{
                    drawingMode: 'Point',
                    iconHeight: 24,
                    iconWidth: 24,
                    iconUri: 'images/marker.png',
                    cornerRadius: 5,
                    fillColor: '#ff0000',
                    fillOpacity: 0.5,
                    strokeWidth: 3,
                    strokeColor: '#ffff00',
                    opacity: 0.5,
                    stroke: true
                }
            };
        });
        it('should be created correctly', () => {
            var icon = csComp.Helpers.createIconHtml(f);
            var expectation = '<div style="display:inline-block;vertical-align:middle;text-align:center;'
                + 'background:rgba(255,0,0,0.5);width:30px;height:30px;border-radius:5%;border-style:solid;border-color:rgba(255,255,0,1);border-width:3px;opacity:0.5;">'
                + '<img src="images/marker.png" style="width:24px;height:24px;display:block;" /></div>';
            expect(icon.html.replace(' ', ''))
                .toBe(expectation.replace(' ', ''));
            expect(icon.iconPlusBorderHeight).toBe(30);
            expect(icon.iconPlusBorderWidth) .toBe(30);
        });
        it('should use the innerText properties', () => {
            f.properties = {
                inner: 'My inner text'
            };
            f.effectiveStyle.innerTextProperty = 'inner';
            f.effectiveStyle.innerTextSize = 14;
            var icon = csComp.Helpers.createIconHtml(f);
            var expectation = '<div style="display:inline-block;vertical-align:middle;text-align:center;'
                + 'background:solid;rgba(255,255,0,0.5);width:30px;height:30px;border-radius:5%;border-style:solid;border-color:rgba(255,255,0,1);border-width:3px;opacity:0.5;">'
                + '<span style="font-size:14px;vertical-align:-webkit-baseline-middle">My inner text</span></div>';
            expect(icon.html.replace(' ', ''))
                .toBe(expectation.replace(' ', ''));
        });
    });
});
