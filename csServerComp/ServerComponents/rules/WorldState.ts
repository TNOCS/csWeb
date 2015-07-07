import GeoJSON = require("../helpers/GeoJSON");

/**
 * A class representing the world state
 */
class WorldState {
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
    properties: GeoJSON.IProperty[] = [];

    /**
     * List of all features.
     */
    features: GeoJSON.IFeature[] = [];

    /**
     * Active feature.
     * In case it is undefined, you can only evaluate the non-feature specific rules.
     */
    activeFeature: GeoJSON.IFeature;

    /**
     * Active layer id is used for working with features.
     * TODO I assume that later, we need to make this more flexible, allowing you to specify
     * which layer to use.
     */
    activeLayerId: string;
}
export = WorldState;
