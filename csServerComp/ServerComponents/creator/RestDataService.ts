import express = require('express')
import cors = require('cors')
import Winston = require('winston');
import request = require('request');
import moment = require('moment');
import path = require('path');
import fs = require('fs-extra');
import _ = require('underscore');
import GeoJSONHelper = require('../helpers/GeoJSON');
import Api = require('../api/ApiManager');
import Utils = require('../helpers/Utils');

export interface IRestDataSourceSettings {
    /** File that contains functions obtain and parse the desired data (e.g. ./crowdtasker) */
    converterFile: string;
    /** Base url where the data should be obtained from (e.g. http://www.mydatasource.com/endpoint) */
    url: string;
    /** Parameters to include in the url (e.g. {api_key:"value"} adds to the url: ?api_key=value) */
    urlParams?: { [key: string]: any };
    /** Time interval in seconds to check for updates */
    pollIntervalSeconds?: number;
    /** Time period in seconds to keep objects that are not in the obtained data anymore. This is useful when a connection to
     *  a feature may be lost for short periods, but the feature should remain visible on the map.
     */
    pruneIntervalSeconds?: number;
    /** Whether the geometry of features should be ignored when feature diffs are calculated. (default: false) */
    diffIgnoreGeometry?: boolean;
    /** Properties that should be ignored when calculating feature diffs (can be overridden by whitelist) */
    diffPropertiesBlacklist?: string[];
    /** Properties that should be used for calculating feature diffs (takes precendence of blacklist) */
    diffPropertiesWhitelist?: string[];
    /** Date property */
    dateProperty?: string;
    /** Time property */
    timeProperty?: string;
    /** Date format */
    dateFormat?: string;
    /** Time format */
    timeFormat?: string;
    /** Ignore aged features */
    maxFeatureAgeMinutes?: number;
    /** When filename is given, the retrieved data will be written to that file. Otherwise, logging is disabled */
    logFile?: string;
}

export interface IConverter {
    getData: Function;
}

interface IFeatureUpdate {
    f: GeoJSONHelper.IFeature;
    updated: number;
}

/** REST datasource
 *  Provides an endpoint for obtaining features from a REST source. The features can be provided in many forms, 
 *  as they will be converted by a specific converter-JavaScript file. The converter takes care of the conversion
 *  from the format used by the REST source to GeoJSON. 
 *  Furthermore the datasource will request the GeoJSON features on a certain interval. Only the features that have
 *  been updated in the interval period will be pushed to the client. Next to the polling interval, a prune period 
 *  can be configured. When features have not been updated within the prune period, they will be deleted. 
 */
export class RestDataSource {
    /** Dictionary of feature id's and information regarding the features and feature0updates */
    private features: { [id: string]: IFeatureUpdate };
    /** Features that should be added on the client */
    private featuresUpdates: Api.IChangeEvent[] = [];
    private restDataSourceUrl: string;
    private converter: IConverter;
    private restDataSourceOpts: IRestDataSourceSettings = <IRestDataSourceSettings>{};
    private counter: number;
    private enableLogging: boolean = false;

    constructor(public server: express.Express, private apiManager: Api.ApiManager, public layerId: string, public url: string = '/restdatasource') {
        this.restDataSourceUrl = url;
        this.layerId = layerId;
    }

