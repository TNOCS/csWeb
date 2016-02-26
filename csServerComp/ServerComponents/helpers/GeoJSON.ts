import ApiManager = require('../api/ApiManager');
import Utils = require('./Utils');
import IProperty = ApiManager.IProperty;

export interface IGeoJson {
    id?: string;
    /** Typically, this would be FeatureCollection */
    type?: string;
    features: ApiManager.Feature[];
    [key: string]: any;
}

/**
 * Simple helper class to easily create a GeoJSON file.
 */
export class GeoJSONFactory {
    /**
     * Create a GeoJSON file from an array of features.
     */
    public static Create(features: ApiManager.Feature[]): IGeoJson {
        return {
            id: Utils.newGuid(),
            type: 'FeatureCollection',
            features: features
        };
    }
}

export interface IGeoJsonGeometry {
    /** For example, Point, LineString, Polyline or Polygon */
    type: string;
    coordinates: any;
}

export interface IStringToAny {
    [key: string]: any;
}

export interface IFeature {
    id?: string;
    /** Typically, this would be Feature */
    type?: string;
    geometry?: IGeoJsonGeometry;
    properties?: IStringToAny;
    logs?: {};
    isInitialized?: boolean;
    /**
    * An optional dictionary of sensors, where each sensor or measurement represents the value of the sensor
    * at a certain point in time. Is often used with the layer's timestamp property in case all sensors have the same
    * number of measurements.
    */
    sensors?: {
        [id: string]: any[];
    };
    timestamps?: number[];
    // TOOD REMOVE EV I don't think we can have them here
    // coordinates?: IGeoJsonGeometry[];
    /**
    * An optional language dictionary, where each key, e.g. 'en' for English, represents a localised data set. Each locale can overwrite
    * the value of the title, description etc. of a feature.
    */
}

/**
* A set of static geo tools
* Source: http://www.csgnetwork.com/degreelenllavcalc.html
*/
export class GeoExtensions {

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
}
