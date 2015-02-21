module Heatmap {
    /**
    * A simple interface to describe an item that can be used in a heatmap.
    * We either accept a FeatureType (e.g. Hospital or Shop), or a property that
    * is of type options (e.g. shop, magazine).
    */
    export interface IHeatmapItem {
        title          : string;
        featureType    : csComp.Services.IFeatureType;
        /**
         * In case we are not interested in the feature type itself, but in a certain property,
         * e.g. the property that determines what it represents like buildingFunction.
         * @type {string}
         */
        propertyTitle? : string;
        propertyLabel  : string;
        /**
         * When we are using an options property type, such as buildingFunction, we need
         * to indicate the particular option that we will evaluate.
         * @type {number}
         */
        optionIndex?   : number;
        /**
         * The user weight specifies how much you like this item, e.g. the maximum value.
         * @type {number}, range [-5..5].
         */
        userWeight     : number;
        /**
         * The weight specifies how much you like this item, relative to others.
         * @type {number}, range [0..1].
         */
        weight         : number;
        /**
         * The ideality measure specifies how much you like this item with respect to its
         * distance.
         * @type {IIdealityMeasure}
         */
        idealityMeasure: IIdealityMeasure | number;
        isSelected     : boolean;

        calculateHeatspot(feature: csComp.Services.IFeature) : Heatspot;
    }

    export class HeatmapItem implements IHeatmapItem {
        /**
         * In case we are not interested in the feature type itself, but in a certain property,
         * e.g. the property that determines what it represents like buildingFunction.
         * @type {string}
         */
        propertyTitle   : string;
        propertyLabel   : string;
        /**
         * When we are using an options property type, such as buildingFunction, we need
         * to indicate the particular option that we will evaluate.
         * @type {number}
         */
        optionIndex    : number;
        /**
         * The user weight specifies how much you like this item, e.g. the maximum value.
         * @type {number}, range [-5..5].
         */
        userWeight = 5;
        /**
         * The weight specifies how much you like this item, relative to others.
         * @type {number}, range [0..1].
         */
        weight = 0;
        /**
         * The ideality measure specifies how much you like this item with respect to its
         * distance.
         * @type {IIdealityMeasure}
         */
        idealityMeasure: IIdealityMeasure | number;
        isSelected = false;

        constructor(public title: string, public featureType: csComp.Services.IFeatureType) { }

        calculateHeatspot(feature: csComp.Services.Feature) {
            // right type?
            if (this.featureType !== feature.fType) return null;
            // create heatspot solely based on feature type?
            if (!this.propertyLabel) {
                return new Heatspot(feature.geometry, this.idealityMeasure);
            }
            // create heatspot based on the preferred option?
            if (feature.properties.hasOwnProperty(this.propertyLabel)
                && feature.properties[this.propertyLabel] === this.optionIndex) {
                return new Heatspot(feature.geometry, this.idealityMeasure);
            }
            return null;
        }

        select() {
            this.isSelected = !this.isSelected; 
            if (!this.isSelected) {
                this.idealityMeasure = null;
            }
            else {
                switch (this.featureType.style.drawingMode.toLowerCase()) {
                    case 'point':
                    case 'image':
                        this.idealityMeasure = new IdealityMeasure();
                        break;
                    default:
                        this.idealityMeasure = 1;
                        break;
                }
            }
            this.idealityMeasure = this.isSelected
                ? new IdealityMeasure()
                : null;
        }

        toString() {
            return this.propertyTitle
                ? this.propertyTitle + '.' + this.title + ' (' + this.featureType.name + ')'
                : this.title;            
        }
    }
}