    public init(options: IRestDataSourceSettings, callback: Function) {
        if (!options || !options.converterFile) {
            callback('Rest datasource not started: No converterfile provided.');
            return;
        }
        Winston.info('Init Rest datasource on port ' + this.server.get('port') + '. Base path is ' + this.url);
        this.counter = 1;

        this.restDataSourceOpts.converterFile = options.converterFile;
        this.restDataSourceOpts.url = options.url;
        this.restDataSourceOpts.urlParams = options.urlParams || {};
        this.restDataSourceOpts.pollIntervalSeconds = options.pollIntervalSeconds || 60;
        this.restDataSourceOpts.pruneIntervalSeconds = options.pruneIntervalSeconds || 300;
        this.restDataSourceOpts.diffIgnoreGeometry = (options.hasOwnProperty('diffIgnoreGeometry')) ? false : options['diffIgnoreGeometry'];
        this.restDataSourceOpts.diffPropertiesBlacklist = options.diffPropertiesBlacklist || [];
        this.restDataSourceOpts.diffPropertiesWhitelist = options.diffPropertiesWhitelist || [];
        this.restDataSourceOpts.dateProperty = options.dateProperty || '';
        this.restDataSourceOpts.timeProperty = options.timeProperty || '';
        this.restDataSourceOpts.dateFormat = options.dateFormat || '';
        this.restDataSourceOpts.timeFormat = options.timeFormat || '';
        this.restDataSourceOpts.maxFeatureAgeMinutes = options.maxFeatureAgeMinutes || Number.MAX_VALUE;
        this.restDataSourceOpts.logFile = options.logFile || null;
        
        if (this.restDataSourceOpts.diffPropertiesBlacklist.length > 0 && this.restDataSourceOpts.diffPropertiesWhitelist.length > 0) {
            Winston.info('Both whitelist and blacklist properties provided, ignoring the blacklist.');
            this.restDataSourceOpts.diffPropertiesBlacklist.length = 0;
        }

        if (!fs.existsSync(this.restDataSourceOpts.converterFile)) {
            callback(`Provided converterfile not found. (${this.restDataSourceOpts.converterFile})`);
            return;
        }

        this.converter = require(this.restDataSourceOpts.converterFile);
        if (!this.isConverterValid()) {
            callback(`Provided converterfile not valid. (${path.basename(this.restDataSourceOpts.converterFile)})`);
            return;
        }
        
        if (!!this.restDataSourceOpts.logFile) {
            fs.createFile(this.restDataSourceOpts.logFile, (err) => {
                if (!err) {
                    Winston.info('Log Rest data to ' + this.restDataSourceOpts.logFile);
                    this.enableLogging = true;
                } else {
                    Winston.warn('Error creating log ' + this.restDataSourceOpts.logFile);
                    this.enableLogging = false;               
                }
            });
        }

        var urlDataParams = this.restDataSourceOpts.urlParams;
        urlDataParams['url'] = this.restDataSourceOpts.url;
        this.startRestPolling(urlDataParams);

        this.server.get(this.restDataSourceUrl, (req: express.Request, res: express.Response) => {
            Winston.info('Restdatasource got request');
            var layerDef = req.body;
            if (!layerDef || !this.converter || !this.features) {
                res.sendStatus(404);
                return;
            }
            layerDef.features = _.map(this.features, (val, key) => { return val.f; });
            res.send(layerDef);
        });

        callback('Loaded successfully!');
    }

    private startRestPolling(dataParameters) {
        dataParameters['counter'] = this.counter++;
        this.converter.getData(request, dataParameters, {apiManager: this.apiManager, fs: fs}, (result) => {
            Winston.info('RestDataSource received ' + result.length || 0 + ' features');
            var featureCollection = GeoJSONHelper.GeoJSONFactory.Create(result);
            this.filterOldEntries(featureCollection);
            if (!this.features || Object.keys(this.features).length === 0) {
                this.initFeatures(featureCollection, Date.now());
            } else {
                this.findFeatureDiff(featureCollection, Date.now());
            }
            if (this.enableLogging) {
                var toWrite = 'Time: ' + (new Date()).toISOString() + '\n';
                toWrite += JSON.stringify(result, null, 2) + '\n';
                fs.appendFile(this.restDataSourceOpts.logFile, toWrite, 'utf8', (err) => {
                    if (!err) {
                        Winston.debug('Logged REST datasource result');
                    } else {
                        Winston.warn('Error while logging REST datasource result: ' + err);                        
                    }
                });
            }
        });
        setTimeout(() => { this.startRestPolling(dataParameters) }, this.restDataSourceOpts.pollIntervalSeconds * 1000);
    }
    
    private filterOldEntries(fcoll) {
        if (!fcoll || !fcoll.features || fcoll.features.length === 0) return;
        console.log("Before filtering: " + fcoll.features.length);
        var dProp = this.restDataSourceOpts.dateProperty;
        var tProp = this.restDataSourceOpts.timeProperty;
        var dFormat = this.restDataSourceOpts.dateFormat;
        var tFormat = this.restDataSourceOpts.timeFormat;
        var age = this.restDataSourceOpts.maxFeatureAgeMinutes;
        fcoll.features = fcoll.features.filter((f: IFeature) => {
            if (f.properties.hasOwnProperty(dProp) && f.properties.hasOwnProperty(dProp)) {
                var time = f.properties[tProp].toString();
                if (time.length === 5) time = '0' + time;
                var propDate = moment(''.concat(f.properties[dProp],time), ''.concat(dFormat,tFormat));
                var now = moment();
                if (Math.abs(now.diff(propDate, 'minutes', true)) > age) {
                    // console.log("Remove feature: " + propDate.toISOString());
                    return false;
                } else {
                    f.properties['ParsedDate'] = propDate.toDate().getTime();
                }
            }
            return true;
        });
        console.log("After filtering: " + fcoll.features.length);
    }

