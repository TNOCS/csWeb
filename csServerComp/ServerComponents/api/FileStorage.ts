import ApiManager = require('./ApiManager');
import Project = ApiManager.Project;
import Layer = ApiManager.Layer;
import ResourceFile = ApiManager.ResourceFile;
import fs = require('fs-extra');
import path = require('path');
import Feature = ApiManager.Feature;
import Key = ApiManager.Key;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import BaseConnector = require('./BaseConnector');
import _ = require('underscore');
var chokidar = require('chokidar');
var StringExt = require('../helpers/StringExt'); // to remove the BOM.
import Winston = require('winston');
import helpers = require('../helpers/Utils');

export interface Icon {
    data: string;
    fileUri: string;
}

export class FileStorage extends BaseConnector.BaseConnector {
    public manager: ApiManager.ApiManager

    public layers: { [key: string]: Layer } = {}
    public projects: { [key: string]: Project } = {}
    public keys: { [key: string]: Key } = {}
    public resources: { [key: string]: ResourceFile } = {}
    public layersPath: string;
    public keysPath: string;
    public blobPath : string;
    public iconPath: string;
    public projectsPath: string;
    public resourcesPath: string;

    constructor(public rootpath: string) {
        super();
        this.keysPath = path.join(rootpath, "keys/");
        this.layersPath = path.join(rootpath, "layers/");
        this.projectsPath = path.join(rootpath, "projects/");
        this.resourcesPath = path.join(rootpath, "resourceTypes/");
        this.blobPath = path.join(rootpath,"blobs/");
        this.iconPath = path.join(rootpath, "/../../images/");
        // check if rootpath exists, otherwise create it, including its parents
        if (!fs.existsSync(rootpath)) { fs.mkdirsSync(rootpath); }
        this.watchLayersFolder();
        this.watchKeysFolder();
        this.watchProjectsFolder();
        this.watchResourcesFolder();
    }


