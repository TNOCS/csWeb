import Winston = require('winston');
import helpers = require('../helpers/Utils');
import AuthApi = require('./AuthAPI');
import socketio = require('./SocketIOAPI');
import fs = require('fs');
import path = require('path');
import events = require('events');
import _ = require('underscore');
import async = require('async');
var StringExt = require('../helpers/StringExt'); // to remove the BOM.

/**
 * Api Result status
 */
export enum ApiResult {
    OK = 200,
    Error = 400,
    LayerAlreadyExists = 406,
    LayerNotFound = 407,
    FeatureNotFound = 408,
    ProjectAlreadyExists = 409,
    ProjectNotFound = 410,
    KeyNotFound = 411,
    GroupNotFound = 412,
    GroupAlreadyExists = 413,
    ResourceNotFound = 428,
    ResourceAlreadyExists = 429,
    SearchNotImplemented = 440
}

export interface IApiManagerOptions {
    /** Host:port name */
    server?: string;
    /** Location of the simulation data */
    simDataFolder?: string;
    /** Specify what MQTT should subscribe to */
    mqttSubscriptions?: string[];
    [key: string]: any;
}

export interface ApiMeta {
    source?: string;
    user?: string;
}

/**
 * Default result object for api calls
 */
export class CallbackResult {
    public result: ApiResult;
    public error: any;
    public project: Project;
    public layer: Layer;
    public groups: string[];
    public feature: Feature;
    public features: Feature[];
    public resource: ResourceFile;
    public keys: { [keyId: string]: Key };
    public key: Key;
}

/** Event emitted by the ApiManager */
export enum Event {
    KeyChanged, PropertyChanged, FeatureChanged, LayerChanged, ProjectChanged, FeaturesChanged
}

/** Type of change in an ApiEvent */
export enum ChangeType {
    Create, Update, Delete
}

/** When a key|layer|project is changed, the ChangeEvent is emitted with the following data. */
export interface IChangeEvent {
    id: string;
    type: ChangeType;
    value?: Object;
}

export interface IConnector {
    id: string;
    isInterface: boolean;
    /** If true (default), the manager will send a copy to the source (receiving) connector */
    receiveCopy: boolean;
    init(layerManager: ApiManager, options: any, callback: Function);
    exit(callback: Function);
    initLayer(layer: ILayer, meta?: ApiMeta);
    initProject(project: Project, meta?: ApiMeta);

    //Layer methods
    addLayer(layer: ILayer, meta: ApiMeta, callback: Function);
    getLayer(layerId: string, meta: ApiMeta, callback: Function);
    updateLayer(layer: ILayer, meta: ApiMeta, callback: Function);
    deleteLayer(layerId: string, meta: ApiMeta, callback: Function);
    searchLayer(layerId: string, keyWord: string, meta: ApiMeta, callback: Function);
    //feature methods
    addFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function);
    getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function);
    updateFeature(layerId: string, feature: any, useLog: boolean, meta: ApiMeta, callback: Function);
    deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function);
    addUpdateFeatureBatch(layerId: string, features: any[], useLog: boolean, meta: ApiMeta, callback: Function);
    //log methods
    addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function);
    getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function);
    deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function);
    updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function);
    updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function);

    //geospatial stuff
    getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function);
    getSphere(layerId: string, maxDistance: number, longtitude: number, latitude: number, meta: ApiMeta, callback: Function);
    getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function);
    //add a new project (e.g., for Excel2map)
    addProject(project: Project, meta: ApiMeta, callback: Function);
    getProject(projectId: string, meta: ApiMeta, callback: Function);
    updateProject(project: Project, meta: ApiMeta, callback: Function);
    deleteProject(projectId: string, meta: ApiMeta, callback: Function);
    allGroups(projectId: string, meta: ApiMeta, callback: Function);

    /** Add a resource type file to the store. */
    addResource(reource: ResourceFile, meta: ApiMeta, callback: Function);
    /** Get a resource file  */
    getResource(resourceId: string, meta: ApiMeta, callback: Function);
    /** Add a file to the store, e.g. an icon or other media. */
    addFile(base64: string, folder: string, file: string, meta: ApiMeta, callback: Function);

    /** Get a specific key */
    getKey(keyId: string, meta: ApiMeta, callback: Function);
    /** Get a list of available keys */
    getKeys(meta: ApiMeta, callback: Function);
    /** Update the value for a given keyId */
    updateKey(keyId: string, value: Object, meta: ApiMeta, callback: Function);
    /** Delete key */
    deleteKey(keyId: string, meta: ApiMeta, callback: Function);
    /**
     * Subscribe to certain keys.
     * @method subscribeKey
     * @param  {string}     keyPattern Pattern to listen for, e.g. hello/me/+:person listens for all hello/me/xxx topics.
     * @param  {ApiMeta}    meta       [description]
     * @param  {Function}   callback   Called when topic is called.
     * @return {[type]}                [description]
     */
    subscribeKey(keyPattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void);
}

export interface StorageObject {
    id: string;
    storage: string;
}

export class Key implements StorageObject {
    id: string;
    title: string;
    storage: string;
    values: Object[];
}

/**
 * Project definition
 */
export class Project implements StorageObject {
    id: string;
    title: string;
    url: string;
    _localFile: string;
    description: string;
    logo: string;
    storage: string;
    groups: Group[];
    isDynamic: boolean;
}

export class Group {
    id: string;
    title: string;
    description: string;
    clustering: boolean;
    clusterLevel: number;
    layers: Layer[];
}

