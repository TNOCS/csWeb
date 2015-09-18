var path = require('path');
var fs = require('fs');
var offlineSearcher = require('./OfflineSearcher');
/**
* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains.
*/
var OfflineSearchManager = (function () {
    function OfflineSearchManager(solutionsFile, options) {
        this.solutionsFile = solutionsFile;
        this.options = options;
        this.openSolution();
    }
    OfflineSearchManager.prototype.openSolution = function () {
        var _this = this;
        var file = path.join(process.cwd(), this.solutionsFile);
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            try {
                var solution = JSON.parse(data);
            }
            catch (e) {
                console.log(data);
                console.log(e);
                return;
            }
            solution.projects.forEach(function (project) {
                _this.processProject(project);
            });
        });
    };
    OfflineSearchManager.prototype.processProject = function (project) {
        var searcher = new offlineSearcher.OfflineSearcher(project, this.options);
        var result = searcher.processProject();
        console.log('Done');
    };
    return OfflineSearchManager;
})();
module.exports = OfflineSearchManager;
