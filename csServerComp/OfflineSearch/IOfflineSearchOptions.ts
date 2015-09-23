import osr = require('./OfflineSearchResult');

/**
 * Specify the offline search options.
 */
interface IOfflineSearchOptions {
    /**
     * Words you wish to exclude from the index.
     * @type {string[]}
     */
    stopWords: string[];
    /**
     * The property types that you wish to use for generating the index.
     * @type {osr.PropertyType}
     */
    propertyNames: string[];
}

export = IOfflineSearchOptions;
