import path                  = require('path');
import fs                    = require('fs');
import IProjectLocation      = require('./Helpers/IProjectLocation');
import ISolution             = require('./Helpers/ISolution');
import osr                   = require('./OfflineSearchResult');
import offlineSearcher       = require('./OfflineSearcher');
import IOfflineSearchOptions = require('./IOfflineSearchOptions');

/**
* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains.
*/
class OfflineSearchManager {

    constructor(private solutionsFile: string, private options: IOfflineSearchOptions) {
        this.openSolution();
    }

    private openSolution() {
        var file = path.join(process.cwd(), this.solutionsFile);
        fs.readFile(file, 'utf8', (err, data: string) => {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            try {
                var solution: ISolution = JSON.parse(data);
            }
            catch (e) {
                console.log(data);
                console.log(e);
                return;
            }
            solution.projects.forEach((project: IProjectLocation) => {
                this.processProject(project);
            });
        });
    }

    processProject(project: IProjectLocation) {
        var searcher = new offlineSearcher.OfflineSearcher(project, this.options);
        var result = searcher.processProject();
        console.log('Done');
    }

}
export = OfflineSearchManager;
