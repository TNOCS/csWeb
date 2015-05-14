import IProjectLocation = require('./Helpers/IProjectLocation');
import IOfflineSearchOptions = require('./IOfflineSearchOptions');
/**
* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains.
*/
declare class OfflineSearchManager {
    private solutionsFile;
    private options;
    constructor(solutionsFile: string, options: IOfflineSearchOptions);
    private openSolution();
    processProject(project: IProjectLocation): void;
}
export = OfflineSearchManager;
