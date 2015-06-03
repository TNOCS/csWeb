import IOfflineSearchOptions = require('./IOfflineSearchOptions');
import IProjectLocation = require('./Helpers/IProjectLocation');
/**
* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains.
*/
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
    /**
     * Return the (local) layer file name.
     */
    private layerFilename(baseUrl);
    /**
     * Process the project by extracting the groups and processing each layer.
     */
    processProject(): void;
    /**
     * Process a single layer by calling processProperties on each feature.
     * @layer {ILayer}
     */
    private processLayer(layer, groupTitle);
    /**
     * Get the shortened name of a feature.
     */
    private getShortenedName(feature);
    /**
     * Process each property that is included, and save the resulting Entry for each word
     * that is not a stop word.
     * @props {geo.IStringToAny}
     * @layerIndex {number}
     * @featureIndex {number}
     */
    private processProperties(props, layerIndex, featureIndex);
    /**
     * Add a new or enhance an existing entry.
     * @key {string}
     * @layerIndex {number}
     * @featureIndex {number}
     * @propertyIndex {number}
     */
    private addEntry(key, layerIndex, featureIndex);
    /**
     * Add a new or enhance an existing entry.
     * @key {string}
     * @entry {number[]}
     */
    private addFullEntry(key, entry);
    private saveResult();
    loadResult(): void;
}
