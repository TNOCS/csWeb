describe('GeoExtensions', function() {

    describe('Initial state', () => {
        it('should have constructed a new geoextensions class', function() {
            var geoExt = new csComp.Helpers.GeoExtensions();
            expect(geoExt).toBeDefined();
        });
        it('should get bounding box from data', function() {
            var data = {features: [ {type: 'Feature', geometry:{type: 'Point', coordinates:[0, 0]}},
                                    {type: 'Feature', geometry:{type: 'Point', coordinates:[1, 1]}},
                                    {type: 'Feature', geometry:{type: 'Point', coordinates:[2, 2]}}]};
            var bounds = csComp.Helpers.GeoExtensions.getBoundingBox(data);
            expect(bounds).toBeDefined();
            expect(bounds.southWest).toEqual([0, 0]);
            expect(bounds.northEast).toEqual([2, 2]);
        });
        it('should convert deg2rad', function() {
            var rad = csComp.Helpers.GeoExtensions.deg2rad(180);
            expect(rad).toBeCloseTo(3.1415, 2);
        });
        it('should convert rad2deg', function() {
            var deg = csComp.Helpers.GeoExtensions.rad2deg(1.5708);
            expect(deg).toBeCloseTo(90, 1);
        });
        it('should convert log10', function() {
            var deg = csComp.Helpers.GeoExtensions.log10(20);
            expect(deg).toBeCloseTo(1.3, 2);
        });
        it('should convert degrees to meters', function() {
            var latlon = csComp.Helpers.GeoExtensions.convertDegreesToMeters(1.00);
            expect(latlon.latitudeLength/10000).toBeCloseTo(11, 0);
        });
        it('should create a propertyType', function() {
            var propType = csComp.Helpers.GeoExtensions.createPropertyType('testname');
            expect(propType.title).toEqual('testname');
            expect(propType.hasOwnProperty('section')).toBeFalsy();
            propType = csComp.Helpers.GeoExtensions.createPropertyType('');
            expect(propType).toBeUndefined();
            var propType = csComp.Helpers.GeoExtensions.createPropertyType('testname', 'testsection');
            expect(propType.section).toEqual('testsection');
        });
        it('should create a pointFeature', function() {
            var ft = csComp.Helpers.GeoExtensions.createPointFeature(0,1,{'testProp':0});
            expect(ft.type).toEqual('Feature');
            expect(ft.hasOwnProperty('sensors')).toBeFalsy();
            ft = csComp.Helpers.GeoExtensions.createPointFeature(0,1,{'testProp':0},{'test':[0,1,1]});
            expect(ft.hasOwnProperty('sensors')).toBeTruthy();
        });
        it('should create a featureCollection', function() {
            var feature: csComp.Helpers.IGeoFeature = {properties: {}, type:"Feature",geometry:{type: "Point", coordinates:[0,0]}};
            var features:csComp.Helpers.IGeoFeature[] = [];
            features.push(feature);
            var featureColl = csComp.Helpers.GeoExtensions.createFeatureCollection(features);
            expect(featureColl.type).toEqual('FeatureCollection');
        });
    });
});
