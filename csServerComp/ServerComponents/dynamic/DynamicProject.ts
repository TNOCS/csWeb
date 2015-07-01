require('rootpath')();
import express = require('express')
import ClientConnection = require('ClientConnection');
import MessageBus = require('../bus/MessageBus');
import fs = require('fs');
import path = require('path');
var chokidar = require('chokidar');

export class DynamicProject {
    public project: any;

    constructor(public folder: string, public id, public service: DynamicProjectService, public messageBus: MessageBus.MessageBusService) {
    }

    public Start() {
        /*var feature = new csComp.Services.Feature();
        feature.id = "hoi";
        console.log(JSON.stringify(feature));*/

        // load project file
        this.openFile();

        // watch directory changes for new geojson files
        this.watchFolder();

        // setup http handler
        this.service.server.get("/project/" + this.id, (req, res) => { this.GetLayer(req, res); });
    }

    public AddLayer(data: any) {
        var groupFolder = this.folder + "\\" + data.group;
        var resourceFolder = this.folder + "\\..\\..\\resourceTypes";
        var geojsonfile = groupFolder + "\\" + data.reference + ".json";
        var resourcefile = resourceFolder + "\\" + data.featureType + ".json";
        if (!fs.existsSync(groupFolder)) fs.mkdirSync(groupFolder);
        if (!fs.existsSync(resourceFolder)) fs.mkdirSync(resourceFolder);
        var combinedjson = this.splitJson(data);
        fs.writeFileSync(resourcefile, JSON.stringify(combinedjson.resourcejson));
        fs.writeFileSync(geojsonfile, JSON.stringify(combinedjson.geojson));
        console.log('done!');
    }

    private splitJson(data) {
        var geojson = {}, resourcejson: any = {};
        var combinedjson = data.geojson;
        if (combinedjson.hasOwnProperty('type') && combinedjson.hasOwnProperty('features')) {
            geojson = {
                type: combinedjson.type,
                features: combinedjson.features
            };
        }
        if (combinedjson.hasOwnProperty('featureTypes')) {
            for (var ftName in combinedjson.featureTypes) {
                if (combinedjson.featureTypes.hasOwnProperty(ftName)) {
                    var defaultFeatureType = combinedjson.featureTypes[ftName];
                    if (defaultFeatureType.hasOwnProperty('propertyTypeData')) {
                        var propertyTypeObjects = {};
                        var propKeys: string = '';
                        defaultFeatureType.propertyTypeData.forEach((pt) => {
                            propertyTypeObjects[pt.label] = pt;
                            propKeys = propKeys + pt.label + ';'
                        });
                        delete defaultFeatureType.propertyTypeData;
                        defaultFeatureType.propertyTypeKeys = propKeys;
                        defaultFeatureType.name = data.featureType;
                        resourcejson['featureTypes'] = {};
                        resourcejson.featureTypes[data.featureType] = defaultFeatureType;
                        resourcejson['propertyTypeData'] = {};
                        resourcejson.propertyTypeData = propertyTypeObjects;
                        data.defaultFeatureType = defaultFeatureType.name;
                    }
                }
            }
        }
        return { geojson: geojson, resourcejson: resourcejson };
    }

    /***
    Open project file from disk
    */
    public openFile() {
        var f = this.folder + "\\project.json";
        fs.readFile(f, 'utf8', (err, data) => {
            if (!err) {
                try {
                    this.project = JSON.parse(data);

                    if (!this.project.id) this.project.id = this.project.title;

                    if (!this.project.groups) this.project.groups = [];
                    //console.log("ProjectID: " + this.project.id);
                }
                catch (e) {
                    console.log("Error (" + f + "): " + e);
                }
            }
        });
    }

    public watchFolder() {
        console.log('watch folder:' + this.folder);
        setTimeout(() => {
            var watcher = chokidar.watch(this.folder, { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {
                if (action == "add") {
                    this.addLayer(path);
                }
                if (action == "unlink") {
                    this.removeLayer(path);
                }
                if (action == "change") {
                    this.addLayer(path);
                }
            }));
        }, 1000);
        //console.log(action + " - " + path); });
    }

