module csComp.Helpers {
    declare var topojson;

    export interface IGeoFeature {
        type: string;
        geometry: {
            type: string;
            coordinates: Array<number> | Array<Array<number>> | Array<Array<Array<number>>>
        };
        properties: Object
    }

    export interface IGeoFeatureCollection {
        type: string;
        features: IGeoFeature[]
    }

    /**
    * A set of static geo tools
    * Source: http://www.csgnetwork.com/degreelenllavcalc.html
    */
    export class GeoExtensions {

        static getBoundingBox(data) {
            var bounds: any = {}, coords, point, latitude, longitude;

            // We want to use the “features” key of the FeatureCollection (see above)
            data = data.features;

            // Loop through each “feature”
            for (var i = 0; i < data.length; i++) {
                // get bound
                var b = d3.geo.bounds(data[i]);
                // Update the bounds recursively by comparing the current
                // xMin/xMax and yMin/yMax with the coordinate
                // we're currently checking
                bounds.xMin = bounds.xMin < b[0][0] ? bounds.xMin : b[0][0];
                bounds.xMax = bounds.xMax > b[1][0] ? bounds.xMax : b[1][0];
                bounds.yMin = bounds.yMin < b[0][1] ? bounds.yMin : b[0][1];
                bounds.yMax = bounds.yMax > b[1][1] ? bounds.yMax : b[1][1];
            }
            bounds.southWest = [bounds.yMin, bounds.xMin];
            bounds.northEast = [bounds.yMax, bounds.xMax];

            // Returns an object that contains the bounds of this GeoJSON
            // data. The keys of this object describe a box formed by the
            // northwest (xMin, yMin) and southeast (xMax, yMax) coordinates.
            return bounds;
        }

        /**
        * Convert topojson data to geojson data.
        */
        static convertTopoToGeoJson(data) {
            // Convert topojson to geojson format
            var o = typeof data === 'string'
                ? JSON.parse(data)
                : data;
            var newData: any = {};
            newData.featureTypes = data.featureTypes;
            newData.features = [];
            for (var i in o.objects) {
                var ft = topojson.feature(o, o.objects[i]);
                if (ft.features) {
                    // ft contains multiple features
                    ft.features.forEach(f => newData.features.push(f));
                } else {
                    newData.features.push(ft);
                }
            }
            return newData;
        }

        static deg2rad(degree: number) {
            var conv_factor = (2.0 * Math.PI) / 360.0;
            return (degree * conv_factor);
        }

        static rad2deg(rad: number) {
            var conv_factor = 360 / (2.0 * Math.PI);
            return (rad * conv_factor);
        }

        /**
         * Convert RD (Rijksdriehoek) coordinates to WGS84.
         * @param  {number} x [RD X coordinate]
         * @param  {number} y [RD Y coordinate]
         * @return {[type]}   [object with latitude and longitude coordinate in WGS84]
         * Source: http://home.solcon.nl/pvanmanen/Download/Transformatieformules.pdf, http://www.roelvanlisdonk.nl/?p=2950
         */
        static convertRDToWGS84(x: number, y: number)
        {
            // The city "Amsterfoort" is used as reference.
            var referenceRdX = 155000, // "Rijksdriehoek" coordinate
                referenceRdY = 463000,
                referenceWgs84X = 52.15517, //"WGS84" coordinate
                referenceWgs84Y = 5.387206;

            var dX = (x - referenceRdX) * Math.pow(10,-5),
                dY = (y - referenceRdY) * Math.pow(10,-5);

            var sumN =
                (3235.65389 * dY) +
                (-32.58297 * dX * dX) +
                (-0.2475 * dY * dY) +
                (-0.84978 * dX * dX * dY) +
                (-0.0655 * Math.pow(dY, 3)) +
                (-0.01709 * dX * dX * dY * dY) +
                (-0.00738 * dX) +
                (0.0053 * Math.pow(dX, 4)) +
                (-0.00039 * dX * dX * Math.pow(dY, 3)) +
                (0.00033 * Math.pow(dX, 4) * dY) +
                (-0.00012 * dX * dY);
            var sumE =
                (5260.52916 * dX) +
                (105.94684 * dX * dY) +
                (2.45656 * dX * dY * dY) +
                (-0.81885 * Math.pow(dX, 3)) +
                (0.05594 * dX * Math.pow(dY, 3)) +
                (-0.05607 * Math.pow(dX, 3) * dY) +
                (0.01199 * dY) +
                (-0.00256 * Math.pow(dX, 3) * dY * dY) +
                (0.00128 * dX * Math.pow(dY, 4)) +
                (0.00022 * dY * dY) +
                (-0.00022 * dX * dX) +
                (0.00026 * Math.pow(dX, 5));

            var latitude = referenceWgs84X + (sumN / 3600),
                longitude = referenceWgs84Y + (sumE / 3600);

            // Input
            // x = 122202
            // y = 487250
            //
            // Result
            // "52.372143838117, 4.90559760435224"
            return { latitude: latitude, longitude: longitude };
        }