export class ApiKeySubscription {
    id: string;
    /** Pattern you subscribe too */
    pattern: string;
    /** Regex safe variant of the pattern, i.e. the . is replaced with a \. */
    regexPattern: RegExp;
    callback: Function;
}

/**
 * Geojson ILayer definition
 */
export interface ILayer extends StorageObject {
    /** Server of the layer, needed for remote synchronization */
    server?: string;
    /**
     * id of storage connector
     */
    useLog?: boolean;
    updated?: number;
    enabled?: boolean;
    opacity?: number;
    id: string;
    type?: string;
    dynamic?: boolean;
    title?: string;
    image?: string;
    description?: string;
    url?: string;
    typeUrl?: string;
    defaultFeatureType?: string;
    defaultLegendProperty?: string;
    dynamicResource?: boolean;
    tags?: string[];
    isDynamic?: boolean;
    features?: Feature[];
    data?: any;
    timestamps?: number[];
    [key: string]: any;
    hasSensorData?: boolean;
    quickRefresh?: boolean;
    confirmUpdate?: boolean;
}

/**
 * Geojson Layer definition
 */
export class Layer implements StorageObject, ILayer {
    /** Server of the layer, needed for remote synchronization */
    public server: string;
    /**
     * id of storage connector
     */
    public storage: string;
    public useLog: boolean;
    public updated: number;
    public enabled: boolean;
    public opacity: number;
    public id: string;
    public type: string;
    public dynamic: boolean;
    public title: string;
    public image: string;
    public description: string;
    public url: string;
    public typeUrl: string;
    public defaultFeatureType: string;
    public defaultLegendProperty: string;
    public dynamicResource: boolean;
    public tags: string[];
    public isDynamic: boolean;
    public features: Feature[] = [];
    public hasSensorData: boolean;
}

/**
 * Geojson ProjectId definition
 */
export class ProjectId {
    public id: string;
}

/**
 * Geojson geometry definition
 */
export class Geometry {
    public type: string;
    public coordinates: any; //number[]| number[][]| number[][][];
}

/**
 * Geojson feature definition
 */
export class Feature {
    public type: string = 'Feature';
    public id: string;
    public geometry: Geometry;
    public properties: { [key: string]: any };
    public logs: { [key: string]: Log[] };
    public coordinates: any[];          // used for temporal data
    public sensors: { [key: string]: any[] };
    public timestamps: number[];
}

/**
 * Geojson IProperty definition
 */
export interface IProperty {
    [key: string]: any;
}

/**
 * Geojson property definition
 */
export class Property implements IProperty {
    [key: string]: any
}

export class Log {
    public ts: number;
    public prop: string;
    public value: any;
}

export class FeatureType {

}

export class PropertyType {

}

export class ResourceFile implements StorageObject {
    _localFile: string;
    featureTypes: { [key: string]: FeatureType };
    propertyTypeData: { [key: string]: PropertyType };
    id: string;
    title: string;
    storage: string;
}

/**
 * ApiManager, the main csWeb router that receives and sends layer/feature/keys updates around using
 * connectors and keeps all endpoints in sync.
 *
 * EMITS ApiEvents, which all return an IChangedEvent.
 * KeyChanged event when a key is changed (CRUD).
 * PropertyChanged event when a layer is changed (CRUD).
 * FeatureChanged event when a feature is changed (CRUD).
 * LayerChanged event when a layer is changed (CRUD).
 * ProjectChanged event when a project is changed (CRUD).
 * FeaturesChanged event when an array of features is changed (CRUD).
 */
export class ApiManager extends events.EventEmitter {
    /**
     * Dictionary of connectors (e.g. storage, interface, etc.)
     */
    public connectors: { [key: string]: IConnector } = {};

    /**
     * Dictionary of resources
     */
    public resources: { [key: string]: ResourceFile } = {};

    /**
     * Dictionary of layers (doesn't contain actual data)
     */
    public layers: { [key: string]: ILayer } = {};

    /**
     * Dictionary of projects (doesn't contain actual data)
     */
    public projects: { [key: string]: Project } = {};

    /**
     * Dictionary of sensor sets
     */
    public keys: { [keyId: string]: Key } = {};

    public keySubscriptions: { [id: string]: ApiKeySubscription } = {};

    public defaultStorage = 'file';
    public defaultLogging = false;
    public rootPath = '';
    // public resourceFolder = '/data/resourceTypes';
    public projectsFile = '';
    public layersFile = '';
    /** The namespace is used for creating channels/layers/keys namespaces */
    public namespace: string = 'cs';
    /** The name is used to identify this instance, and should be unique in the federation */
    public name: string = 'cs';
    public authService: AuthApi.AuthAPI;

    /** Create a new client, optionally specifying whether it should act as client. */
    constructor(namespace: string, name: string, public isClient = false, public options = <IApiManagerOptions>{}) {
        super();
        this.setMaxListeners(25);
        this.namespace = namespace;
        this.name = name;
        if (this.options.server) {
            // If we do not specify the protocal, add it
            if (this.options.server.indexOf('http') < 0) {
                this.options.server = 'http://' + this.options.server;
            }
            // If we specify the trailing slash, remove it
            if (this.options.server.slice(-1) === '/') {
                this.options.server = this.options.server.slice(0, -1);
            }
        }
    }

    public init(rootPath: string, callback: Function) {
        Winston.info(`Init layer manager (isClient=${this.isClient})`, { cat: 'api' });
        this.rootPath = rootPath;
        if (!fs.existsSync(rootPath)) {
            fs.mkdirSync(rootPath);
        }
        //this.initResources(path.join(this.rootPath, '/resourceTypes/'));
        this.loadLayerConfig(() => {
            this.loadProjectConfig(() => {
                callback();
            });
        });
    }

