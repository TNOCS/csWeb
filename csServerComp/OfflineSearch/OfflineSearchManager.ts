'use strict'
/**
* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains. 
*/

import path            = require('path');
import fs              = require('fs');
import osr             = require('OfflineSearchResult');
import offlineSearcher = require('OfflineSearcher');

export class OfflineSearchManager {

    constructor(private solutionsFile: string, private stopwords: string[]) {
        this.openSolution();
    };

    openSolution() {
        var file = this.solutionsFile;
        fs.readFile(file, 'utf8',(err, data) => {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            data.groups.forEach((project) => {
                this.processProject(project);
            });
        });
    }

    processProject(project) {

    }
}
 