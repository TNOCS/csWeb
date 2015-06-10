module csComp.Helpers {
    declare var omnivore;

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
            bounds.southWest = [bounds.yMin,bounds.xMin];
            bounds.northEast = [bounds.yMax,bounds.xMax];

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
            var topo = omnivore.topojson.parse(data);
            var newData: any = {};
            newData.featureTypes = data.featureTypes;
            newData.features = [];
            topo.eachLayer((l) => {
                newData.features.push(l.feature);
            });
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

    }
}
