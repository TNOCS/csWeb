export declare class Layer {
    private id;
    private title;
    private path;
    /**
    * Size in bytes of the layer
    */
    size: number;
    /**
    * Time it was last written
    */
    lastWrite: Date;
    constructor(id: string, title: string, path: string);
}
export declare class PropertyName {
    /**
    * Name of the property
    */
    name: string;
    /**
    * Translation key of the property
    */
    key: string;
}
/**
* An index entry that contains a search result.
*/
export declare class Entry {
    private layerIndex;
    private featureIndex;
    private propertyIndex;
    constructor(layerIndex: number, featureIndex: number, propertyIndex: number);
}
export declare class KeywordIndex {
    [key: string]: Entry[];
}
export declare class OfflineSearchResult {
    projectFile: string;
    stopwords: string[];
    layers: Layer[];
    propertyNames: PropertyName[];
    keywordIndex: KeywordIndex;
    constructor(projectFile: string, stopwords: string[]);
}
