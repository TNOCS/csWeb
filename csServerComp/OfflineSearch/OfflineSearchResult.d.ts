import IProjectLocation = require('./Helpers/IProjectLocation');
import f = require('./Helpers/Feature');
import IOfflineSearchOptions = require('./IOfflineSearchOptions');
export declare class Layer {
    private groupTitle;
    private index;
    private id;
    private title;
    private path;
    private type;
    featureNames: string[];
    constructor(groupTitle: string, index: number, id: string, title: string, path: string, type: string);
}
export interface IPropertyType {
    name: string;
    title: string;
    languages?: f.ILanguageData;
}
export declare class Entry {
    private v;
    constructor(layerIndexOrArray: Array<number> | number, featureIndex?: number);
    layerIndex: number;
    featureIndex: number;
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
