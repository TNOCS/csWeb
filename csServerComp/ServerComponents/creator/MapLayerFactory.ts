import fs = require('fs');
import http = require('http');
import express = require('express');
import request = require('request');
import pg = require('pg');
import proj4 = require('proj4');
import MessageBus = require('../bus/MessageBus');
import ConfigurationService = require('../configuration/ConfigurationService');
import Location = require('../database/Location');
import BagDatabase = require('../database/BagDatabase');
import IAddressSource = require('../database/IAddressSource');
import LocalBag = require('../database/LocalBag');
import IBagOptions = require('../database/IBagOptions');
import IGeoJsonFeature = require('./IGeoJsonFeature');
import Api = require('../api/ApiManager');
import Utils = require('../helpers/Utils');
import async = require('async');
import winston = require('winston');
import path = require('path');
import _ = require('underscore');
import IProperty = Api.IProperty;

export interface ILayerDefinition {
    projectTitle: string;
    reference: string;
    group: string;
    layerTitle: string;
    description: string;
    featureType: string;
    geometryType: string;
    parameter1: string;
    parameter2: string;
    parameter3: string;
    parameter4: string;
    iconUri: string;
    iconSize: number;
    drawingMode: string;
    fillColor: string;
    strokeColor: string;
    selectedStrokeColor: string;
    strokeWidth: number;
    isEnabled: boolean;
    clusterLevel: number;
    useClustering: boolean;
    opacity: number;
    nameLabel: string;
    includeOriginalProperties: boolean;
    defaultFeatureType: string;
    geometryFile: string;
    geometryKey: string;
}

export interface IPropertyType {
    label?: string;
    title?: string;
    description?: string;
    type?: string;
    section?: string;
    stringFormat?: string;
    visibleInCallOut?: boolean;
    canEdit?: boolean;
    filterType?: string;
    isSearchable?: boolean;
    minValue?: number;
    maxValue?: number;
    defaultValue?: number;
    count?: number;
    calculation?: string;
    subject?: string;
    target?: string;
    targetlayers?: string[];
    targetproperty?: string;
    options?: string[];
    activation?: string;
    targetid?: string;
}

export interface ILayerTemplate {
    layerDefinition: ILayerDefinition[];
    propertyTypes: IPropertyType[];
    properties: IProperty[];
    sensors?: IProperty[];
    projectId?: string;
    projectLogo?: string;
    iconBase64?: string;
    logoBase64?: string;
}

export interface IBagContourRequest {
    bounds?: string;
    searchProp?: string;
    layer: any;
}

export interface IBagSearchRequest {
    query: string;
    nrItems: number;
}

/** A factory class to create new map layers based on input, e.g. from Excel */
export class MapLayerFactory {
    templateFiles: IProperty[];
    featuresNotFound: any;
    apiManager: Api.ApiManager;

    // constructor(private bag: LocalBag, private messageBus: MessageBus.MessageBusService) {
constructor(private addressSources: IAddressSource.IAddressSource[], private messageBus: MessageBus.MessageBusService, apiManager: Api.ApiManager, private workingDir: string = '') {
        addressSources.slice().reverse().forEach((src, ind, arr) => {
            if (src == null) {
                addressSources.splice(arr.length - 1 - ind, 1);
                console.warn('Removed unknown address source');
            } else {
                src.init();
                console.log('Init address source ' + src.name);
            }
        });
        var fileList: IProperty[] = [];
        var templateFolder: string = path.join(workingDir, 'public', 'data', 'templates');
        fs.access(templateFolder, fs.F_OK, (err) => {
            if (err) {
                console.log(`Template-folder "${templateFolder}" not found`);
            } else {
                fs.readdir(templateFolder, function (err, files) {
                    if (err) {
                        console.log('Error while looking for templates in ' + templateFolder);
                    } else {
                        files.forEach((f) => {
                            fileList[f.replace(/\.[^/.]+$/, '')] = path.join(templateFolder, f); // Filter extension from key and store in dictionary
                        });
                        console.log(`Loaded ${files.length} templates from ${templateFolder}.`);
                    }
                });
            }
        });
        this.templateFiles = fileList;
        this.featuresNotFound = {};
        this.apiManager = apiManager;
    }

