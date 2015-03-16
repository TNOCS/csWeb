export declare class OfflineSearcher {
    private projectFile;
    private stopwords;
    private result;
    private layers;
    private propertyNames;
    private keywordIndex;
    constructor(projectFile: string, stopwords: string[]);
    filename: string;
    openProject(): void;
    processLayer(layer: any): void;
    saveResult(): void;
    loadResult(): void;
    private addEntry(key, layerIndex, featureIndex, propertyIndex);
}
