import ApiManager = require('./ApiManager');
import Layer = ApiManager.Layer;
import fs = require('fs');
import path = require('path');
import Feature = ApiManager.Feature;
import Log = ApiManager.Log;
import CallbackResult = ApiManager.CallbackResult;
import ApiResult = ApiManager.ApiResult;
import ApiMeta = ApiManager.ApiMeta;
import BaseConnector = require('./BaseConnector');
import _ = require('underscore');
var chokidar = require('chokidar');
import Winston = require('winston');



export class FileStorage extends BaseConnector.BaseConnector {
    public manager: ApiManager.ApiManager

    public layers: { [key: string]: Layer } = {}

    constructor(public rootpath: string) {
        super();
        // check if rootpath exists
        if (!fs.existsSync(rootpath)) {
            fs.mkdirSync(rootpath);
        }
        // load layers
        this.watchFolder();

    }

    public watchFolder() {
        Winston.info('filestore: watch folder:' + this.rootpath);
        setTimeout(() => {
            var watcher = chokidar.watch(this.rootpath, { ignoreInitial: false, ignored: /[\/\\]\./, persistent: true });
            watcher.on('all', ((action, path) => {

                if (action == "add") {
                    Winston.info('filestore: new file found : ' + path);
                    this.openFile(path);
                }
                if (action == "unlink") {
                    this.closeFile(path);
                    //this.removeLayer(path);
                }
                if (action == "change") {
                    //this.addLayer(path);
                }
            }));
        }, 1000);
        //Winston.info(action + " - " + path); });
    }


    saveFileDounce = _.debounce((layer: Layer) => {
        this.saveFile(layer);
    }, 5000);

    private getFilename(layerId: string) {
        return path.join(this.rootpath, layerId + ".json");
    }

    /*private saveFileDounce(layer: Layer) {
        this.saveFile(layer);
        //_.debounce(() => { this.saveFile(layer) }, 5000);
    }*/

    private saveFile(layer: Layer) {
        var fn = this.getFilename(layer.id);
        fs.writeFile(fn, JSON.stringify(layer), (error) => {
            if (error) {
                Winston.info('error writing file : ' + fn);
            }
            else {
                Winston.info('filestore: file saved : ' + fn);
            }
        });
    }

    private getLayerId(fileName: string) {
        return path.basename(fileName).toLowerCase().replace('.json', '');
    }

    private closeFile(fileName: string) {
        var id = this.getLayerId(fileName);
        this.manager.deleteLayer(id, {}, () => { });
    }

    private openFile(fileName: string) {
        var id = this.getLayerId(fileName);
        Winston.info('filestore: openfile ' + id);
        if (!this.manager.layers.hasOwnProperty(id) && !this.layers.hasOwnProperty(id)) {
            fs.readFile(fileName, "utf-8", (err, data) => {
                if (!err) {
                    var layer = <Layer>JSON.parse(data);
                    layer.storage = this.id;
                    layer.id = id;
                    this.layers[id] = layer;
                    layer.title = id;
                    layer.type = "geojson";
                    layer.url = "/api/layers/" + id;
                    this.manager.addLayer(layer, {}, () => { });
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

    // layer methods first, in crud order.

    public addLayer(layer: Layer, meta: ApiMeta, callback: Function) {
        try {
            this.layers[layer.id] = layer;
            this.saveFileDounce(layer);
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
            callback(<CallbackResult>{ result: ApiResult.OK, layer: null });
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.Error });
        }
    }

    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {
        if (this.layers.hasOwnProperty(layerId)) {
            delete this.layers[layerId];
            var fn = this.getFilename(layerId);
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
                this.saveFileDounce(layer);
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
        this.saveFileDounce(layer);
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
        this.saveFileDounce(layer);
        callback(<CallbackResult>{ result: ApiResult.OK, layer: null });
        Winston.info("filestore: update feature")

    }

    //TODO: test further. Result is the # of deleted docs.
    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        layer.features = layer.features.filter((k) => { return k.id && k.id !== featureId });
        callback(<CallbackResult>{ result: ApiResult.OK });
        this.saveFileDounce(layer);
    }

    public updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function) {

    }


    //TODO: Move connection set-up params from static to parameterized.
    public init(layerManager: ApiManager.ApiManager, options: any) {
        this.manager = layerManager;
        // set up connection

        Winston.info('filestore: init File Storage');

    }
}
