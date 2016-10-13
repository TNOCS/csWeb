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
var sift = require('sift');

export interface Media {
    base64: string;
    fileUri: string;
}

export class FileStorage extends BaseConnector.BaseConnector {
    public manager: ApiManager.ApiManager

    public layers: { [key: string]: Layer } = {}
    public projects: { [key: string]: Project } = {}
    public keys: { [key: string]: Key } = {}
    public resources: { [key: string]: ResourceFile } = {}
    public layersPath: string;
    public backupPath: string;
    public layersBackupPath: string;
    public keysPath: string;
    public blobPath: string;
    public iconPath: string;
    public projectsPath: string;
    public staticProjectsPath: string;
    public resourcesPath: string;

    constructor(public rootpath: string, watch: boolean = true, private ignoreInitial = false) {
        super();
        this.receiveCopy = false;
        this.backupPath = path.join(rootpath, 'backup/');
        this.keysPath = path.join(rootpath, 'keys/');
        this.layersPath = path.join(rootpath, 'layers/');
        this.layersBackupPath = path.join(this.backupPath, 'layers/');
        this.projectsPath = path.join(rootpath, 'projects/');
        this.resourcesPath = path.join(rootpath, 'resourceTypes/');
        this.blobPath = path.join(rootpath, 'blobs/');
        this.iconPath = path.join(rootpath, '../images/');
        // check if rootpath exists, otherwise create it, including its parents
        if (!fs.existsSync(rootpath)) { fs.mkdirsSync(rootpath); }
        if (!fs.existsSync(this.backupPath)) { fs.mkdirsSync(this.backupPath); }
        if (!fs.existsSync(this.layersBackupPath)) { fs.mkdirsSync(this.layersBackupPath); }
        if (!fs.existsSync(this.iconPath)) { fs.mkdirsSync(this.iconPath); }
        if (watch) {
            this.watchLayersFolder();
            this.watchKeysFolder();
            this.watchProjectsFolder();
            this.watchResourcesFolder();
        }
    }