    /** Sends a message (json) to a specific project, only works with socket io for now */
    public sendClientMessage(project: string, message: Object) {
        if (this.connectors.hasOwnProperty('socketio')) {
            var c = <socketio.SocketIOAPI>this.connectors['socketio'];
            c.sendClientMessage(project, message);
        }


    }

    /** Open layer config file*/
    public loadLayerConfig(cb: Function) {

        Winston.debug('manager: loading layer config');
        this.layersFile = path.join(this.rootPath, 'layers.json');

        fs.stat(this.layersFile, (err, stats) => {
            // Create file if it doesn't exist
            if (err && err.code === 'ENOENT') {
                fs.writeFileSync(this.layersFile, '{}');
                Winston.info(`Create layers.json file ${this.layersFile}`);
            }
            fs.readFile(this.layersFile, 'utf8', (err, data) => {
                if (err) {
                    Winston.error('manager: layers config loading failed: ' + err.message);
                } else {
                    try {
                        this.layers = <{ [key: string]: ILayer }>JSON.parse(data);
                        Winston.info('manager: layers config loaded');
                    } catch (e) {
                        Winston.error('manager: error loading layers config');
                    }
                }
                cb();
            });
        });
    }

    /**
     * Open project config file
     */
    public loadProjectConfig(cb: Function) {
        Winston.debug('manager: loading project config');
        this.projectsFile = path.join(this.rootPath, 'projects.json');

        fs.stat(this.projectsFile, (err, stats) => {
            // Create file if it doesn't exist            
            if (err && err.code === 'ENOENT') {
                fs.writeFileSync(this.projectsFile, '{}');
                Winston.info(`Create projects.json file ${this.projectsFile}`);
            }
            fs.readFile(this.projectsFile, 'utf8', (err, data) => {
                if (err) {
                    Winston.error('manager: project config loading failed: ' + err.message);
                } else {
                    try {
                        this.projects = <{ [key: string]: Project }>JSON.parse(data);
                        Winston.info('manager: project config loaded');
                    } catch (e) {
                        Winston.error('manager: error loading project config');
                    }
                }
                cb();
            });
        });
    }

    /**
     * Have a 1 sec. delay before saving project config
     */
    public saveProjectDelay = _.debounce((project: Project) => {
        this.saveProjectConfig();
    }, 1000);

    /**
     * Have a 1 sec. delay before saving layer config
     */
    public saveLayersDelay = _.debounce((layer: ILayer) => {
        this.saveLayerConfig();
    }, 1000);

    /**
     * Store layer config file
     */
    public saveProjectConfig() {
        fs.writeFile(this.projectsFile, JSON.stringify(this.projects), (error) => {
            if (error) {
                Winston.error('manager: error saving project config: ' + error.message);
            } else {
                Winston.info('manager: project config saved');
            }
        });
    }

    /**
     * Store layer config file
     */
    public saveLayerConfig() {
        var temp = {};
        for (var s in this.layers) {
            if (!this.layers[s].storage) {
                temp[s] = this.layers[s];
            }
        }
        if (!temp) {
            return;
        }
        fs.writeFile(this.layersFile, JSON.stringify(temp), (error) => {
            if (error) {
                Winston.error('manager: error saving layer config');
            } else {
                Winston.info('manager: layer config saved');
            }
        });
    }

    /**
     * Look for available resources (from folder)
     */
    public initResources(resourcesPath: string) {
        //TODO implement
        if (!fs.existsSync(resourcesPath)) {
            fs.mkdirSync(resourcesPath);
        }
        fs.readdir(resourcesPath, (e, f) => {
            f.forEach((file) => {
                var loc = path.join(resourcesPath, file);
                fs.readFile(loc, 'utf8', (err, data) => {
                    if (!err) {
                        console.log('Opening ' + loc);
                        if (data.length > 0) {
                            this.resources[file.replace('.json', '').toLowerCase()] = <ResourceFile>JSON.parse(data.removeBOM());
                        }
                    } else {
                        console.log('Error opening ' + loc + ': ' + err);
                    };
                });
            });
        });
    }

    /** Add a file to the store, e.g. an icon or other media. */
    public addFile(base64: string, folder: string, file: string, meta: ApiMeta, callback: Function) {
        var s: IConnector = this.connectors.hasOwnProperty('file') ? this.connectors['file'] : null;
        if (s) {
            s.addFile(base64, folder, file, meta, () => { });
            callback(<CallbackResult>{ result: ApiResult.OK, error: 'Resource added' });
        } else {
            callback(<CallbackResult>{ result: ApiResult.Error, error: 'Failed to add resource.' });
        }
    }

    /**
     * Update/add a resource and save it to file
     */
    public addResource(resource: ResourceFile, replace: boolean, meta: ApiMeta, callback: Function) {
        if (this.resources.hasOwnProperty(resource.id) && !replace) {
            callback(<CallbackResult>{ result: ApiResult.ResourceAlreadyExists, error: 'Resource already exists' });
        }
        else {
            // reuse existing local file location
            if (this.resources.hasOwnProperty(resource.id)) {
                resource._localFile = this.resources[resource.id]._localFile;
            }

            // create new resource definition (without actual content)
            this.resources[resource.id] = <ResourceFile>{ _localFile: resource._localFile, id: resource.id, title: resource.title, storage: resource.storage };

            // don't actually save it, if this method is called from the storage connector it self
            if (resource.storage != meta.source) {
                var s = this.findStorage(resource);
                this.getInterfaces(meta).forEach((i: IConnector) => {
                    i.addResource(resource, meta, () => { });
                });
                // store resource
                if (s) {
                    s.addResource(resource, meta, (r: CallbackResult) => {
                        callback(<CallbackResult>{ result: ApiResult.OK, error: 'Resource added' });
                    });
                } else {
                    callback(<CallbackResult>{ result: ApiResult.OK });
                }
            }
        }
    }

