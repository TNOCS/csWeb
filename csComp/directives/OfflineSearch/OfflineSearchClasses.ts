module OfflineSearch {
    export interface IProjectLocation {
      title: string;
      url:   string;
    }

    /**
     * The name of the property you include in generating the offline search result.
     */
    export interface IPropertyType {
        /**
         * Name of the property
         * @type {string}
         */
        name: string;
        /**
         * The title of the property.
         * @type {string}
         */
        title: string;
        /**
         * Language information for localisation.
         * @type {f.ILanguageData}
         */
        languages?: csComp.Services.ILanguageData;
    }

    /**
     * Specify the offline search options.
     */
     export interface IOfflineSearchOptions {
        /**
         * Words you wish to exclude from the index.
         * @type {string[]}
         */
        stopWords: string[];
        /**
         * The property types that you wish to use for generating the index.
         * @type {osr.PropertyType}
         */
        propertyTypes: IPropertyType[];
    }

    export class Layer {
        /**
         * Names of all the features.
         * @type {string[]}
         */
        featureNames: string[] = [];

        constructor(public groupTitle: string, public index: number, public id: string, public title: string, public path: string, public type: string) {}
    }

    /**
     * An index entry that contains a search result.
     */
    export class Entry {
        private v = Array<number>(2);

        constructor(layerIndexOrArray: Array<number> | number, featureIndex?: number, propertyIndex?: number) {
            if (typeof layerIndexOrArray === 'number') {
                this.v[0] = layerIndexOrArray;
                this.v[1] = featureIndex;
            } else {
                this.v = layerIndexOrArray;
            }
        }

        get layerIndex()    { return this.v[0]; }
        get featureIndex()  { return this.v[1]; }

        /**
         * This function is called when serializing the Entry object to JSON, which is
         * much less verbose than the default JSON. In the constructor, I've used a
         * Union type to deserialize it again.
         */
        toJSON() {
            return this.v;
        }
    }

    export class KeywordIndex { [key: string]: Entry[] }

    export class OfflineSearchResult {
        layers: Layer[] = [];
        keywordIndex: KeywordIndex = {};

        constructor(public project: IProjectLocation, public options: IOfflineSearchOptions) { }
    }

}
