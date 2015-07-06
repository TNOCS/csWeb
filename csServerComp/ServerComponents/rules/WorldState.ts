export interface IGeoJson {
    features: IFeature[];
}

export interface IGeoJsonGeometry {
    type: string;
    coordinates: any;
}

export interface IStringToAny {
    [key: string]: any;
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

export interface IProperty {
    [key: string]: any;
}

/**
 * A class representing the world state
 */
export class WorldState {
    /**
     * Time the world state was created.
     */
    startTime: Date = new Date();

    /**
     * The current time.
     */
    currentTime: Date = this.startTime;

    /**
     * A bag of key-value properties
     */
    properties: IProperty[] = [];

    /**
     * List of all features.
     */
    features: IFeature[] = [];

    /**
     * Active feature.
     * In case it is undefined, you can only evaluate the non-feature specific rules.
     */
    activeFeature: IFeature;

    /**
     * Active layer id is used for working with features.
     * TODO I assume that later, we need to make this more flexible, allowing you to specify
     * which layer to use.
     */
    activeLayerId: string;
}