    public removeLayer(file: string) {
        console.log("removing : " + file);
        var p = path;
        var pp = file.split(p.sep);
        if (p.basename(file) === 'project.json') return;

        // determine group
        var groupTitle = p.dirname(file).replace(this.folder, "").replace(p.sep, "");
        if (groupTitle === "") return;

        // check if group exists
        var gg = this.project.groups.filter((element: any) => (element != null && element.title && element.title.toLowerCase() == groupTitle.toLowerCase()));
        var g: any = {};
        if (gg.length > 0) {
            g = gg[0];
            var layer: any = {};
            layer.id = file;
            layer.groupId = g.title;
            g.layers = g.layers.filter(l => layer.id != l.id);
            this.service.connection.publish(this.project.id, "project", "layer-remove", [layer]);
        }
    }

    public addLayer(file: string) {
        if (!this.project) return;
        var p = path;
        var pp = file.split(p.sep);

        if (p.basename(file) === 'project.json') return;
        // determine group
        var groupTitle = p.dirname(file).replace(this.folder, "").replace(p.sep, "");

        if (groupTitle === "") return;

        // obtain additional parameters (useClustering, isEnabled, etc.)
        var parameters = this.service.projectParameters[groupTitle];

        //if (!parameters) parameters = { useClustering: true };
        if (!parameters) return; //parameters are required

        if (!this.project.groups) this.project.groups = [];
        // check if group exists
        var gg = this.project.groups.filter((element: any) => (element != null && element.title && element.title.toLowerCase() == groupTitle.toLowerCase()));
        var g: any = {};
        if (gg.length > 0) {
            g = gg[0];
        }
        else {
            //  var g : any; //new csComp.Services.ProjectGroup();
            g.id = groupTitle;
            g.title = groupTitle;
            g.layers = [];
            g.oneLayerActive = false;

            this.project.groups.push(g);
        }
        if (parameters.useClustering) {
            g.clustering = true;
            g.clusterLevel = parameters.clusterLevel;
        }
        var tt = file.split('\\');
        var t = tt[tt.length - 1].replace('.json', '');
        var layer: any = {};
        layer.id = file;
        layer.description = parameters.description;
        layer.title = parameters.layerTitle;//pp.name.split('_').join(' ');
        layer.type = "geojson";
        layer.url = "data/projects/" + this.id + "/" + g.title + "/" + p.basename(file);
        layer.groupId = g.id;
        layer.enabled = parameters.enabled;
        layer.reference = parameters.reference;
        layer.defaultFeatureType = parameters.featureType;
        if (parameters.featureType) layer.typeUrl = "data/resourceTypes/" + parameters.featureType + ".json";

        var layerExists = false;
        for (var i = 0; i < g.layers.length; i++) {
            if (g.layers[i].id === layer.id) {
                layerExists = true;
                break;
            }
        }
        if (!layerExists) g.layers.push(layer);

        this.service.connection.publish(this.project.id, "project", "layer-update", { layer: [layer], group: g });

        // save project.json (+backup)
        //console.log("g:" + group);
    }

    public GetLayer(req: express.Request, res: express.Response) {
        console.log("Get Layer: " + this.folder);
        res.send(JSON.stringify(this.project));
        //res.send("postgres layer");
    }
}

export class DynamicProjectService {
    public test: string;
    public projects: { [key: string]: DynamicProject } = {};
    public projectParameters: { [key: string]: any } = {};

    public constructor(public server: express.Express, public connection: ClientConnection.ConnectionManager, public messageBus: MessageBus.MessageBusService) { }

    public Start(server: express.Express) {
        console.log("Start project service");
        this.messageBus.subscribe('dynamic_project_layer', (title: string, data: any) => {
            // find project
            if (this.projects.hasOwnProperty(data.project)) {
                var dp = this.projects[data.project];
                //console.log("adding layer");
                dp.AddLayer(data);
                this.projectParameters[data.group] = data;
            }
        });

        var rootDir = "public\\data\\projects";
        fs.readdir(rootDir, (error, folders) => {
            if (!error) {
                folders.forEach((f) => {
                    var filePath = rootDir + "\\" + f;
                    fs.stat(filePath, (error, stat) => {
                        if (!error && stat.isDirectory && filePath.indexOf('projects.json') == -1) {
                            var dp = new DynamicProject(filePath, f, this, this.messageBus);
                            this.projects[f] = dp;
                            dp.Start();
                        }
                    });
                });
            }
        });
    }
}
