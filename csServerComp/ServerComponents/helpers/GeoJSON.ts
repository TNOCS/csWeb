import Utils = require('./Utils');

export interface IGeoJson {
    id?: string;
    /** Typically, this would be FeatureCollection */
    type?: string;
    features: IFeature[];
    [key: string]: any;
}

/**
 * Simple helper class to easily create a GeoJSON file.
 */
export class GeoJSONFactory {
    /**
     * Create a GeoJSON file from an array of features.
     */
    public static Create(features: IFeature[]): IGeoJson {
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

export interface IProperty {
    [key: string]: any;
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
}
