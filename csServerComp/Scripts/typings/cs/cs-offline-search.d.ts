declare module "cs-offline-search" {
	interface IProjectLocation {
	  	title: string;
	  	url:   string;
	}

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

	/**
	* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains.
	*/
	class OfflineSearchManager {
	    private solutionsFile;
	    private options;
	    constructor(solutionsFile: string, options: IOfflineSearchOptions);
	    private openSolution();
	    private processProject(project: IProjectLocation): void;
	}

	export = OfflineSearchManager;
}