    public getResource(id: string, meta: ApiMeta, callback: Function) {
        if (this.resources.hasOwnProperty(id)) {
            var s = this.findStorage(this.resources[id]);
            if (s) {
                s.getResource(id, meta, (r: CallbackResult) => {
                    callback(r);
                });
            }
            else {
                callback(<CallbackResult>{ result: ApiResult.ResourceNotFound });
            }
        }
        else {
            callback(<CallbackResult>{ result: ApiResult.ResourceNotFound });
        }
    }

    public addLayerToProject(projectId: string, groupId: string, layerId: string, meta: ApiMeta, callback: Function) {
        var p: Project = this.findProject(projectId);
        var l: ILayer = this.findLayer(layerId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        if (!l) { callback(<CallbackResult>{ result: ApiResult.LayerNotFound, error: 'Layer not found' }); return; }
        if (!p.groups) {
            p.groups = [];
        }
        var g;
        p.groups.forEach(pg => {
            if (pg.id === groupId) {
                g = pg;
            }
        });
        if (!g) { callback(<CallbackResult>{ result: ApiResult.GroupNotFound, error: 'Group not found' }); return; }
        if (g.layers.some((pl) => { return (pl.id === l.id); })) {
            Winston.info('Layer already exists. Removing existing layer before adding new one...');
            g.layers = g.layers.filter((gl) => { return (gl.id !== l.id); });
        }
        g.layers.push(l);
        this.updateProject(p, meta, () => {
            Winston.info('api: add layer ' + l.id + ' to group ' + g.id + ' of project ' + p.id);
            callback(<CallbackResult>{ result: ApiResult.OK });
        });
    }

    public removeLayerFromProject(projectId: string, groupId: string, layerId: string, meta: ApiMeta, callback: Function) {
        var p: Project = this.findProject(projectId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        if (!p.groups || !p.groups.some((pg) => { return (pg.id === groupId); })) {
            callback(<CallbackResult>{ result: ApiResult.GroupNotFound, error: 'Group not found' }); return;
        } else {
            var group = p.groups.filter((pg) => { return (pg.id === groupId); })[0];
            if (group.layers.some((pl) => { return (pl.id === layerId); })) {
                group.layers = group.layers.filter((pl) => { return (pl.id !== layerId) });
                this.updateProject(p, meta, () => { });
                Winston.info('api: removed layer ' + layerId + ' from project ' + p.id);
                callback(<CallbackResult>{ result: ApiResult.OK });
            } else {
                callback(<CallbackResult>{ result: ApiResult.LayerNotFound, error: 'Layer not found' }); return;
            }
        }
    }

    public allGroups(projectId: string, meta: ApiMeta, callback: Function) {
        var p: Project = this.findProject(projectId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        if (!p.groups) {
            p.groups = [];
        }
        var groupList: string[] = [];
        p.groups.forEach(pg => {
            if (pg.id) { groupList.push(pg.id); }
        });
        callback(<CallbackResult>{ result: ApiResult.OK, groups: groupList });
    }

    public addGroup(group: Group, projectId: string, meta: ApiMeta, callback: Function) {
        var p: Project = this.findProject(projectId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        if (!p.groups) { p.groups = []; }
        if (!group.id) { group.id = helpers.newGuid(); }
        if (p.groups.some((pg) => { return (group.id === pg.id) })) {
            p.groups.some((pg) => {
                if (group.id === pg.id && group.clusterLevel) {
                    pg['clusterLevel'] = group.clusterLevel;
                }
                if (group.id === pg.id && group.hasOwnProperty('clustering')) {
                    pg['clustering'] = group.clustering;
                }
                return (group.id === pg.id);
            });
            callback(<CallbackResult>{ result: ApiResult.GroupAlreadyExists, error: 'Group exists' }); return;
        } else {
            group = this.getGroupDefinition(group);
            p.groups.push(group);
            this.updateProject(p, meta, () => { });
            callback(<CallbackResult>{ result: ApiResult.OK });
        }
    }

    public updateGroup(projectId: string, groupId: string, newGroup: Group, meta: ApiMeta, callback: Function) {
        var p: Project = this.findProject(projectId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        if (!newGroup || !groupId || !p.groups) { callback(<CallbackResult>{ result: ApiResult.GroupNotFound, error: 'Group Not Found' }); return; }
        if (p.groups.some((pg) => { return (groupId === pg.id); })) {
            p.groups.some((pg) => {
                if (groupId === pg.id) {
                    Object.keys(newGroup).forEach((key) => {
                        pg[key] = newGroup[key];
                    });
                    return true;
                }
                return false;
            });
            this.updateProject(p, meta, () => { });
            callback(<CallbackResult>{ result: ApiResult.OK }); return;
        } else {
            callback(<CallbackResult>{ result: ApiResult.GroupNotFound, error: 'Group Not Found' }); return;
        }
    }

    public removeGroup(groupId: string, projectId: string, meta: ApiMeta, callback: Function) {
        var p: Project = this.findProject(projectId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        if (!p.groups) { p.groups = []; }
        if (!p.groups.some((pg) => { return (groupId === pg.id) })) {
            callback(<CallbackResult>{ result: ApiResult.GroupNotFound, error: 'Group not found' }); return;
        } else {
            var group = p.groups.filter((pg) => { return (groupId === pg.id) })[0];
            group.layers.forEach(pl => {
                this.removeLayerFromProject(projectId, groupId, pl.id, meta, () => { });
            });
            p.groups = p.groups.filter((pg) => { return (pg.id !== groupId) });
            callback(<CallbackResult>{ result: ApiResult.OK });
        }
    }

    public addProject(project: Project, meta: ApiMeta, callback: Function) {
        if (!project.id) {
            project.id = helpers.newGuid();
        }
        Winston.info('api: add project ' + project.id);
        var s = this.findStorage(project);
        project.storage = project.storage || s.id;
        // check if layer already exists
        if (!this.projects.hasOwnProperty(project.id)) {
            this.projects[project.id] = this.getProjectDefinition(project);

            // store project
            var meta = <ApiMeta>{ source: 'rest' };

            this.getInterfaces(meta).forEach((i: IConnector) => {
                i.initProject(this.projects[project.id]);
                i.addProject(this.projects[project.id], meta, () => { });
            });

            s.addProject(this.projects[project.id], meta, (r: CallbackResult) => {
                this.emit(Event[Event.ProjectChanged], <IChangeEvent>{ id: project.id, type: ChangeType.Create, value: project });
                callback(r);
            });

            this.saveProjectDelay(this.projects[project.id]);
        } else {
            callback(<CallbackResult>{ result: ApiResult.ProjectAlreadyExists, project: this.projects[project.id], error: 'Project already exists' });
        }

    }

    /**
     * Add connector to available connectors
     */
    public addConnector(key: string, s: IConnector, options: any, callback: Function = () => { }) {
        // TODO If client, check that only one interface is added (isInterface = true)
        s.id = key;
        this.connectors[key] = s;
        s.init(this, options, () => {
            callback();
        });
    }

    public addConnectors(connectors: { key: string, s: IConnector, options: any }[], callback: Function) {
        connectors.forEach((c) => {
            c.s.id = c.key;
            this.connectors[c.key] = c.s;
        })
        async.eachSeries(connectors, (c, callb) => {
            c.s.init(this, c.options, () => { });
            callb();
        }, () => {
            callback();
        })
    }

    /**
     * Find layer for a specific layerId (can return null)
     */
    public findLayer(layerId: string): ILayer {
        if (this.layers.hasOwnProperty(layerId)) {
            return this.layers[layerId];
        }
        return null;
    }

    /**
     * Find project for a specific projectId (can return null)
     */
    public findProject(projectId: string): Project {
        if (this.projects.hasOwnProperty(projectId)) {
            return this.projects[projectId];
        }
        return null;
    }

    /**
     * Find layer for a specific layerId (can return null)
     */
    public findKey(keyId: string): Key {
        return this.keys.hasOwnProperty(keyId)
            ? this.keys[keyId]
            : null;
    }

    /**
     * find feature in a layer by featureid
     */
    public findFeature(layerId: string, featureId: string, callback: Function) {
        var layer = this.findLayer(layerId);
        var s = this.findStorage(layer);
        s.getFeature(layerId, featureId, {}, (r) => callback(r));
    }

    /**
     * Find storage for a layer
     */
    public findStorage(object: StorageObject): IConnector {
        var storage = (object && object.storage) || this.defaultStorage;
        if (this.connectors.hasOwnProperty(storage)) { return this.connectors[storage]; }
        return null;
    }

    /**
     * Lookup layer and return storage engine for this layer
     */
    public findStorageForLayerId(layerId: string): IConnector {
        var layer = this.findLayer(layerId);
        // Winston.info('Find layer ' + JSON.stringify(layer));
        return this.findStorage(layer);
    }

    /**
     * Lookup Project and return storage engine for this project
     */
    public findStorageForProjectId(projectId: string): IConnector {
        var project = this.findProject(projectId);
        return this.findStorage(project);
    }

    /**
     * Lookup layer and return storage engine for this layer
     */
    public findStorageForKeyId(keyId: string): IConnector {
        var key = this.findKey(keyId);
        return this.findStorage(key);
    }

    /**
     * Make sure the project has an unique project id
     */
    public getProjectId(project: Project): string {
        project.id = project.id.replace(new RegExp(' ', 'g'), '');
        return project.id;
    }

    /**
     * Returns project definition for a project
     */
    public getProjectDefinition(project: Project): Project {
        var p = <Project>{
            id: project.id ? project.id : helpers.newGuid(),
            storage: project.storage ? project.storage : '',
            title: project.title ? project.title : project.id,
            isDynamic: (typeof project.isDynamic !== 'undefined') ? project.isDynamic : true,
            logo: project.logo ? project.logo : 'images/CommonSenseRound.png',
            groups: project.groups ? _.map(project.groups, (g) => { return this.getGroupDefinition(g); }) : [],
            url: project.url ? project.url : '/api/projects/' + project.id,
            _localFile: project._localFile
        };
        return p;
    }

    /**
     * Returns project definition for a project
     */
    public getGroupDefinition(group: Group): Group {
        var g = <Group>{
            id: group.id ? group.id : helpers.newGuid(),
            description: group.description ? group.description : '',
            title: group.title ? group.title : group.id,
            clusterLevel: group.clusterLevel ? group.clusterLevel : 19,
            clustering: group.clustering || false,
            layers: group.layers ? _.map(group.layers, (l) => { return this.getLayerDefinition(l); }) : []
        };
        return g;
    }

    /**
     * Returns layer definition for a layer, this is the layer without the features (mostly used for directory)
     */
    public getLayerDefinition(layer: ILayer): ILayer {
        if (!layer.hasOwnProperty('type')) { layer.type = 'geojson'; }
        var server = this.options.server || '';
        var r = <ILayer>{
            server: server,
            id: layer.id,
            title: layer.title,
            updated: layer.updated,
            enabled: layer.enabled,
            description: layer.description,
            dynamicResource: layer.dynamicResource,
            defaultFeatureType: layer.defaultFeatureType,
            defaultLegendProperty: layer.defaultLegendProperty,
            typeUrl: layer.typeUrl,
            quickRefresh: layer.quickRefresh,
            confirmUpdate: layer.confirmUpdate,
            opacity: layer.opacity ? layer.opacity : 75,
            type: layer.type,
            // We are returning a definition, so remove the data
            features: [],
            data: '',
            storage: layer.storage ? layer.storage : '',
            url: layer.url ? layer.url : (server + '/api/layers/' + layer.id),
            isDynamic: layer.isDynamic ? layer.isDynamic : false
        };
        // Copy additional properties too.
        for (var key in layer) {
            if (layer.hasOwnProperty(key) && !r.hasOwnProperty(key)) { r[key] = layer[key]; }
        }
        return r;
    }

    //layer methods start here, in CRUD order.

    public getProject(projectId: string, meta: ApiMeta, callback: Function) {
        Winston.debug('Looking for storage of project ' + projectId);
        var s = this.findStorageForProjectId(projectId);
        if (s) {
            Winston.debug('Found storage ' + s.id + ' for project ' + projectId);
            s.getProject(projectId, meta, (r: CallbackResult) => { callback(r); });
        } else {
            Winston.warn('Project ' + projectId + ' not found.');
            callback(<CallbackResult>{ result: ApiResult.ProjectNotFound });
        }
    }

    public searchLayers(keyword: string, layerIds: string[], meta: ApiMeta, callback: Function) {
        if (!layerIds || layerIds.length === 0) { layerIds = _.keys(this.layers); }
        var result: Feature[] = [];

        async.each(layerIds, (lId, callback) => {
            var storage = this.findStorageForLayerId(lId);
            if (storage != null) {
                storage.searchLayer(lId, keyword, meta, (r) => {
                    if (r.result === ApiResult.OK) {
                        r.features.forEach(f => result.push(f));
                    }
                    callback();
                });
            }
        }, (error) => {
            if (!error) {
                callback(<CallbackResult>{ result: ApiResult.OK, features: result });
            } else {
                callback(<CallbackResult>{ result: ApiResult.Error });
            }
        });

    }

    public getLayer(layerId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        if (s) {
            s.getLayer(layerId, meta, (r: CallbackResult) => { callback(r); });
        } else {
            Winston.warn('Layer ' + layerId + ' not found.');
            callback(<CallbackResult>{ result: ApiResult.LayerNotFound });
        }
    }

    /** Create a new layer, store it, and return it. */
    public createLayer(layer: ILayer, meta: ApiMeta, callback: (result: CallbackResult) => void) {
        // give it an id if not available
        if (!layer.hasOwnProperty('id')) { layer.id = helpers.newGuid(); }
        // make sure layerid is lowercase
        layer.id = layer.id.toLowerCase();
        // take the id for the title if not available
        if (!layer.hasOwnProperty('title')) { layer.title = layer.id; }
        if (!layer.hasOwnProperty('features')) { layer.features = []; }
        if (!layer.hasOwnProperty('tags')) { layer.tags = []; }
        this.setUpdateLayer(layer, meta);
        Winston.info('api: add layer ' + layer.id);
        // If the layer already exists, overwrite it (we may have received a new description, for example, or a new location)
        let s = this.findStorage(layer);
        // add storage connector if available
        layer.storage = s ? s.id : '';

        // get layer definition (without features)
        this.layers[layer.id] = this.getLayerDefinition(layer);

        this.getInterfaces(meta).forEach((i: IConnector) => {
            i.initLayer(layer);
            //    i.addLayer(layer, meta, () => { });
        });

        // store layer
        if (s && s.id != meta.source) {
            s.addLayer(layer, meta, (r: CallbackResult) => callback(r))
        } else {
            callback(<CallbackResult>{ result: ApiResult.OK });
        }
    }

    public addUpdateLayer(layer: ILayer, meta: ApiMeta, callback: Function) {
        async.series([
            // make sure layer exists
            (cb: Function) => {
                this.createLayer(layer, meta, () => {
                    cb();
                });
            },
            // update layer
            (cb: Function) => {
                this.setUpdateLayer(layer, meta);
                var l = this.getLayerDefinition(layer);
                this.layers[l.id] = l;

                this.getInterfaces(meta).forEach((i: IConnector) => {
                    i.updateLayer(layer, meta, () => { });
                });

                var s = this.findStorage(layer);
                if (s && s.id !== meta.source) {
                    s.updateLayer(layer, meta, (r, CallbackResult) => {
                        Winston.debug('updating layer finished');
                    });
                }
                callback(<CallbackResult>{ result: ApiResult.OK });
                this.emit(Event[Event.LayerChanged], <IChangeEvent>{ id: layer.id, type: ChangeType.Update, value: layer });
                this.saveLayersDelay(layer);
                cb();
            }
        ]);
    }

    // Removes all groups (and thus layers too) from a project
    public clearProject(projectId: string, meta: ApiMeta, callback: Function) {
        var p: Project = this.findProject(projectId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        p.groups = [];
        this.updateProject(p, {}, (result: CallbackResult) => {
            callback(result);
        });
    }

    public updateProjectTitle(projectTitle: string, projectId: string, meta: ApiMeta, callback: Function) {
        // Does not send update to connections and storages, should be done separately!
        var p: Project = this.findProject(projectId);
        if (!p) { callback(<CallbackResult>{ result: ApiResult.ProjectNotFound, error: 'Project not found' }); return; }
        p.title = projectTitle;
        this.projects[projectId] = p;
        callback(<CallbackResult>{ result: ApiResult.OK, error: 'Changed title' });
    }

    public updateProject(project: Project, meta: ApiMeta, callback: Function) {
        async.series([
            // make sure project exists
            (cb: Function) => {
                if (!this.projects.hasOwnProperty(project.id)) {
                    this.addProject(project, meta, () => {
                        cb();
                    });
                } else { cb(); }
            },
            // update project
            (cb: Function) => {
                var file = this.projects[project.id]._localFile;
                if (file && !project._localFile) project._localFile = file;

                var p = this.getProjectDefinition(project);

                this.projects[p.id] = p;


                this.getInterfaces(meta).forEach((i: IConnector) => {
                    i.updateProject(project, meta, () => { });
                });

                var s = this.findStorageForProjectId(project.id);
                if (s) {
                    s.updateProject(project, meta, (r, CallbackResult) => {
                        Winston.warn('updating project finished');
                    });
                }
                callback(<CallbackResult>{ result: ApiResult.OK, project: p });

                this.emit(Event[Event.ProjectChanged], <IChangeEvent>{ id: project.id, type: ChangeType.Update, value: project });
                this.saveProjectDelay(project);
            }
        ])
    }

    public deleteLayer(layerId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteLayer(layerId, meta, (r: CallbackResult) => {
            delete this.layers[layerId];
            this.getInterfaces(meta).forEach((i: IConnector) => {
                i.deleteLayer(layerId, meta, () => { });
            });
            this.emit(Event[Event.LayerChanged], <IChangeEvent>{ id: layerId, type: ChangeType.Delete });
            callback(r);
        });
    }

    public deleteProject(projectId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForProjectId(projectId);
        if (!s) {
            callback(<CallbackResult>{ result: ApiResult.Error, error: 'Project not found.' })
            return;
        }
        s.deleteProject(projectId, meta, (r: CallbackResult) => {
            delete this.projects[projectId];
            this.getInterfaces(meta).forEach((i: IConnector) => {
                i.deleteProject(projectId, meta, () => { });
            });
            this.emit(Event[Event.ProjectChanged], <IChangeEvent>{ id: projectId, type: ChangeType.Delete });
            callback(r);
        });
    }

    public getInterfaces(meta: ApiMeta): IConnector[] {
        var res = [];
        for (var i in this.connectors) {
            if (this.connectors[i].isInterface && (this.connectors[i].receiveCopy || meta.source !== i)) { res.push(this.connectors[i]); }
        }
        return res;
    }

    private setUpdateLayer(layer: ILayer, meta: ApiMeta) {
        layer.updated = new Date().getTime();
    }

    // Feature methods start here, in CRUD order.

    public addFeature(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {
        Winston.debug('feature added');
        var layer = this.findLayer(layerId);
        if (!layer) {
            callback(<CallbackResult>{ result: ApiResult.Error, error: 'layer not found' });
        }
        else {
            this.setUpdateLayer(layer, meta);
            var s = this.findStorage(layer);
            if (s) s.addFeature(layerId, feature, meta, (result) => {
                this.getInterfaces(meta).forEach((i: IConnector) => {
                    i.addFeature(layerId, feature, meta, () => { });
                });
                this.emit(Event[Event.FeatureChanged], <IChangeEvent>{ id: layerId, type: ChangeType.Create, value: feature });
                callback(<CallbackResult>{ result: ApiResult.OK });
            });
        }
    }

    public updateProperty(layerId: string, featureId: string, property: string, value: any, useLog: boolean, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        this.setUpdateLayer(layer, meta);
        var s = this.findStorage(layer);
        this.updateProperty(layerId, featureId, property, value, useLog, meta, (r) => callback(r));
        this.emit(Event[Event.PropertyChanged], <IChangeEvent>{ id: layerId, type: ChangeType.Update, value: { featureId: featureId, property: property } });
    }

    public updateLogs(layerId: string, featureId: string, logs: { [key: string]: Log[] }, meta: ApiMeta, callback: Function) {
        var layer = this.findLayer(layerId);
        this.setUpdateLayer(layer, meta);
        var s = this.findStorage(layer);
        // check if timestamps are set (if not, do it)
        for (var p in logs) {
            logs[p].forEach((l: Log) => {
                if (!l.ts) l.ts = new Date().getTime();
            });
        }
        s.updateLogs(layerId, featureId, logs, meta, (r) => callback(r));
        this.getInterfaces(meta).forEach((i: IConnector) => {
            i.updateLogs(layerId, featureId, logs, meta, () => { });
        });
    }

    public getFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getFeature(layerId, featureId, meta, (result) => callback(result));
    }

    public updateFeature(layerId: string, feature: any, meta: ApiMeta, callback: Function) {
        Winston.info(`ApiManger.updateFeature: Saving feature with id ${feature.id} to layer ${layerId}.`);
        var s = this.findStorageForLayerId(layerId);
        if (s) {
            s.updateFeature(layerId, feature, true, meta, (result) => callback(result));
        } else {
            Winston.error(`ApiManger.updateFeature: Error saving feature with id ${feature.id} to layer ${layerId}.`);
        }
        this.getInterfaces(meta).forEach((i: IConnector) => {
            i.updateFeature(layerId, feature, false, meta, () => { });
        });
        this.emit(Event[Event.FeatureChanged], <IChangeEvent>{ id: layerId, type: ChangeType.Update, value: feature });
    }

    /** Similar to updateFeature, but with an array of updated features instead of one feature.
     *
     */
    public addUpdateFeatureBatch(layerId: string, features: IChangeEvent[], meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        if (s) s.addUpdateFeatureBatch(layerId, features, true, meta, (result) => callback(result));
        this.getInterfaces(meta).forEach((i: IConnector) => {
            i.addUpdateFeatureBatch(layerId, features, false, meta, () => { });
        });
        this.emit(Event[Event.FeaturesChanged], <IChangeEvent>{ id: layerId, type: ChangeType.Update, value: features });
    }

    public deleteFeature(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        if (s) s.deleteFeature(layerId, featureId, meta, (result) => {
            this.getInterfaces(meta).forEach((i: IConnector) => {
                i.deleteFeature(layerId, featureId, meta, () => { });
            });
            this.emit(Event[Event.FeatureChanged], <IChangeEvent>{ id: layerId, type: ChangeType.Delete, value: featureId });
            callback(result);
        });
    }


    //log stuff (new: 26/7)

    public addLog(layerId: string, featureId: string, property: string, log: Log, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.addLog(layerId, featureId, property, log, meta, (result) => callback(result));
    }

    public initLayer(layer: Layer) {

    }

    public initProject(project: Project) {

    }

    public getLog(layerId: string, featureId: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getLog(layerId, featureId, meta, (result) => callback(result));
    }

    public deleteLog(layerId: string, featureId: string, ts: number, prop: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.deleteLog(layerId, featureId, ts, prop, meta, (result) => callback(result));
    }

    //geospatial queries (thus only supported for mongo)

    public getBBox(layerId: string, southWest: number[], northEast: number[], meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getBBox(layerId, southWest, northEast, meta, (result) => callback(result));
    }

    public getSphere(layerId: string, maxDistance: number, lng: number, lat: number, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getSphere(layerId, maxDistance, lng, lat, meta, (result) => callback(result));
    }
    public getWithinPolygon(layerId: string, feature: Feature, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForLayerId(layerId);
        s.getWithinPolygon(layerId, feature, meta, (result) => callback(result));
    }

    public subscribeKey(pattern: string, meta: ApiMeta, callback: (topic: string, message: string, params?: Object) => void): ApiKeySubscription {
        Winston.debug('api: added key subscription with pattern ' + pattern);
        var sub = new ApiKeySubscription();
        sub.id = helpers.newGuid();
        sub.pattern = pattern;
        sub.regexPattern = new RegExp(pattern.replace(/\//g, '\\/').replace(/\./g, '\\.'));
        sub.callback = callback;
        this.keySubscriptions[sub.id] = sub;
        return sub;
        // this.getInterfaces(meta).forEach((i: IConnector) => {
        //     i.subscribeKey(pattern, meta, callback);
        // });
    }

    public addKey(key: Key, meta: ApiMeta, callback: Function) {
        Winston.debug('add key ' + key.id);
        var k = JSON.parse(JSON.stringify(key));
        delete k.values;
        this.keys[key.id] = k;
    }

    public getKeys(meta: ApiMeta, callback: Function) {
        // check subscriptions
        callback(<CallbackResult>{ result: ApiResult.OK, keys: this.keys });
    }

    public getKey(id: string, meta: ApiMeta, callback: Function) {
        var s = this.findStorageForKeyId(id);
        if (s) s.getKey(id, meta, (r: CallbackResult) => {
            callback(r);
        })
        else { callback(<CallbackResult>{ result: ApiResult.KeyNotFound }); }
    }

    public updateKey(keyId: string, value: Object, meta?: ApiMeta, callback?: Function) {
        if (!meta) meta = <ApiMeta>{};
        if (!callback) callback = () => { };

        // Winston.info('updatekey: received ' + keyId);
        // check if keys exists
        var key = this.findKey(keyId);
        if (!key) {
            var k = <Key>{ id: keyId, title: keyId, storage: 'file' };
            this.addKey(k, meta, () => { });
        }

        if (typeof value === 'object' && !value.hasOwnProperty('time')) value['time'] = new Date().getTime();
        var s = this.findStorageForKeyId(keyId);
        if (s) s.updateKey(keyId, value, meta, () => callback());

        for (var subId in this.keySubscriptions) {
            var sub = this.keySubscriptions[subId];
            if (sub.regexPattern.test(keyId)) {
                //Winston.info(`   pattern ${sub.pattern} found.`);
                sub.callback(keyId, value, meta);
            }
        }

        this.getInterfaces(meta).forEach((i: IConnector) => {
            i.updateKey(keyId, value, meta, () => { });
        });

        // Emit key changed events so others can subscribe to it.
        this.emit(Event[Event.KeyChanged], <IChangeEvent>{ id: keyId, type: ChangeType.Update, value: value });

        // check subscriptions
        callback(<CallbackResult>{ result: ApiResult.OK })
    }

    /**
     * Register a callback which is being called before the process exits.
     * @method cleanup
     * @param  {Function} callback Callback function that performs the cleanup
     * See also: http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
     */
    public cleanup(callback?: Function) {
        // attach user callback to the process event emitter
        // if no callback, it will still exit gracefully on Ctrl-C
        if (!callback) callback = () => { };
        process.on('cleanup', callback);

        // do app specific cleaning before exiting
        process.on('exit', function () {
            process.emit('cleanup');
        });

        // catch ctrl+c event and exit normally
        process.on('SIGINT', function () {
            console.log('Ctrl-C...');
            process.exit(2);
        });

        //catch uncaught exceptions, trace, then exit normally
        process.on('uncaughtException', function (e) {
            console.log('Uncaught Exception...');
            console.log(e.stack);
            process.exit(99);
        });
    };
}
