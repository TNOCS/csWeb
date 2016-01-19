module csComp.Helpers {
    declare var topojson;

    export interface IGeoFeature {
        type: string;
        geometry: {
            type: string;
            coordinates: Array<number> | Array<Array<number>> | Array<Array<Array<number>>>
        };
        properties: Object;
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

        static getFeatureBounds(feature: IFeature): L.LatLng[] | L.LatLngBounds {
            if (!feature || !feature.geometry) return [new L.LatLng(360, 180)]; // Return illegal coordinate.
            var geoType = feature.geometry.type || 'Point';
            switch (geoType) {
                case 'Point':
                    return [new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0])];
                default:
                    var bounds = d3.geo.bounds(feature);
                    return new L.LatLngBounds([bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]);
            }
        }

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

        static Rad2Deg = Math.PI / 180;

        static deg2rad(degree: number) {
            return (degree * GeoExtensions.Rad2Deg);
        }

        static rad2deg(rad: number) {
            return (rad / GeoExtensions.Rad2Deg);
        }

        /**
         * Convert RD (Rijksdriehoek) coordinates to WGS84.
         * @param  {number} x [RD X coordinate]
         * @param  {number} y [RD Y coordinate]
         * @return {[type]}   [object with latitude and longitude coordinate in WGS84]
         * Source: http://home.solcon.nl/pvanmanen/Download/Transformatieformules.pdf, http://www.roelvanlisdonk.nl/?p=2950
         */
        static convertRDToWGS84(x: number, y: number) {
            var x0 = 155000.000,
                y0 = 463000.000,
                f0 = 52.156160556,
                l0 = 5.387638889,
                a01 = 3236.0331637, b10 = 5261.3028966,
                a20 = -32.5915821, b11 = 105.9780241,
                a02 = -0.2472814, b12 = 2.4576469,
                a21 = -0.8501341, b30 = -0.8192156,
                a03 = -0.0655238, b31 = -0.0560092,
                a22 = -0.0171137, b13 = 0.0560089,
                a40 = 0.0052771, b32 = -0.0025614,
                a23 = -0.0003859, b14 = 0.0012770,
                a41 = 0.0003314, b50 = 0.0002574,
                a04 = 0.0000371, b33 = -0.0000973,
                a42 = 0.0000143, b51 = 0.0000293,
                a24 = -0.0000090, b15 = 0.0000291;

            var dx = (x - x0) * Math.pow(10, -5);
            var dy = (y - y0) * Math.pow(10, -5);
            var df = a01 * dy + a20 * Math.pow(dx, 2) + a02 * Math.pow(dy, 2) + a21 * Math.pow(dx, 2) * dy + a03 * Math.pow(dy, 3)
            df += a40 * Math.pow(dx, 4) + a22 * Math.pow(dx, 2) * Math.pow(dy, 2) + a04 * Math.pow(dy, 4) + a41 * Math.pow(dx, 4) * dy
            df += a23 * Math.pow(dx, 2) * Math.pow(dy, 3) + a42 * Math.pow(dx, 4) * Math.pow(dy, 2) + a24 * Math.pow(dx, 2) * Math.pow(dy, 4);
            var f = f0 + df / 3600;
            var dl = b10 * dx + b11 * dx * dy + b30 * Math.pow(dx, 3) + b12 * dx * Math.pow(dy, 2) + b31 * Math.pow(dx, 3) * dy;
            dl += b13 * dx * Math.pow(dy, 3) + b50 * Math.pow(dx, 5) + b32 * Math.pow(dx, 3) * Math.pow(dy, 2) + b14 * dx * Math.pow(dy, 4);
            dl += b51 * Math.pow(dx, 5) * dy + b33 * Math.pow(dx, 3) * Math.pow(dy, 3) + b15 * dx * Math.pow(dy, 5);
            var l = l0 + dl / 3600

            var lat = f + (-96.862 - 11.714 * (f - 52) - 0.125 * (l - 5)) / 100000,
                lon = l + (-37.902 + 0.329 * (f - 52) - 14.667 * (l - 5)) / 100000;
            return { latitude: lat, longitude: lon };
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

        /** Convert a string representation of a bounding box to an LatLngBounds.  */
        static toBoundingBox(bb: string) {
            var pts: number[] = [];
            bb.split(',').forEach(p => {
                pts.push(+p);
            });
            return new L.LatLngBounds([pts[1], pts[0]], [pts[3], pts[2]]);
        }

        /** Start slippy map computation */

        /** Convert longitude to tile coordinate. */
        private static lon2tile(lon, zoom) {
            return (Math.floor((lon + 180) / 360 * Math.pow(2 , zoom)));
        }

        /** Convert latitude to tile coordinate. */
        private static lat2tile(lat,  zoom) {
            return (Math.floor((1 - Math.log(Math.tan(lat * GeoExtensions.Rad2Deg) + 1 / Math.cos(lat * GeoExtensions.Rad2Deg)) / Math.PI) / 2 * Math.pow(2, zoom)));
        }

        /**
         * Convert a bounding box to slippy tile coordinates. 
         * Returns an object that specifies the top, bottom, left and right tiles, as well as its width and height.
         * 
         * See http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
         */
        static slippyMapTiles(zoom: number, bbox: string | L.LatLngBounds) {
            var bb: L.LatLngBounds;
            if (typeof bbox === 'string') {
                bb = GeoExtensions.toBoundingBox(bbox);
            } else {
                bb = bbox;
            }
            var north_edge = bb.getNorth(),
                south_edge = bb.getSouth(),
                west_edge  = bb.getWest(),
                east_edge  = bb.getEast();
            var top_tile    = GeoExtensions.lat2tile(north_edge, zoom); // eg.lat2tile(34.422, 9);
            var left_tile   = GeoExtensions.lon2tile(west_edge, zoom);
            var bottom_tile = GeoExtensions.lat2tile(south_edge, zoom);
            var right_tile  = GeoExtensions.lon2tile(east_edge, zoom);
            var width       = Math.abs(left_tile - right_tile) + 1;
            var height      = Math.abs(top_tile - bottom_tile) + 1;
            return {
                top:    top_tile,
                bottom: bottom_tile,
                left:   left_tile,
                right:  right_tile,
                width:  width,
                height: height
            };
        }
        /** End slippy map computation */
    }
}
