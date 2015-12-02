import IOfflineSearchOptions = require('./IOfflineSearchOptions');
import IProjectLocation = require('./Helpers/IProjectLocation');
export declare class OfflineSearcher {
    private project;
    private options;
    private result;
    private layers;
    private propertyNames;
    private stopWords;
    private keywordIndex;
    private filesToProcess;
    constructor(project: IProjectLocation, options: IOfflineSearchOptions);
    savedFilename: string;
    projectFilename: string;
    private layerFilename(baseUrl);
    processProject(): void;
    private processLayer(layer, groupTitle);
    private getShortenedName(feature, nameLabel);
    private processProperties(props, propertiesToIndex, layerIndex, featureIndex);
    private addEntry(key, layerIndex, featureIndex);
    private addFullEntry(key, entry);
    private saveResult();
    loadResult(): void;
}
