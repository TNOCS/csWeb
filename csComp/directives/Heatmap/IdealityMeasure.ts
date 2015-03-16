module Heatmap {
    /**
     * The ideality measure specifies how much you like this item with respect to its
     * distance. For example, if I like a shop to be ideally at 200m of my house, it
     * also means that there is a zone around the shop with a radius of 200m where
     * I would ideally live.
     */
    export interface IIdealityMeasure {
        /**
        * The distance with respect to my location where I would like to find the item.
        * @type {number}, in meters
        */
        idealDistance: number;
        /**
        * How happy would I be if the item would be at my location.
        * @type {number}, range [0..1]
        */
        atLocation: number;
        /**
         * At what distance would the item no longer be of value to me.
         * @type {number}, range in meters
         */
        lostInterestDistance: number;

        computeIdealityAtDistance(distance: number): number;
    }

    export class IdealityMeasure implements IIdealityMeasure {
        /**
        * The distance with respect to my location where I would like to find the item.
        * @type {number}, in meters
        */
        idealDistance = 100;
        /**
        * How happy would I be if the item would be at my location.
        * @type {number}, range [0..1]
        */
        atLocation = 0.2;
        /**
         * At what distance would the item no longer be of value to me.
         * @type {number}, range in meters
         */
        lostInterestDistance = 1000;
         
        computeIdealityAtDistance(distance: number): number {
            if (distance < this.idealDistance) {
                return this.atLocation + (1 - this.atLocation) * distance / this.idealDistance;
            } else if (distance < this.lostInterestDistance) {
                return 1 - (distance - this.idealDistance) / (this.lostInterestDistance - this.idealDistance);
            }
            return 0;
        }

    }
}