        /**
        * Calculate the log base 10 of val
        */
        static log10(val) {
            return (Math.LOG10E * Math.log(val));
        }

        static convertDegreesToMeters(latitudeDegrees: number) {
            // Convert latitude to radians
            var lat = GeoExtensions.deg2rad(latitudeDegrees);

            // Set up "Constants"
            var m1 = 111132.92,		// latitude calculation term 1
                m2 = -559.82,		// latitude calculation term 2
                m3 = 1.175,			// latitude calculation term 3
                m4 = -0.0023,		// latitude calculation term 4
                p1 = 111412.84,		// longitude calculation term 1
                p2 = -93.5,			// longitude calculation term 2
                p3 = 0.118;			// longitude calculation term 3

            // Calculate the length of a degree of latitude and longitude in meters
            var latlen = m1 + (m2 * Math.cos(2 * lat)) + (m3 * Math.cos(4 * lat)) + (m4 * Math.cos(6 * lat));
            var lonlen = (p1 * Math.cos(lat)) + (p2 * Math.cos(3 * lat)) + (p3 * Math.cos(5 * lat));
            return {
                /**
                * Length of a degree of latitude in meters
                */
                latitudeLength: latlen,
                /**
                * Length of a degree of longitude in meters
                */
                longitudeLength: lonlen
            }
        }

        /**
         * Takes an array of LinearRings and optionally an {@link Object} with properties and returns a {@link Polygon} feature.
         *
         * @module turf/polygon
         * @category helper
         * @param {Array<Array<Number>>} rings an array of LinearRings
         * @param {Object=} properties a properties object
         * @returns {Feature<Polygon>} a Polygon feature
         * @throws {Error} throw an error if a LinearRing of the polygon has too few positions
         * or if a LinearRing of the Polygon does not have matching Positions at the
         * beginning & end.
         * @example
         * var polygon = createPolygon([[
         *  [-2.275543, 53.464547],
         *  [-2.275543, 53.489271],
         *  [-2.215118, 53.489271],
         *  [-2.215118, 53.464547],
         *  [-2.275543, 53.464547]
         * ]], { name: 'poly1', population: 400});
         *
         * @seealso https://github.com/Turfjs/turf-polygon/blob/master/index.js
         */
        static createPolygonFeature(coordinates: Array<Array<Array<number>>>, properties: Object): IGeoFeature {
            if (coordinates === null) throw new Error('No coordinates passed');
            for (var i = 0; i < coordinates.length; i++) {
                var ring = coordinates[i];
                for (var j = 0; j < ring[ring.length - 1].length; j++) {
                    if (ring.length < 4) {
                        new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
                    }
                    if (ring[ring.length - 1][j] !== ring[0][j]) {
                        new Error('First and last Position are not equivalent.');
                    }
                }
            }

            var polygon: IGeoFeature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coordinates
                },
                "properties": properties
            };

