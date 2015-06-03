import IProjectLocation = require('./Helpers/IProjectLocation');
import IOfflineSearchOptions = require('./IOfflineSearchOptions');
declare class OfflineSearchManager {
    private solutionsFile;
    private options;
    constructor(solutionsFile: string, options: IOfflineSearchOptions);
    private openSolution();
    processProject(project: IProjectLocation): void;
}
export = OfflineSearchManager;
