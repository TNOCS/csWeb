module csComp.Helpers {
    declare var omnivore;

    /**
    * A set of static geo tools
    * Source: http://www.csgnetwork.com/degreelenllavcalc.html
    */
    export class GeoExtensions {
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
                latitudeLength : latlen,
                /**
                * Length of a degree of longitude in meters
                */
                longitudeLength: lonlen
            }
        }
    }

} 