            if (!polygon.properties) {
                polygon.properties = {};
            }

            return polygon;
        }

        /**
         * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
         *
         * @param {Feature[]} features input features
         * @returns {FeatureCollection} a FeatureCollection of input features
         * @example
         * var features = [
         *  turf.point([-75.343, 39.984], {name: 'Location A'}),
         *  turf.point([-75.833, 39.284], {name: 'Location B'}),
         *  turf.point([-75.534, 39.123], {name: 'Location C'})
         * ];
         *
         * var fc = turf.featurecollection(features);
         *
         * @seealso https://github.com/Turfjs/turf-featurecollection/blob/master/index.js
         */
        static createFeatureCollection(features: IGeoFeature[]): IGeoFeatureCollection {
            return {
                type: "FeatureCollection",
                features: features
            };
        }

        static createPointFeature(lon: number, lat: number, properties?: csComp.Services.IProperty, sensors?: csComp.Services.IProperty): IGeoFeature {
            var gjson = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [lon, lat]
                },
                properties: properties
            }
            if (sensors && sensors !== {}) {
                gjson["sensors"] = sensors;
            }
            return gjson;
        }

        static createLineFeature(coordinates: Array<Array<number>>, properties?: Object): IGeoFeature {
            if (coordinates === null) throw new Error('No coordinates passed');
            for (var i = 0; i < coordinates.length; i++) {
                var ring = coordinates[i];
                if (ring.length < 2) {
                    new Error('Each LineString of a Polygon must have 2 or more Positions.');
                }
            }

            var lines: IGeoFeature = {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                },
                "properties": properties
            };

            if (!lines.properties) {
                lines.properties = {};
            }

            return lines;
        }

        static createPropertyType(name: string, section?: string): csComp.Services.IPropertyType {
            if (!name) return;
            var propType: csComp.Services.IPropertyType = {
                label: name,
                title: name,
                type: "text",
                visibleInCallOut: true,
                canEdit: true,
                isSearchable: false
            };
            if (section) propType["section"] = section;
            return propType;
        }

        static convertMileToKm(miles: number) {
            if (!miles || isNaN(miles)) return;
            return (miles * 1.609344);
        }

        static convertKmToMile(km: number) {
            if (!km || isNaN(km)) return;
            return (km * 0.621371192);
        }

        /**
         * pointInsidePolygon returns true if a 2D point lies within a polygon of 2D points
         * @param  {number[]}   point   [lat, lng]
         * @param  {number[][]} polygon [[lat, lng], [lat,lng],...]
         * @return {boolean}            Inside == true
         */
        static pointInsidePolygon(point: number[], polygon: number[][][]): boolean {
            // https://github.com/substack/point-in-polygon
            // ray-casting algorithm based on
            // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            var x = point[0];
            var y = point[1];
            var p = polygon[0];

            var inside = false;
            for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
                var xi = p[i][0], yi = p[i][1];
                var xj = p[j][0], yj = p[j][1];

                var intersect = ((yi > y) != (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }

            return inside;
        }

        /**
         * pointInsideMultiPolygon returns true if a 2D point lies within a multipolygon
         * @param  {number[]}   point   [lat, lng]
         * @param  {number[][][]} polygon [[[lat, lng], [lat,lng]],...]]
         * @return {boolean}            Inside == true
         */
        static pointInsideMultiPolygon(point: number[], multipoly: number[][][][]): boolean {
            // https://github.com/substack/point-in-polygon
            // ray-casting algorithm based on
            // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            var inside = false;
            for (var i = 0; i < multipoly.length; i++) {
                var polygon = multipoly[i];
                if (GeoExtensions.pointInsidePolygon(point, polygon)) inside = !inside;
            }
            return inside;
        }
    }
}