    public watchLayersFolder() {
        Winston.info('filestore: watch folder:' + this.layersPath);
        if (!fs.existsSync(this.layersPath)) { fs.mkdirSync(this.layersPath); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.layersPath, { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {

                if (action == "add") {
                    Winston.info('filestore: new file found : ' + path);
                    this.openLayerFile(path);
                }
                if (action == "unlink") {
                    this.closeLayerFile(path);
                    //this.removeLayer(path);
                }
                if (action == "change") {
                    //this.addLayer(path);
                }
            }));
        }, 1000);
    }

    public watchProjectsFolder() {
        Winston.info('filestore: watch folder:' + this.projectsPath);
        if (!fs.existsSync(this.projectsPath)) { fs.mkdirSync(this.projectsPath); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.projectsPath, { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {
                if (action == "add") {
                    Winston.info('filestore: new file found : ' + path);
                    this.openProjectFile(path);
                }
                if (action == "unlink") {
                    this.closeLayerFile(path);
                    //this.removeLayer(path);
                }
                if (action == "change") {
                    //this.addLayer(path);
                }
            }));
        }, 1000);
    }

    public watchKeysFolder() {
        Winston.info('filestore: watch folder:' + this.keysPath);
        if (!fs.existsSync(this.keysPath)) { fs.mkdirSync(this.keysPath); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.keysPath, { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {
                if (action == "add") {
                    Winston.info('filestore: new file found : ' + path);
                    this.openKeyFile(path);
                }
                if (action == "unlink") {
                    this.closeKeyFile(path);
                }
                if (action == "change") {
                }
            }));
        }, 1000);
    }

    public watchResourcesFolder() {
        Winston.info('filestore: watch folder:' + this.resourcesPath);
        if (!fs.existsSync(this.resourcesPath)) { fs.mkdirSync(this.resourcesPath); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.resourcesPath, { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {
                if (action == "add") {
                    Winston.info('filestore: new file found : ' + path);
                    this.openResourceFile(path);
                }
                if (action == "unlink") {
                    this.closeResourceFile(path);
                }
                if (action == "change") {
                }
            }));
        }, 1000);
    }

    saveProjectDelay = _.debounce((project: Project) => {
        this.saveProjectFile(project);
    }, 5000);

    saveResourcesDelay = _.debounce((res: ResourceFile) => {
        this.saveResourceFile(res);
    }, 25);

    saveKeyDelay = _.debounce((key: Key) => {
        this.saveKeyFile(key);
    }, 5000);

    saveLayerDelay = _.debounce((layer: Layer) => {
        this.saveLayerFile(layer);
    }, 2000);


    private getProjectFilename(projectId: string) {
        return path.join(this.projectsPath, projectId + ".json");
    }

    private getLayerFilename(layerId: string) {
        return path.join(this.layersPath, layerId + ".json");
    }

    private getKeyFilename(keyId: string) {
        return path.join(this.keysPath, keyId + ".json");
    }

    private getResourceFilename(resId: string) {
        return path.join(this.resourcesPath, resId + ".json");
    }

    private saveKeyFile(key: Key) {
        var fn = this.getKeyFilename(key.id);
        fs.outputFile(fn, JSON.stringify(key), (error) => {
            if (error) {
                Winston.error('filestore: error writing file : ' + fn + error.message);
            }
            else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }

    private saveResourceFile(res: ResourceFile) {
        var fn = this.getResourceFilename(res.id);
        fs.outputFile(fn, JSON.stringify(res), (error) => {
            if (error) {
                Winston.error('filestore: error writing file : ' + fn);
            }
            else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }

    private saveProjectFile(project: Project) {
        var fn = this.getProjectFilename(project.id);
        fs.writeFile(fn, JSON.stringify(project), (error) => {
            if (error) {
                Winston.info('error writing file : ' + fn);
            }
            else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }

    private saveIcon(icon: Icon) {
        var binaryData = new Buffer(icon.data, 'base64');
        fs.writeFile(icon.fileUri, binaryData, (error) => {
            if (error) {
                Winston.info('error writing file : ' + icon.fileUri);
            }
            else {
                Winston.info('filestore: file saved : ' + icon.fileUri);
            }
        });
    }

    private saveLayerFile(layer: Layer) {
        var fn = this.getLayerFilename(layer.id);
        fs.writeFile(fn, JSON.stringify(layer), (error) => {
            if (error) {
                Winston.info('error writing file : ' + fn);
            }
            else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }

    private getProjectId(fileName: string) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    }

    private getKeyId(fileName: string) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    }

    private getResourceId(fileName: string) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    }

    private getLayerId(fileName: string) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    }

    private closeLayerFile(fileName: string) {
        var id = this.getLayerId(fileName);
        this.manager.deleteLayer(id, {}, () => { });
    }

    private closeKeyFile(fileName: string) {

    }

    private closeResourceFile(fileName: string) {

    }

    private closeProjectFile(fileName: string) {
        var id = this.getProjectId(fileName);
        this.manager.deleteProject(id, {}, () => { });
    }

    private openLayerFile(fileName: string) {
        var id = this.getLayerId(fileName);
        Winston.info('filestore: openfile ' + id);
        if (!this.layers.hasOwnProperty(id)) {
            fs.readFile(fileName, "utf8", (err, data) => {
                if (!err) {
                    var layer: Layer;
                    try {
                        layer = <Layer>JSON.parse(data);
                    } catch (e) {
                        Winston.warn(`Error parsing file: ${fileName}. Skipped`);
                        return;
                    }
                    layer.storage = this.id;
                    layer.id = id;
                    this.layers[id] = layer;
                    //layer.title = id;
                    layer.storage = this.id;
                    //layer.type = "geojson";
                    layer.url = "/api/layers/" + id;
                    Winston.info('storage ' + layer.storage);
                    this.manager.updateLayer(layer, {}, () => { });
                }
            });
        }
        if (path.basename(fileName) === 'project.json') return;
    }


    private openKeyFile(fileName: string) {
        var id = this.getKeyId(fileName);
        Winston.info('filestore: openfile ' + id);
        if (!this.keys.hasOwnProperty(id)) {
            fs.readFile(fileName, "utf8", (err, data) => {
                if (!err) {
                    var key = <Key>JSON.parse(data);
                    key.storage = this.id;
                    key.id = id;
                    this.keys[id] = key;
                    this.manager.addKey(key, <ApiMeta>{ source: this.id }, () => { });
                }
            });
        }
    }

    private openResourceFile(fileName: string) {
        var id = this.getResourceId(fileName);
        Winston.info('filestore: openfile ' + id);
        if (!this.resources.hasOwnProperty(id)) {
            fs.readFile(fileName, "utf8", (err, data) => {
                if (!err) {
                    var res = <ResourceFile>JSON.parse(data.removeBOM());
                    res.id = id;
                    this.resources[id] = res;
                    this.manager.addResource(res, <ApiMeta>{ source: this.id }, () => { });
                }
            });
        }
    }

    private openProjectFile(fileName: string) {
        var id = this.getProjectId(fileName);
        Winston.info('filestore: openfile ' + id);
        if (!this.projects.hasOwnProperty(id)) {
            fs.readFile(fileName, "utf8", (err, data) => {
                if (!err) {
                    var project = <Project>JSON.parse(data);
                    this.manager.getProjectDefinition(project);
                    this.projects[id] = project;
                    // project.storage = this.id;
                    // project.id = id;
                    // project.title = id;
                    // project.groups = [];
                    // project.logo = "";
                    // project.url = "/api/projects/" + id;
                    this.manager.updateProject(project, {}, () => { });
                } else {
                    Winston.error('Error reading file: ' + id + '(' + err.message + ')')
                }
            });
        }

        if (path.basename(fileName) === 'project.json') return;
    }


    /**
     * Find layer for a specific layerId (can return null)
     */
    public findLayer(layerId: string): Layer {
        if (this.layers.hasOwnProperty(layerId)) {
            return this.layers[layerId];
        } else { return null; };
    }

    public addProject(project: Project, meta: ApiMeta, callback: Function) {
        try {
            this.projects[project.id] = project;
            this.saveProjectDelay(project);
            callback(<CallbackResult> { result: ApiResult.OK, project: project });
        }
        catch (e) {
            callback(<CallbackResult>{ result: ApiResult.OK, error: null });
        }
    }

    public getProject(projectId: string, meta: ApiMeta, callback: Function) {

        if (this.projects.hasOwnProperty(projectId)) {
            callback(<CallbackResult>{ result: ApiResult.OK, project: this.projects[projectId] });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.ProjectNotFound });
        }
    }

    public updateProject(project: Project, meta: ApiMeta, callback: Function) {
        if (this.projects.hasOwnProperty(project.id)) {
            this.projects[project.id] = project;
            this.saveProjectDelay(project);
            Winston.info('Added project ' + project.id + ' to FileStorage projects');
            callback(<CallbackResult>{ result: ApiResult.OK, project: null });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.Error });
        }
    }

    // layer methods first, in crud order.

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        try {
            this.layers[layer.id] = layer;
            this.saveLayerDelay(layer);
            callback(<CallbackResult> { result: ApiResult.OK });
        }
        catch (e) {
            callback(<CallbackResult>{ result: ApiResult.OK, error: null });
        }
    }

    public getLayer(layerId: string, meta: ApiMeta, callback: Function) {

        if (this.layers.hasOwnProperty(layerId)) {
            callback(<CallbackResult>{ result: ApiResult.OK, layer: this.layers[layerId] });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.LayerNotFound });
        }
    }

    public updateLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        if (this.layers.hasOwnProperty(layer.id)) {
            this.layers[layer.id] = layer;
            this.saveLayerDelay(layer);
            Winston.info("FileStorage: updated layer" + layer.id);
            callback(<CallbackResult>{ result: ApiResult.OK, layer: null });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.Error });
        }
    }

    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {
        if (this.layers.hasOwnProperty(layerId)) {
            delete this.layers[layerId];
            var fn = this.getLayerFilename(layerId);
            fs.unlink(fn, (err) => {
                if (err) {
                    Winston.error('File: Error deleting ' + fn + " (" + err.message + ")");
                }
                else {
                    Winston.info('File: deleted: ' + fn);
                }
            });
            callback(<CallbackResult>{ result: ApiResult.OK, layer: null });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.Error });
        }

    }

    // feature methods, in crud order
    public addFeature(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        if (layer) {
            // check if id doesn't exist
            if (!layer.features.some((f: Feature) => { return f.id === feature.id })) {
                layer.features.push(feature);
                this.saveLayerDelay(layer);
                callback(<CallbackResult>{ result: ApiResult.OK, layer: null });
            }
            else {
                Winston.error('filestorage: add feature: feature id already exists');
                callback(<CallbackResult>{ result: ApiResult.Error, error: "Feature ID already exists" });
            }

        }
        else {
            callback(<CallbackResult>{ result: ApiResult.Error });
        }
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {

    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {
        var f: Feature;
        var layer = this.findLayer(layerId);
        layer.features.some(feature => {
            if (!feature.id || feature.id !== featureId) return false;
            // feature found
            f = feature;
            return true;
        });
        if (!f) {
            callback(<CallbackResult>{ result: ApiResult.Error });
            return; // feature not found
        }
        if (!f.hasOwnProperty('logs')) f.logs = {};
        if (!f.hasOwnProperty('properties')) f.properties = {};

        // apply changes

        for (var key in logs) {
            if (!f.logs.hasOwnProperty(key)) f.logs[key] = [];
            logs[key].forEach(l=> {
                delete l.prop;
                f.logs[key].push(l);
                if (key != "~geometry") f.properties[key] = l.value;
            });

            // send them to other clients
            //
        }
        this.saveLayerDelay(layer);
        callback(<CallbackResult>{ result: ApiResult.OK, layer: null });
    }




    public getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var l = this.layers[layerId];
        var found = false;
        l.features.forEach((f: Feature) => {
            if (f.id === featureId)
                found = true;
            callback(<CallbackResult> { result: ApiResult.OK, feature: f });
        })
        if (!found) callback(<CallbackResult>{ result: ApiResult.Error });
    }


    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        var f = layer.features.filter((k) => { return k.id && k.id === feature.id });
        if (f && f.length > 0) {
            var index = layer.features.indexOf(f[0]);
            layer.features[index] = feature;
        }
        else {
            layer.features.push(feature);
        }
        this.saveLayerDelay(layer);
        Winston.info("filestore: update feature")
        callback(<CallbackResult>{ result: ApiResult.OK, layer: null });


    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        layer.features = layer.features.filter((k) => { return k.id && k.id !== featureId });
        callback(<CallbackResult>{ result: ApiResult.OK });
        this.saveLayerDelay(layer);
        callback(<CallbackResult>{ result: ApiResult.OK});
    }

    public addFile(b64: string, folder : string, file : string, meta: ApiMeta, callback: Function) {
        var fileUri = path.join(this.iconPath, file.split('/').pop());
        var i: Icon = { data: b64, fileUri: fileUri };
        this.saveIcon(i);
        callback(<CallbackResult>{ result: ApiResult.OK});
    }

    public addResource(res: ResourceFile, meta: ApiMeta, callback: Function) {
        if (!res.id) res.id = helpers.newGuid();
        if (!res.propertyTypes) res.propertyTypes = {};
        if (!res.featureTypes) res.featureTypes = {};
        this.resources[res.id] = res;
        this.saveResourcesDelay(res);
        callback(<CallbackResult>{ result: ApiResult.OK});
    }

    public addKey(key: Key, meta: ApiMeta, callback: Function) {
        if (!key.id) key.id = helpers.newGuid();
        if (!key.values) key.values = [];
        this.keys[key.id] = key;
        this.saveKeyDelay(key);
        callback(<CallbackResult>{ result: ApiResult.OK});
    }

    public getKey(keyId: string, meta: ApiMeta, callback: Function) {
        if (this.keys.hasOwnProperty(keyId)) {
            var k = this.keys[keyId];
            callback(<CallbackResult>{ result: ApiResult.OK, key: k });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.KeyNotFound });
        }
    }

    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {
        if (!this.keys.hasOwnProperty(keyId)) this.addKey(<Key>{ id: keyId, storage: "file" }, meta, () => { });
        var k = this.keys[keyId];
        if (k != null) {
            k.values.push(value);
        }
        this.saveKeyDelay(k);
    }


    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        // set up connection

        Winston.info('filestore: init File Storage');

    }
}