    public process(req: express.Request, res: express.Response) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('');
        console.log('Received project template. Processing...');
        this.featuresNotFound = {};
        var template: ILayerTemplate = req.body;
        var ld = template.layerDefinition[0];
        this.createMapLayer(template, (geojson) => {

            //if (!fs.existsSync("public/data/projects/DynamicExample")) fs.mkdirSync("public/data/projects/DynamicExample");
            //if (!fs.existsSync("public/data/projects/DynamicExample/" + ld.group)) fs.mkdirSync("public/data/projects/DynamicExample/" + ld.group);
            //fs.writeFileSync("public/data/projects/DynamicExample/" + ld.group + "/" + ld.layerTitle + ".json", JSON.stringify(geojson));

            if (!template.projectId) {
                console.warn('Error: No project ID found in the template');
                return;
            }
            if (!ld.reference) {
                console.warn('Error: No layer reference found in the template');
                return;
            }
            var layerId = template.projectId + ld.reference.toLowerCase();
            var data = {
                project: ld.projectTitle,
                projectId: template.projectId,
                projectLogo: template.projectLogo || 'CommonSenseRound.png',
                layerTitle: ld.layerTitle,
                description: ld.description,
                reference: layerId,
                featureType: Object.keys(geojson.featureTypes)[0] || 'Default',
                opacity: ld.opacity,
                clusterLevel: ld.clusterLevel,
                clustering: ld.useClustering,
                group: ld.group,
                geojson: geojson,
                enabled: ld.isEnabled,
                iconBase64: template.iconBase64,
                logoBase64: template.logoBase64,
                geometryFile: ld.geometryFile,
                geometryKey: ld.geometryKey
            };
            if (Object.keys(this.featuresNotFound).length !== 0) {
                console.log('Adresses that could not be found are:');
                console.log('-------------------------------------');
                for (var key in this.featuresNotFound) {
                    if (this.featuresNotFound.hasOwnProperty(key)) {
                        console.log(this.featuresNotFound[key].zip + ' ' + this.featuresNotFound[key].number);
                    }
                }
                console.log('-------------------------------------');
            }

            console.log('New map created: publishing...');
            this.messageBus.publish('dynamic_project_layer', 'created', data);
            var combinedjson = this.splitJson(data);
            this.sendIconThroughApiManager(data.iconBase64, data.projectId, path.basename(ld.iconUri));
            this.sendIconThroughApiManager(data.logoBase64, data.projectId, path.basename(data.projectLogo));
            this.sendResourceThroughApiManager(combinedjson.resourcejson, data.reference); //For now set layerID = resourceID
            this.sendLayerThroughApiManager(data);
        });
    }

    private splitJson(data) {
        var geojson = {},
            resourcejson: any = {};
        var combinedjson = data.geojson;
        if (combinedjson.hasOwnProperty('type') && combinedjson.hasOwnProperty('features')) {
            geojson = {
                type: combinedjson.type,
                features: combinedjson.features
            };
        }
        if (combinedjson.hasOwnProperty('timestamps')) {
            geojson['timestamps'] = combinedjson['timestamps'];
        }
        if (combinedjson.hasOwnProperty('featureTypes')) {
            for (var ftName in combinedjson.featureTypes) {
                if (combinedjson.featureTypes.hasOwnProperty(ftName)) {
                    var defaultFeatureType = combinedjson.featureTypes[ftName];
                    defaultFeatureType['contourProperty'] = '_bag_contour';
                    if (defaultFeatureType.hasOwnProperty('propertyTypeData')) {
                        var propertyTypeObjects = {};
                        var propKeys: string = '';
                        defaultFeatureType.propertyTypeData.forEach((pt) => {
                            propertyTypeObjects[pt.label] = pt;
                            propKeys = propKeys + pt.label + ';';
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
        // console.log('TODO REMOVE writing output');
        // fs.writeFileSync('c:/Users/Erik/Downloads/tkb/' + data.reference + '_layer.json', JSON.stringify(geojson));
        // fs.writeFileSync('c:/Users/Erik/Downloads/tkb/' + data.reference + '.json', JSON.stringify(resourcejson));
        return { geojson: geojson, resourcejson: resourcejson };
    }

    public sendIconThroughApiManager(b64: string, folder: string, filePath: string) {
        if (!b64 || !filePath) return;
        this.apiManager.addFile(b64, folder, filePath, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
            console.log(result);
        });
    }

    public sendResourceThroughApiManager(data: any, resourceId: string) {
        data.id = resourceId;
        this.apiManager.addResource(data, true, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => { console.log(result); });
    }

    public sendLayerThroughApiManager(data: any) {
        // winston.info('Send layer: ' + JSON.stringify(data));
        var layer: Api.ILayer = this.apiManager.getLayerDefinition(
            <Api.Layer>{
                title: data.layerTitle,
                description: data.description,
                id: data.reference,
                enabled: data.enabled,
                defaultFeatureType: data.defaultFeatureType,
                typeUrl: 'data/api/resourceTypes/' + data.reference + '.json',
                opacity: data.opacity,
                dynamicResource: true
            });
        layer.features = data.geojson.features;
        layer.timestamps = data.geojson.timestamps;
        var group: Api.Group = this.apiManager.getGroupDefinition(<Api.Group>{ title: data.group, id: data.group, clusterLevel: data.clusterLevel });

        async.series([
            (cb: Function) => {
                this.apiManager.addUpdateLayer(layer, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
                    console.log(result);
                    cb();
                });
            },
            (cb: Function) => {
                this.apiManager.addGroup(group, data.projectId, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
                    console.log(result);
                    cb();
                });
            },
            (cb: Function) => {
                let props = {title: data.project, logo: path.join('data', 'images', data.projectLogo), description: data.description};
                this.apiManager.updateProjectProperties(props, data.projectId, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
                    console.log(result);
                    cb();
                });
            },
            (cb: Function) => {
                this.apiManager.addLayerToProject(data.projectId, group.id, layer.id, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
                    console.log(result);
                    cb();
                });
            }
        ]);


        // request({
        //     url: "http://localhost:3002/api/layers",
        //     method: "POST",
        //     json: true,
        //     body: { title: data.layerTitle, id: data.reference, features: data.geojson.features }
        // }, function(error, response, body) {
        //     console.log('Creating layer... ' + response.statusCode + ' ' + body.error);
        //     request({
        //         url: "http://localhost:3002/api/projects/" + data.projectId + "/group",
        //         method: "POST",
        //         json: true,
        //         body: { title: data.group, id: data.group}
        //     }, function(error, response, body) {
        //         console.log('Creating group... ' + response.statusCode + ' ' + body.error);
        //         request({
        //             url: "http://localhost:3002/api/projects/" + data.projectId + "/group/" + data.group + '/layer/' + data.reference,
        //             method: "POST",
        //             json: true,
        //             body: { title: data.group, id: data.group}
        //         }, function(error, response, body) {
        //             console.log('Adding layer to group... ' + response.statusCode + ' ' + body.error);
        //         });
        //     });
        // });

    }

    public processBagContours(req: express.Request, res: express.Response) {
        console.log('Received bag contours request. Processing...');
        var start = new Date().getTime();
        var template: IBagContourRequest = req.body;
        var bounds = template.bounds;
        var bu_code = template.searchProp;
        var layer: csComp.Services.ProjectLayer = template.layer;
        var getPointFeatures: boolean = false;
        if (layer.dataSourceParameters && layer.dataSourceParameters.hasOwnProperty('getPointFeatures')) {
            getPointFeatures = layer.dataSourceParameters['getPointFeatures'];
        }

        layer.data = {};
        layer.data.features = [];
        layer.type = 'database';
        this.addressSources.some((src) => {
            if (typeof src.lookupBagArea === 'function') {
                src.lookupBagArea(bounds || bu_code, layer.refreshBBOX, (areas: Location[]) => {
                    if (!areas || !areas.length || areas.length === 0) {
                        res.status(404).send({});
                    } else {
                        areas.forEach((area: Location) => {
                            var props: {
                                [key: string]: any
                            } = {};
                            for (var p in area) {
                                if (area.hasOwnProperty(p) && area[p] != null) {
                                    // Save all columns to properties, except the ones used as geometry.
                                    if ((!getPointFeatures && (p === 'contour' || p === 'latlon')) ||
                                        (getPointFeatures && p === 'latlon')) {
                                        // skip
                                    } else {
                                        if (!isNaN(parseFloat(area[p])) && isFinite(area[p])) {
                                            props[p] = +area[p];
                                        } else {
                                            props[p] = area[p];
                                        }
                                    }
                                }
                            }
                            var f: IGeoJsonFeature = {
                                type: 'Feature',
                                geometry: (getPointFeatures) ? JSON.parse(area.latlon) : JSON.parse(area.contour),
                                properties: props,
                                id: (getPointFeatures) ? 'p_' + props['pandid'] || Utils.newGuid() : 'c_' + props['pandid'] || Utils.newGuid()
                            };
                            layer.data.features.push(f);
                        });
                        var diff = new Date().getTime() - start;
                        console.log('Updated bag layer: publishing ' + areas.length + ' features after ' + diff + ' ms.');
                        res.status(Api.ApiResult.OK).send({
                            layer: layer
                        });
                        // this.messageBus.publish('bagcontouren', 'layer-update', layer);
                    }
                });
                return true;
            } else {
                return false;
            }
        });
        }

        public processBagSearchQuery(req: express.Request, res: express.Response) {
            var start = new Date().getTime();
            var template: IBagSearchRequest = req.body;
            var query = template.query;
            var nrItems = template.nrItems;
            this.addressSources.some((src) => {
                if (typeof src.searchGemeente === 'function') {
                    src.searchGemeente(query, nrItems, (results) => {
                        if (!results || !results.length || results.length === 0) {
                            res.status(200).send({});
                        } else {
                            var searchResults = [];
                            results.forEach((r) => {
                                var sr = {
                                    title: `${r.title}`,
                                    description: `${r.description}`,
                                    score: 0.99,
                                    location: r.location
                                };
                                searchResults.push(sr);
                            });
                            var diff = new Date().getTime() - start;
                            console.log('Updated bag layer: returning ' + results.length + ' search results after ' + diff + ' ms.');
                            res.status(Api.ApiResult.OK).send({
                                result: searchResults
                            });
                        }
                    });
                    return true;
                } else {
                    return false;
                }
            });
        }

        public processBagBuurten(req: express.Request, res: express.Response) {
            console.log('Received bag buurten request. Processing...');
            var start = new Date().getTime();
            var template: IBagContourRequest = req.body;
            var bounds = template.bounds;
            var gm_code = template.searchProp;
            var layer: csComp.Services.ProjectLayer = template.layer;

            layer.data = {};
            layer.data.features = [];
            layer.type = 'database';
            this.addressSources.some((src) => {
                if (typeof src.lookupBagBuurt === 'function') {
                    src.lookupBagBuurt(bounds || gm_code, layer.refreshBBOX, (areas: Location[]) => {
                        if (!areas || !areas.length || areas.length === 0) {
                            res.status(404).send({});
                        } else {
                            areas.forEach((area: Location) => {
                                var props: {
                                    [key: string]: any
                                } = {};
                                for (var p in area) {
                                    if (area.hasOwnProperty(p) && area[p] != null && p !== 'contour') {
                                        // Save all columns to properties, except the ones used as geometry.
                                        if (!isNaN(parseFloat(area[p])) && isFinite(area[p])) {
                                            props[p] = +area[p];
                                        } else {
                                            props[p] = area[p];
                                        }
                                    }
                                }
                                var f: IGeoJsonFeature = {
                                    type: 'Feature',
                                    geometry: JSON.parse(area.contour),
                                    properties: props,
                                    id: props['bu_code'] || Utils.newGuid()
                                };
                                layer.data.features.push(f);
                            });
                            var diff = new Date().getTime() - start;
                            console.log('Updated bag layer: publishing ' + areas.length + ' features after ' + diff + ' ms.');
                            res.status(Api.ApiResult.OK).send({
                                layer: layer
                            });
                            // this.messageBus.publish('bagcontouren', 'layer-update', layer);
                        }
                    });
                    return true;
                } else {
                    return false;
                }
            });
        }


    public createMapLayer(template: ILayerTemplate, callback: (Object) => void) {
        var ld = template.layerDefinition[0];

        var features: IGeoJsonFeature[] = [];
        // Convert StringFormats (from a readable key to StringFormat notation)
        this.convertStringFormats(template.propertyTypes);
        // Check propertyTypeData for time-based data
        var timestamps = this.convertTimebasedPropertyData(template);

        //Add projectID to the icon name to make it unique
        var iconName = path.basename(ld.iconUri, path.extname(ld.iconUri)) + template.projectId + path.extname(ld.iconUri);
        ld.iconUri = ['data', 'images', iconName].join('/');
        var featureTypeName = ld.featureType || 'Default';
        var featureTypeContent = {
            name: featureTypeName,
            style: {
                iconUri: ld.iconUri,
                iconWidth: +ld.iconSize,
                iconHeight: +ld.iconSize,
                drawingMode: ld.drawingMode,
                stroke: ld.strokeWidth > 0,
                strokeWidth: (typeof ld.strokeWidth !== 'undefined') ? ld.strokeWidth : 3,
                strokeColor: ld.strokeColor || '#000',
                selectedStrokeColor: ld.selectedStrokeColor || '#00f',
                fillColor: ld.fillColor || '#ff0',
                opacity: 1, //ld.opacity || 0.5,
                fillOpacity: 1, //ld.opacity || 0.5,
                nameLabel: ld.nameLabel
            },
            propertyTypeData: template.propertyTypes
        };
        var geojson = {
            type: 'FeatureCollection',
            featureTypes: {},
            features: features
        };
        geojson.featureTypes[featureTypeName] = featureTypeContent;
        if (timestamps.length > 0) {
            geojson['timestamps'] = JSON.parse(JSON.stringify(timestamps));
        }
        // Convert dates (from a readable key to a JavaScript Date string notation)
        this.convertDateProperties(template.propertyTypes, template.properties);
        // Convert types (from a readable key to type notation)
        this.convertTypes(template.propertyTypes, template.properties);
        // Add geometry
        switch (ld.geometryType) {
            case 'Postcode6_en_huisnummer':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                } if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                } if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.OnlyCoordinates, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                } else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.OnlyCoordinates, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                }
                break;
            case 'Postcode6_en_huisnummer_met_bouwjaar':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                } if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                } if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.WithBouwjaar, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                } else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.WithBouwjaar, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                }
                break;
            case 'Postcode6_en_huisnummer_met_bag':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                } if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                } if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.All, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                } else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.All, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                }
                break;
            case 'Postcode6_en_huisnummer_met_bag_en_woningtype':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the zip code!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the house number!');
                    return;
                } if (!ld.parameter3) {
                    console.log('Warning: Parameter3 should be the name of the column containing the house letter! Now using number only!');
                } if (!ld.parameter4) {
                    console.log('Warning: Parameter4 should be the name of the column containing the house number addition! Now using number only!');
                }
                if (!ld.parameter3 || !ld.parameter4) {
                    this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.AddressCountInBuilding, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                } else {
                    this.mergeHouseNumber(ld.parameter1, ld.parameter2, ld.parameter3, ld.parameter4, template.properties);
                    this.createPointFeature(ld.parameter1, '_mergedHouseNumber', IBagOptions.AddressCountInBuilding, features, template.properties, template.propertyTypes, template.sensors || [],
                        () => { callback(geojson); });
                }
                break;
            case 'Latitude_and_longitude':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the latitude!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the longitude!');
                    return;
                }
                this.createLatLonFeature(ld.parameter1, ld.parameter2, features, template.properties, template.sensors || [],
                    () => { callback(geojson); });
                break;
            case 'RD_X_en_Y':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the RD X coordinate!');
                    return;
                }
                if (!ld.parameter2) {
                    console.log('Error: Parameter2 should be the name of the column containing the RD Y coordinate!');
                    return;
                }
                this.createRDFeature(ld.parameter1, ld.parameter2, features, template.properties, template.sensors || [],
                    () => { callback(geojson); });
                break;
            case 'OpenStreetMap':
                if (!ld.parameter1) {
                    console.log('Error: Parameter1 should be the name of the column containing the search query!');
                    return;
                }
                this.createInternationalFeature(ld.parameter1, features, template.properties, template.sensors || [],
                    () => { callback(geojson); });
                break;
            default:
                if (!ld.parameter1) {
                    console.log('Error: At least parameter1 should contain a value!');
                    return;
                }
                this.getPolygonType(ld, template.properties);
                this.createPolygonFeature(ld.geometryFile, ld.geometryKey, ld.parameter1, ld.includeOriginalProperties, features, template.properties, template.propertyTypes, template.sensors || [],
                    () => { callback(geojson); });
                break;
        }
        //console.log("Drawing mode" + ld.drawingMode);
        return geojson;
    }

    private getPolygonType(ld: ILayerDefinition, props: IProperty[]) {
        let type = this.determineType(props, ld.parameter1);
        switch (ld.geometryType) {
            case 'Provincie':
                if (type === 'both') {
                    ld.geometryFile = 'CBS_Provincie_op_code';
                    ld.geometryKey = 'Name';
                } else {
                    ld.geometryFile = 'CBS_Provincie_op_naam';
                    ld.geometryKey = 'Name';
                }
                break;
            case 'Gemeente':
                ld.geometryFile = 'CBS_Gemeente';
                if (type === 'both') {
                    ld.geometryKey = 'GM_CODE';
                } else {
                    ld.geometryKey = 'GM_NAAM';
                }
                break;
            case 'Buurt':
                ld.geometryFile = 'CBS_Buurt';
                if (type === 'both') {
                    ld.geometryKey = 'BU_CODE';
                } else {
                    ld.geometryKey = 'BU_NAAM';
                }
                break;
            default:
                break;
            }
    }

    private determineType(props: IProperty[], label: string): 'name' | 'number' | 'both' {
        let nrNames, nrNumbers, nrBoth;
        nrNames = nrNumbers = nrBoth = 0;
        props.slice(0, 10).forEach((prop) => {
            if (prop.hasOwnProperty(label)) {
                let text = (prop[label].toString().match(/[a-zA-Z]+/g));
                let number = (prop[label].toString().match(/\d/g));
                if (text && number) {
                    nrBoth += 1;
                } else if (text) {
                    nrNames += 1;
                } else if (number) {
                    nrNumbers += 1;
                }
            }
        });
        let results = [{key: 'name', val: nrNames}, {key: 'number', val: nrNumbers}, {key: 'both', val: nrBoth}];
        results = _.sortBy(results, (obj) => { return obj.val; });
        return <'name' | 'number' | 'both'>_.first(results).key;
    }

    /**
     * This function extracts the timestamps and sensorvalues from the
     * template.propertyTypes. Every sensorvalue is parsed as propertyType in
     * MS Excel, which should be converted to a sensor-array for each feature.
     * @param  {ILayerTemplate} template : The input template coming from MS Excel
     * @return {array} timestamps        : An array with all date/times converted to milliseconds
     */
    private convertTimebasedPropertyData(template: ILayerTemplate) {
        var propertyTypes: IPropertyType[] = template.propertyTypes;
        if (!propertyTypes) { return; }
        var timestamps = [];
        var targetPropertyTypes = [];
        var realPropertyTypes: IPropertyType[] = []; //Filter out propertyTypes that are actually a timestamp value
        propertyTypes.forEach((pt) => {
            if (pt.hasOwnProperty('targetProperty')) {
                if (pt['targetProperty'] !== pt['label']) {
                    targetPropertyTypes.push(pt);
                } else {
                    realPropertyTypes.push(pt);
                }
                var timestamp = this.convertTime(pt['date'], pt['time']);
                timestamps.push(timestamp);
            } else {
                realPropertyTypes.push(pt);
            }
        });
        template.propertyTypes = realPropertyTypes;
        //if (timestamps.length <= 0) return timestamps;

        // If the data contains time-based values, convert the corresponding properties
        // to a sensor array.
        var properties: IProperty[] = template.properties;
        var realProperties: IProperty[] = []; //To filter out properties that are actually a sensor value
        var realSensors: IProperty[] = [];
        properties.forEach((p) => {
            var realProperty: IProperty = {};
            var sensors: IProperty = {};
            realPropertyTypes.forEach((tp: IPropertyType) => {
                if (tp.hasOwnProperty('targetProperty')) {
                    sensors[tp.label] = [];
                }
            });
            for (var key in p) {
                if (p.hasOwnProperty(key)) {
                    var itemName: string = key;
                    if (!targetPropertyTypes.some((tp) => {
                        if (itemName === tp['label']) {
                            sensors[tp['targetProperty']].push(p[key]);
                            return true;
                        } else {
                            return false;
                        }
                    })) {
                        realProperty[itemName] = p[key];
                        if (sensors.hasOwnProperty(itemName)) {
                            sensors[itemName].push(p[key]);
                        }
                    }
                }
            }
            if (Object.keys(sensors).length !== 0) { realSensors.push(sensors); }
            realProperties.push(realProperty);
        });
        if (realSensors.length > 0) { template.sensors = realSensors; }
        template.properties = realProperties;
        return timestamps;
    }

    private createPolygonFeature(templateName: string, templateKey: string, par1: string, inclTemplProps: boolean, features: IGeoJsonFeature[], properties: IProperty[],
        propertyTypes: IPropertyType[], sensors: IProperty[], callback: Function) {
        if (!properties) { callback(); }
        if (!this.templateFiles.hasOwnProperty(templateName)) {
            console.log('Error: could not find template: ' + templateName);
            callback();
        }
        var templateUrl: string = this.templateFiles[templateName];
        var templateFile = fs.readFileSync(templateUrl);
        var templateJson = JSON.parse(templateFile.toString());

        if (inclTemplProps && templateJson.featureTypes && templateJson.featureTypes.hasOwnProperty('Default')) {
            templateJson.featureTypes['Default'].propertyTypeData.forEach((ft) => {
                if (!properties[0].hasOwnProperty(ft.label) && ft.label !== templateKey) { //Do not overwrite input data, only add new items
                    propertyTypes.push(ft);
                }
            });
        }
        var fts = templateJson.features;
        properties.forEach((p, index) => {
            var foundFeature = false;
            fts.some((f) => {
                if (f.properties[templateKey] == p[par1]) { // Do no type-check (don't use ===)
                    console.log(p[par1]);
                    if (inclTemplProps) {
                        for (var key in f.properties) {
                            if (!p.hasOwnProperty(key) && key !== templateKey) { //Do not overwrite input data, only add new items
                                p[key] = f.properties[key];
                            }
                        }
                    }
                    var featureJson: IGeoJsonFeature = {
                        type: 'Feature',
                        geometry: f.geometry,
                        properties: p
                    };
                    if (sensors.length > 0) {
                        featureJson['sensors'] = sensors[index];
                    }
                    features.push(featureJson);
                    foundFeature = true;
                    return true;
                } else {
                    return false;
                }
            });
            if (!foundFeature) {
                console.log('Warning: Could not find: ' + p[par1]);
                this.featuresNotFound[`${p[par1]}`] = { zip: `${p[par1]}`, number: '' };
            }
        });
        callback();
    }

    private createInternationalFeature(queryString: string, features: IGeoJsonFeature[], properties: IProperty[], sensors: IProperty[], callback: Function) {
            async.eachLimit(properties, 10, (prop, innercallback) => {
                var index = properties.indexOf(prop);
                if (prop.hasOwnProperty(queryString) && typeof prop[queryString] === 'string') {
                    var q = prop[queryString];
                    let searchPerformed = this.addressSources.some((src) => {
                        if (typeof src.searchAddress === 'function') {
                            src.searchAddress(q, 4, (locations: any[]) => {
                                    if (!locations || locations.length === 0 || typeof locations[0] === 'undefined') {
                                        console.log(`Cannot find location: ${q}`);
                                        this.featuresNotFound[`${q}`] = {
                                            zip: `${q}`,
                                            number: `0`
                                        };
                                        innercallback();
                                    } else {
                                        console.log('Found location (international)');
                                        console.log(`${locations[0].lon}, ${locations[0].lat}`);
                                        features.push(this.createFeature(+locations[0].lon, +locations[0].lat, prop, sensors[index] || {}));
                                        innercallback();
                                    }
                            });
                            return true;
                        } else {
                            return false;
                        }
                    });
                    if (!searchPerformed) innercallback();
                } else {
                    innercallback();
                }
            }, (err) => {
                if (err) {
                    console.warn(`Error performing searches ${err}`);
                } else {
                    console.log('International search completed');
                    callback();
                }
            });
    }

    private createLatLonFeature(latString: string, lonString: string, features: IGeoJsonFeature[], properties: IProperty[], sensors: IProperty[], callback: Function) {
        if (!properties) { callback(); }
        properties.forEach((prop, index) => {
            var lat = prop[latString];
            var lon = prop[lonString];
            if (isNaN(lat) || isNaN(lon)) {
                console.log('Error: Not a valid coordinate ( ' + lat + ', ' + lon + ')');
            } else {
                features.push(this.createFeature(lon, lat, prop, sensors[index] || {}));
            }
        });
        callback();
    }

    /**
     * Convert the RD coordinate to WGS84.
     */
    private createRDFeature(rdX: string, rdY: string, features: IGeoJsonFeature[], properties: IProperty[], sensors: IProperty[], callback: Function) {
        if (!properties) { callback(); }
        //https://github.com/yuletide/node-proj4js-defs/blob/master/epsg.js
        //Proj4js.defs["EPSG:28992"] = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000
        //+ellps=bessel + towgs84=565.417, 50.3319, 465.552, -0.398957, 0.343988, -1.8774, 4.0725 + units=m + no_defs";
        proj4.defs('RD', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
            ' +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');
        var converter = proj4('RD');
        properties.forEach((prop, index) => {
            var x = prop[rdX];
            var y = prop[rdY];
            if (isNaN(x) || isNaN(y)) {
                console.log('Error: Not a valid coordinate ( ' + x + ', ' + y + ')');
            } else {
                var wgs = converter.inverse({ x: x, y: y });
                //console.log(JSON.stringify(wgs));
                features.push(this.createFeature(wgs.x, wgs.y, prop, sensors[index] || {}));
            }
        });
        callback();
    }

    private mergeHouseNumber(zipCode: string, houseNumber: string, letter: string, addition: string, properties: IProperty[]) {
        var merged;
        properties.forEach((prop, index) => {
            merged = '';
            if (prop.hasOwnProperty(houseNumber)) {
                merged = prop[houseNumber] + '-';
            }
            if (prop.hasOwnProperty(letter)) {
                merged = merged + prop[letter];
            }
            if (prop.hasOwnProperty(addition)) {
                merged = merged + '-' + prop[addition];
            }
            prop['_mergedHouseNumber'] = merged.replace(/ /g, ''); // set merged houseNumber as houseNumber
        });
    }

    private createPointFeature(zipCode: string, houseNumber: string, bagOptions: IBagOptions, features: IGeoJsonFeature[],
        properties: IProperty[], propertyTypes: IPropertyType[], sensors: IProperty[], callback: Function) {
        if (!properties) { callback(); }
        var todo = properties.length;
        var asyncthis = this;

        async.eachSeries(properties, function(prop, innercallback) {
            var index = properties.indexOf(prop);

            if (prop.hasOwnProperty(zipCode) && typeof prop[zipCode] === 'string') {
                var zip = prop[zipCode].replace(/ /g, '');
                var nmb = prop[houseNumber];
                let searchPerformed = asyncthis.addressSources.some((src) => {
                    if (typeof src.lookupBagAddress === 'function') {
                        src.lookupBagAddress(zip, nmb, bagOptions, (locations: Location[]) => {
                            //console.log(todo);
                            if (!locations || locations.length === 0 || typeof locations[0] === 'undefined') {
                                console.log(`Cannot find location with zip: ${zip}, houseNumber: ${nmb}`);
                                asyncthis.featuresNotFound[`${zip}${nmb}`] = {
                                    zip: `${zip}`,
                                    number: `${nmb}`
                                };
                            } else {
                                for (var key in locations[0]) {
                                    if (key !== 'lon' && key !== 'lat') {
                                        if (locations[0][key]) {
                                            prop[(key.charAt(0).toUpperCase() + key.slice(1))] = locations[0][key];
                                            asyncthis.createPropertyType(propertyTypes, (key.charAt(0).toUpperCase() + key.slice(1)), 'BAG');
                                        }
                                    }
                                }
                                if (prop.hasOwnProperty('_mergedHouseNumber')) {
                                    delete prop['_mergedHouseNumber'];
                                }
                                //console.log('locations[0] ' + locations[0]);
                                features.push(asyncthis.createFeature(locations[0].lon, locations[0].lat, prop, sensors[index] || {}));
                            }
                            innercallback();
                        });
                        return true;
                    } else {
                        return false;
                    }
                });
                if (!searchPerformed) innercallback();
            } else {
                //console.log('No valid zipcode found: ' + prop[zipCode]);
                innercallback();
            }
        }, function(err) {
            callback();
        });
    }

    private createFeature(lon: number, lat: number, properties: IProperty, sensors?: IProperty): IGeoJsonFeature {
        var gjson = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            properties: properties
        };
        if (Object.keys(sensors).length !== 0) {
            gjson['sensors'] = sensors;
        }
        return gjson;
    }

    private createPropertyType(propertyTypes: IPropertyType[], name: string, section?: string) {
        if (!name) { return; }
        var propertyTypeExists = false;
        propertyTypes.some((pt) => {
            if (pt.label.toLowerCase() === name.toLowerCase()) {
                propertyTypeExists = true;
                return true;
            } else {
                return false;
            }
        });
        if (propertyTypeExists) { return; }
        var propType: IPropertyType = {
            label: name,
            title: name,
            type: 'text',
            visibleInCallOut: true,
            canEdit: true,
            isSearchable: false
        };
        if (section) { propType['section'] = section; }
        switch (name.toLowerCase()) {
            case 'oppervlakteverblijfsobject':
            case 'bouwjaar':
                propType.type = 'number';
                break;
            case '_bag_contour':
                propType.visibleInCallOut = false;
                break;
        }
        propertyTypes.push(propType);
    }

    private convertTime(date: string, time: string): number {
        if (!date || date.length < 6) { return 0; }
        var year = Number(date.substr(0, 4));
        var month = Number(date.substr(4, 2));
        var day = Number(date.substr(6, 2));
        var d = new Date(0);
        d.setFullYear(year);
        d.setMonth(month - 1);
        d.setDate(day);
        //TODO: Take time into account
        var timeInMs = d.getTime();
        console.log('Converted ' + date + ' ' + time + ' to ' + d.toDateString() + ' (' + d.getTime() + ' ms)');
        return timeInMs;
    }

    private convertDateProperties(propertyTypes: IPropertyType[], properties: IProperty[]) {
        if (!propertyTypes || !properties) { return; }
        propertyTypes.forEach((pt) => {
            if (pt.hasOwnProperty('type') && pt['type'] === 'date') {
                var name = pt['label']; //Store name of the property with type "date"
                properties.forEach((p) => {
                    if (p.hasOwnProperty(name)) {
                        var timeInMs = this.convertTime(p[name], ''); //TODO: Add Time compatibility
                        p[name] = timeInMs;
                        //var d = new Date(timeInMs);
                        //p[name] = d.toString();
                    }
                });
            }
        });
    }

    private convertTypes(propertyTypes: IPropertyType[], properties: IProperty[]) {
        if (!propertyTypes || !properties) { return; }
        propertyTypes.forEach((pt) => {
            if (pt.hasOwnProperty('type') && pt['type'] === 'url') {
                var name = pt['label']; //Store name of the property with type "url"
                properties.forEach((p) => {
                    if (p.hasOwnProperty(name)) {
                        if (p[name].substring(0, 3) === 'www') {
                            p[name] = '[url=http://' + p[name] + ']' + (pt['stringFormat'] ? pt['stringFormat'] : p[name]) + '[/url]';
                        } else {
                            p[name] = '[url=' + p[name] + ']' + (pt['stringFormat'] ? pt['stringFormat'] : p[name]) + '[/url]';
                        }
                    }
                });
                // Prepare propType for use in csWeb-client
                pt['type'] = 'bbcode';
                delete pt['stringFormat'];
            }
        });
    }

    private convertStringFormats(properties) {
        properties.forEach(function(prop) {
            if (prop.hasOwnProperty('stringFormat')) {
                switch (prop['stringFormat']) {
                    case 'No_decimals':
                        prop['stringFormat'] = '{0:#,#}';
                        break;
                    case 'One_decimal':
                        prop['stringFormat'] = '{0:#,#.#}';
                        break;
                    case 'Two_decimals':
                        prop['stringFormat'] = '{0:#,#.##}';
                        break;
                    case 'Euro_no_decimals':
                        prop['stringFormat'] = '€{0:#,#}';
                        break;
                    case 'Euro_two_decimals':
                        prop['stringFormat'] = '€{0:#,#.00}';
                        break;
                    case 'Percentage_no_decimals':
                        prop['stringFormat'] = '{0:#,#}%';
                        break;
                    case 'Percentage_one_decimal':
                        prop['stringFormat'] = '{0:#,#.#}%';
                        break;
                    case 'Percentage_two_decimals':
                        prop['stringFormat'] = '{0:#,#.##}%';
                        break;
                    case 'Percentage_four_decimals':
                        prop['stringFormat'] = '{0:#,#.####}%';
                        break;
                    default:
                        if ((prop['stringFormat'].indexOf('{') < 0) && (prop['stringFormat'].indexOf('}') < 0)) {
                            console.log('stringFormat \'' + prop['stringFormat'] + '\' not found.');
                        }
                        break;
                }
            }
        });
    }
}
