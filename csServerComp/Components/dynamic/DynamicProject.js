var fs = require('fs');
var path = require('path');
var chokidar = require('chokidar');
var DynamicProject;
(function (DynamicProject_1) {
    var IDynamicLayer = (function () {
        function IDynamicLayer() {
        }
        return IDynamicLayer;
    })();
    DynamicProject_1.IDynamicLayer = IDynamicLayer;
    var DynamicProject = (function () {
        function DynamicProject(folder, id, service) {
            this.folder = folder;
            this.id = id;
            this.service = service;
        }
        DynamicProject.prototype.Start = function () {
            var _this = this;
            this.openFile();
            this.watchFolder();
            this.service.server.get("/project/" + this.id, function (req, res) { _this.GetLayer(req, res); });
        };
        DynamicProject.prototype.openFile = function () {
            var _this = this;
            var f = this.folder + "/project.json";
            fs.readFile(f, 'utf8', function (err, data) {
                if (!err) {
                    try {
                        _this.project = JSON.parse(data);
                        if (!_this.project.groups)
                            _this.project.groups = [];
                        console.log(_this.project.title);
                    }
                    catch (e) {
                        console.log("Error (" + f + "): " + e);
                    }
                }
            });
        };
        DynamicProject.prototype.watchFolder = function () {
            var _this = this;
            var watcher = chokidar.watch(this.folder, { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true });
            watcher.on('add', function (path) { _this.addLayer(path); });
        };
        DynamicProject.prototype.addLayer = function (file) {
            var p = path;
            var pp = p.parse(file);
            if (pp.base === "project.json")
                return;
            var groupTitle = pp.dir.toLowerCase().replace(this.folder.toLowerCase(), "").replace("\\", "");
            if (groupTitle === "")
                return;
            var gg = this.project.groups.filter(function (element) { return (element != null && element.title && element.title.toLowerCase() == groupTitle); });
            var g = {};
            if (gg.length > 0) {
                g = gg[0];
            }
            else {
                g.title = groupTitle;
                g.layers = [];
                g.styles = [];
                g.oneLayerActive = false;
                this.project.groups.push(g);
            }
            var layer = {};
            layer.title = pp.name.split('_').join(' ');
            layer.type = "geojson";
            layer.url = "data/projects/" + this.id + "/" + g.title + "/" + pp.base;
            g.layers.push(layer);
            console.log("project id:" + this.project.id);
            this.service.connection.sendUpdate(this.project.id, "project", "layer-update", [layer]);
        };
        DynamicProject.prototype.GetLayer = function (req, res) {
            console.log("Get Layer: " + this.folder);
            res.send(JSON.stringify(this.project));
        };
        return DynamicProject;
    })();
    DynamicProject_1.DynamicProject = DynamicProject;
    var DynamicProjectService = (function () {
        function DynamicProjectService(server, connection) {
            this.server = server;
            this.connection = connection;
            this.projects = {};
        }
        DynamicProjectService.prototype.Start = function (server) {
            var _this = this;
            var rootDir = "public\\data\\projects";
            fs.readdir(rootDir, function (error, folders) {
                if (!error) {
                    folders.forEach(function (f) {
                        var filePath = rootDir + "\\" + f;
                        fs.stat(filePath, function (error, stat) {
                            if (!error && stat.isDirectory && filePath.indexOf('projects.json') == -1) {
                                var dp = new DynamicProject(filePath, f, _this);
                                _this.projects[f] = dp;
                                dp.Start();
                            }
                        });
                    });
                }
            });
            console.log("Start project service");
        };
        return DynamicProjectService;
    })();
    DynamicProject_1.DynamicProjectService = DynamicProjectService;
})(DynamicProject || (DynamicProject = {}));
module.exports = DynamicProject;
