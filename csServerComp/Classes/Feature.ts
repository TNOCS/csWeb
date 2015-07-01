module csComp.Services {



    export interface IGeoJsonGeometry {
        type: string;
        coordinates: any;
    }

    export interface IFeature {
        id?: string;
        geometry: IGeoJsonGeometry;
        properties?: IStringToAny;

        isInitialized?: boolean;
        /**
        * An optional dictionary of sensors, where each sensor or measurement represents the value of the sensor
        * at a certain point in time. Is often used with the layer's timestamp property in case all sensors have the same
        * number of measurements.
        */
        sensors?: {
            [id: string]: any[];
        };
        timestamps: number[];
        coordinates?: IGeoJsonGeometry[];
        /**
        * An optional language dictionary, where each key, e.g. 'en' for English, represents a localised data set. Each locale can overwrite
        * the value of the title, description etc. of a feature.
        */

    }

    export interface IStringToAny {
        [key: string]: any;
    }
}