    public watchLayersFolder() {
        Winston.info('filestore: watch folder:' + this.layersPath);
        if (!fs.existsSync(this.layersPath)) { fs.mkdirSync(this.layersPath); }
        if (!fs.existsSync(path.join(this.layersPath, 'backup'))) { fs.mkdirSync(path.join(this.layersPath, 'backup')); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.layersPath, { ignoreInitial: this.ignoreInitial, ignored: /[\/\\]\./, persistent: true });
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

    private getDirectories(srcpath) {
        return fs.readdirSync(srcpath).filter((file) => {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    }

    public watchProjectsFolder() {
        Winston.info('filestore: watch folder:' + this.projectsPath);
        if (!fs.existsSync(this.projectsPath)) { fs.mkdirSync(this.projectsPath); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.projectsPath, { ignoreInitial: this.ignoreInitial, depth: 0, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {
                if (action == "add") {
                    Winston.info('filestore: new project found : ' + path);
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
            var folders = this.getDirectories(this.projectsPath);
            folders.forEach((folder: string) => {
                this.openStaticFolder(folder);
            });

        }, 1000);
    }

    public openStaticFolder(folder: string) {
        // check if project file exists
        var f = path.join(this.projectsPath, folder);
        var projectFile = path.join(f, "project.json");
        if (fs.existsSync(projectFile)) {
            this.openProjectFile(projectFile, folder, true);

            var rf = path.join(f, "resources");
            if (fs.existsSync(rf)) {
                fs.readdir(rf, (error, files) => {
                    if (!error) {
                        files.forEach(file => {
                            this.openResourceFile(path.join(rf, file));
                        });
                    }
                });
            }
            //Winston.error('project file found : ' + folder);
        }
        else {
            Winston.error('project file not found : ' + folder);
        }

    }

    public watchKeysFolder() {
        Winston.info('filestore: watch folder:' + this.keysPath);
        if (!fs.existsSync(this.keysPath)) { fs.mkdirSync(this.keysPath); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.keysPath, { ignoreInitial: this.ignoreInitial, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {
                if (!fs.statSync(path).isDirectory()) {
                    if (action == "add") {
                        Winston.info('filestore: new file found : ' + path);
                        this.openKeyFile(path);
                    }
                    if (action == "unlink") {
                        this.closeKeyFile(path);
                    }
                    if (action == "change") {
                    }
                }
            }));
        }, 1000);
    }

    public watchResourcesFolder() {
        Winston.info('filestore: watch folder:' + this.resourcesPath);
        if (!fs.existsSync(this.resourcesPath)) { fs.mkdirSync(this.resourcesPath); }
        setTimeout(() => {
            var watcher = chokidar.watch(this.resourcesPath, { ignoreInitial: this.ignoreInitial, ignored: /[\/\\]\./, persistent: true });
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
        return path.join(this.projectsPath, projectId + '.json');
    }

    private getLayerFilename(layerId: string) {
        return path.join(this.layersPath, layerId + '.json');
    }

    private getLayerBackupFilename(layerId: string) {
        return path.join(this.layersBackupPath, layerId + '-' + new Date().getTime() + '.json');
    }

    private getKeyFilename(keyId: string) {
        return path.join(this.keysPath, keyId + '.json');
    }

    // private getResourceFilename(re: ResourceFile) {
    //     console.log('!!! resource file loc:' + re._localFile);
    //     return re._localFile;
    //     //return path.join(this.resourcesPath, resId + '.json');
    // }

    private getResourceFilename(re: ResourceFile) {
        //console.log('!!! resource file loc:' + re._localFile);
        //return re._localFile;
        return path.join(this.resourcesPath, re.id + '.json');
    }

    private saveKeyFile(key: Key) {
        var fn = this.getKeyFilename(key.id);
        fs.outputFile(fn, JSON.stringify(key), (error) => {
            if (error) {
                Winston.error('filestore: error writing key-file : ' + fn + error.message);
            } else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }

    private saveResourceFile(res: ResourceFile) {
        var fn = this.getResourceFilename(res);
        fs.outputFile(fn, JSON.stringify(res,null,2), (error) => {
            if (error) {
                Winston.error('filestore: error writing resourcefile : ' + fn);
            } else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }



    /** Save project file to disk */
    private saveProjectFile(project: Project) {
        var fn = project._localFile;
        if (!fn) {
            fn = this.getProjectFilename(project.id);
        }
        Winston.info('writing project file : ' + fn);
        fs.writeFile(fn, JSON.stringify(project, null, 4), (error) => {
            if (error) {
                Winston.info('error writing project file : ' + fn);
            } else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }

    /** save media file */
    private saveBase64(media: Media) {
        var binaryData = new Buffer(media.base64, 'base64');
        fs.writeFile(media.fileUri, binaryData, (error) => {
            if (error) {
                Winston.error('filestore: error writing base64-file : ' + media.fileUri + ' (err: ' + error + ')');
            } else {
                Winston.info('filestore: file saved : ' + media.fileUri);
            }
        });
    }

    private saveLayerFile(layer: Layer) {
        try {
            var fn = this.getLayerFilename(layer.id);
            fs.writeFile(fn, JSON.stringify(layer, null, 2), (error) => {
                if (error) {
                    Winston.info('error writing file : ' + fn);
                }
                else {
                    Winston.info('filestore: file saved : ' + fn);
                }
            });

            if (layer.type === "dynamicgeojson") {
                var backup = this.getLayerBackupFilename(layer.id);
                fs.writeFile(backup, JSON.stringify(layer, null, 2), (error) => {
                    if (error) {
                        Winston.info('error writing file : ' + backup);
                    }
                    else {
                        Winston.info('filestore: file saved : ' + backup);
                    }
                });
            }
        }
        catch (e) {
            Winston.error('Error writing layer ' + layer.title + ':' + e);
        }
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
        if ((fileName.indexOf('.backup')) > 0) return;
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
                    this.manager && this.manager.addUpdateLayer(layer, {}, () => { });
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
                if (!err && data && data.indexOf('{') >= 0) {
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
        console.log('!! open resource file : ' + fileName + " (" + id + ")");
        Winston.info('filestore: openfile ' + id);
        if (!this.resources.hasOwnProperty(id)) {
            fs.readFile(fileName, 'utf8', (err, data) => {
                if (!err && data && data.length > 0) {
                    var res = <ResourceFile>JSON.parse(data.removeBOM());
                    res._localFile = fileName;
                    res.id = id;
                    this.resources[id] = res;
                    this.manager && this.manager.addResource(res, false, <ApiMeta>{ source: this.id }, () => { });
                    this.saveResourceFile(res);
                }
            });
        }
    }

    private openProjectFile(fileName: string, id?: string, isDynamic?: boolean) {
        if (!id) id = this.getProjectId(fileName);
        Winston.info('filestore: openfile ' + fileName);

        fs.readFile(fileName, 'utf8', (err, data) => {
            if (!err && data && data.length > 0) {
                var project = <Project>JSON.parse(data);
                project._localFile = fileName;
                if (typeof project.id === 'undefined') {
                    project.id = id || helpers.newGuid();
                    this.manager.getProjectId(project);
                    this.saveProjectFile(project);
                }

                if (!this.projects.hasOwnProperty(project.id)) {
                    id = project.id;

                    //var proj = this.manager.getProjectDefinition(project);
                    this.projects[id] = project;
                    project.storage = this.id;
                    //console.log(JSON.stringify(project));
                    // project.id = id;
                    // project.title = id;
                    // project.groups = [];
                    // project.logo = "";

                    if (typeof isDynamic !== 'undefined') project.isDynamic = isDynamic;
                    project.url = "/api/projects/" + id;

                    this.manager && this.manager.updateProject(project, {}, () => { });
                }
            } else if (err) {
                Winston.error('Error reading file: ' + id + '(' + err.message + ')')
            }
        });


        //if (path.basename(fileName) === 'project.json') {return;}
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
            callback(<CallbackResult>{ result: ApiResult.OK, project: project });
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
            callback(<CallbackResult>{ result: ApiResult.OK });
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
            Winston.info("FileStorage: updated layer " + layer.id);
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

    public searchLayer(layerId: string, keyWord: string, meta: ApiMeta, callback: Function) {
        Winston.error('search request:' + layerId + " (" + keyWord + ")");
        var result: Feature[] = [];
        callback(<CallbackResult>{ result: ApiResult.OK, features: result })

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
            logs[key].forEach(l => {
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
            if (f.id === featureId) {
                found = true;
                callback(<CallbackResult>{ result: ApiResult.OK, feature: f });
            }
        })
        if (!found) callback(<CallbackResult>{ result: ApiResult.Error });
    }


    //TODO: implement
    public updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        if (!layer) {
            callback(<CallbackResult>{ result: ApiResult.LayerNotFound, layer: null });
            return;
        }
        if (!layer.features) {
            callback(<CallbackResult>{ result: ApiResult.FeatureNotFound, layer: null });
            return;
        }
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
        if (layer && layer.features) {
            layer.features = layer.features.filter((k) => { return k.id && k.id !== featureId });
            this.saveLayerDelay(layer);
        }
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    /** Add a file: images go to the iconPath folder, others to the blob folder */
    public addFile(base64: string, folder: string, file: string, meta: ApiMeta, callback: Function) {
        var ext = path.extname(file).toLowerCase();
        var fileUri: string = file.split('/').pop(); // retreive the file name
        switch (ext) {
            case '.png':
            case '.jpg':
            case '.gif':
            case '.jpeg':
            case '.tif':
            case '.tiff':
                fileUri = path.join(this.iconPath, fileUri);
                break;
            default:
                fileUri = path.join(this.blobPath, fileUri);
                break;
        }
        var media: Media = { base64: base64, fileUri: fileUri };
        this.saveBase64(media);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    public addResource(res: ResourceFile, meta: ApiMeta, callback: Function) {
        if (!res.id) res.id = helpers.newGuid();
        if (!res.propertyTypeData) res.propertyTypeData = {};
        if (!res.featureTypes) res.featureTypes = {};
        this.resources[res.id] = res;
        this.saveResourcesDelay(res);
        callback(<CallbackResult>{ result: ApiResult.OK });
    }

    /** Get a resource file  */
    public getResource(resourceId: string, meta: ApiMeta, callback: Function) {
        if (this.resources.hasOwnProperty(resourceId)) {
            callback(<CallbackResult>{ result: ApiResult.OK, resource: this.resources[resourceId] });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.ResourceNotFound });
        }
    }

    public addKey(key: Key, meta: ApiMeta, callback: Function) {
        if (!key.id) key.id = helpers.newGuid();
        if (!key.values) key.values = [];
        this.keys[key.id] = key;
        this.saveKeyDelay(key);
        callback(<CallbackResult>{ result: ApiResult.OK });
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
        if (!this.keys.hasOwnProperty(keyId)) this.addKey(<Key>{ id: keyId, storage: '' }, meta, () => { });
        var k = this.keys[keyId];
        if (k != null) {
            k.values.push(value);
        }
        if (k.storage === 'file') this.saveKeyDelay(k);
    }


    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        // set up connection

        Winston.info('filestore: init File Storage');

    }
}
