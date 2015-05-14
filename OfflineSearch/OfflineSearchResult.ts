/**
* Offline Search Result contains the result of performing a scan of all the project layer files.
*/

import IProjectLocation      = require('./Helpers/IProjectLocation');
import f                     = require('./Helpers/Feature')
import IOfflineSearchOptions = require('./IOfflineSearchOptions');

export class Layer {
    /**
     * Names of all the features.
     * @type {string[]}
     */
    featureNames: string[] = [];

    constructor(private groupTitle: string, private index: number, private id: string, private title: string, private path: string, private type: string) {}
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
    languages?: f.ILanguageData;
}

/**
* An index entry that contains a search result.
*/
export class Entry {
    private v = Array<number>(2);

    constructor(layerIndexOrArray: Array<number> | number, featureIndex?: number) {
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
    layers       : Layer[] = [];
    keywordIndex : KeywordIndex = {};

    constructor(public project: IProjectLocation, public options: IOfflineSearchOptions) {}
}