    private initFeatures(fCollection: GeoJSONHelper.IGeoJson, updateTime: number) {
        if (!fCollection || !fCollection.features) return;
        if (!this.features) this.features = {};
        if (_.isArray(fCollection.features)) {
            fCollection.features.forEach((f: GeoJSONHelper.IFeature, ind) => {
                this.features[f.id] = { f: f, updated: updateTime };
                if (ind === fCollection.features.length - 1) {
                    Winston.info('RestDataSource initialized ' + fCollection.features.length + ' features.');
                }
            });
        }
    }

    private findFeatureDiff(fCollection: GeoJSONHelper.IGeoJson, updateTime: number) {
        if (!fCollection || !fCollection.features) return;
        this.featuresUpdates.length = 0;
        let notUpdated = 0, updated = 0, added = 0, removed = 0;
        let fts = fCollection.features;
        let fCollectionIds = [];
        if (_.isArray(fts)) {
            fts.forEach((f: IFeature) => {
                fCollectionIds.push(f.id);
                if (!this.features.hasOwnProperty(f.id)) {
                    // ADD FEATURE
                    this.features[f.id] = { f: f, updated: updateTime };
                    this.featuresUpdates.push(<Api.IChangeEvent>{ value: f, type: Api.ChangeType.Create, id: f.id });
                    added += 1;
                } else if (!this.isFeatureUpdated(<IFeature>f)) {
                    // NO UPDATE
                    notUpdated += 1;
                } else {
                    // UPDATE
                    this.features[f.id] = { f: f, updated: updateTime };
                    this.featuresUpdates.push(<Api.IChangeEvent>{ value: f, type: Api.ChangeType.Update, id: f.id });
                    updated += 1;
                }
            });
        }
        // CHECK INACTIVE FEATURES
        let inactiveFeatures = _.difference(Object.keys(this.features), fCollectionIds);
        if (inactiveFeatures && inactiveFeatures.length > 0) {
            inactiveFeatures.forEach((fId) => {
                if ((updateTime - this.features[fId].updated) >= (this.restDataSourceOpts.pruneIntervalSeconds * 1000)) {
                    // REMOVE
                    this.featuresUpdates.push(<Api.IChangeEvent>{ value: this.features[fId].f, type: Api.ChangeType.Delete, id: this.features[fId].f.id });
                    delete this.features[this.features[fId].f.id];
                    removed += 1;
                }
            });
        }
        this.apiManager.addUpdateFeatureBatch(this.layerId, this.featuresUpdates, {}, (r) => { });
        Winston.info(`Feature diff complete. ${updated} updated \t${added} added \t${notUpdated} not updated \t${removed} removed. (${this.counter})`);
    }

    private isFeatureUpdated(f: IFeature): boolean {
        if (!f) return false;
        // Check geometry
        if (!this.restDataSourceOpts.diffIgnoreGeometry && !_.isEqual(f.geometry, this.features[f.id].f.geometry)) {
            return true;
        }
        if (!f.properties) return false;
        // Check for blacklisted properties
        if (this.restDataSourceOpts.diffPropertiesBlacklist.length > 0) {
            let blacklist = this.restDataSourceOpts.diffPropertiesBlacklist;
            if (_.isEqual(_.omit(f.properties, blacklist), _.omit(this.features[f.id].f.properties, blacklist))) {
                return false;
            }
        }
        // Check for whitelisted properties
        if (this.restDataSourceOpts.diffPropertiesWhitelist.length > 0) {
            let whitelist = this.restDataSourceOpts.diffPropertiesWhitelist;
            if (_.isEqual(_.pick(f.properties, whitelist), _.pick(this.features[f.id].f.properties, whitelist))) {
                return false;
            }
        }
        // Check all properties
        if (_.isEqual(f.properties, this.features[f.id].f.properties)) {
            return false;
        }
        return true;
    }

    private isConverterValid(): boolean {
        let valid: boolean = true;
        Winston.info(`${Object.keys(this.converter)}`)
        valid = (this.converter.getData && typeof this.converter.getData === 'function');
        return valid;
    }
}
