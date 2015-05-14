/**
* Offline Search Result contains the result of performing a scan of all the project layer files.
*/
import IProjectLocation = require('../Helpers/IProjectLocation');
import f = require('../Helpers/Feature');
import IOfflineSearchOptions = require('./IOfflineSearchOptions');
export declare class Layer {
    private groupTitle;
    private index;
    private id;
    private title;
    private path;
    private type;
    /**
     * Names of all the features.
     * @type {string[]}
     */
    featureNames: string[];
    constructor(groupTitle: string, index: number, id: string, title: string, path: string, type: string);
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
export declare class Entry {
    private v;
    constructor(layerIndexOrArray: Array<number> | number, featureIndex?: number);
    layerIndex: number;
    featureIndex: number;
    /**
     * This function is called when serializing the Entry object to JSON, which is
     * much less verbose than the default JSON. In the constructor, I've used a
     * Union type to deserialize it again.
     */
    toJSON(): number[];
}
export declare class KeywordIndex {
    [key: string]: Entry[];
}
export declare class OfflineSearchResult {
    project: IProjectLocation;
    options: IOfflineSearchOptions;
    layers: Layer[];
    keywordIndex: KeywordIndex;
    constructor(project: IProjectLocation, options: IOfflineSearchOptions);
}
