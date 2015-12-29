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
import LocalBag = require('../database/LocalBag');
import IBagOptions = require('../database/IBagOptions');
import IGeoJsonFeature = require('./IGeoJsonFeature');
import Api = require('../api/ApiManager');
import Utils = require('../helpers/Utils');
import async = require('async');
import winston = require('winston');
import path = require('path');

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

export interface IProperty {
    [key: string]: any;
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
    targetrelation?: string;
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
    iconBase64?: string;
}

export interface IBagContourRequest {
    bounds: string;
    layer: any;
}

/** A factory class to create new map layers based on input, e.g. from Excel */
export class MapLayerFactory {
    templateFiles: IProperty[];
    featuresNotFound: any;
    apiManager: Api.ApiManager;

    // constructor(private bag: LocalBag, private messageBus: MessageBus.MessageBusService) {
    constructor(private bag: BagDatabase.BagDatabase, private messageBus: MessageBus.MessageBusService, apiManager: Api.ApiManager) {
        var fileList: IProperty[] = [];
        fs.readdir('public/data/templates', function(err, files) {
            if (err) {
                console.log('Error while looking for templates');
            } else {
                files.forEach((f) => {
                    fileList[f.replace(/\.[^/.]+$/, '')] = ('public/data/templates/' + f); // Filter extension from key and store in dictionary
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

            if (!template.projectId || !ld.reference) {
                console.log('Error: No project or layer ID');
                return;
            }
            var layerId = template.projectId + ld.reference.toLowerCase();
            var data = {
                project: ld.projectTitle,
                projectId: template.projectId,
                layerTitle: ld.layerTitle,
                description: ld.description,
                reference: layerId,
                featureType: layerId,
                opacity: ld.opacity,
                clusterLevel: ld.clusterLevel,
                useClustering: ld.useClustering,
                group: ld.group,
                geojson: geojson,
                enabled: ld.isEnabled,
                iconBase64: template.iconBase64,
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
            this.sendIconThroughApiManager(data.iconBase64, path.basename(ld.iconUri));
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

    public sendIconThroughApiManager(b64: string, path: string) {
        this.apiManager.addFile(b64, '', path, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
            console.log(result);
        });
    }

    public sendResourceThroughApiManager(data: any, resourceId: string) {
        data.id = resourceId;
        this.apiManager.addResource(data, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
            console.log(result);
        });
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
                this.apiManager.updateProjectTitle(data.project, data.projectId, <Api.ApiMeta>{ source: 'maplayerfactory' }, (result: Api.CallbackResult) => {
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
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('');
        console.log('Received bag contours request. Processing...');
        var template: IBagContourRequest = req.body;
        var bounds = template.bounds;
        var layer = template.layer;

        layer.data = {};
        layer.data.features = [];
        layer.type = 'database';
        this.bag.lookupBagArea(bounds, (areas: Location[]) => {
            areas.forEach((area: Location) => {
                var props: { [key: string]: any } = {};
                for (var p in area) {
                    if (area.hasOwnProperty(p)) {
                        if (p !== 'contour') { props[p] = area[p]; }
                    }
                }
                var f: IGeoJsonFeature = {
                    type: 'Feature',
                    geometry: JSON.parse(area.contour),
                    properties: props
                };
                layer.data.features.push(f);
            });
            console.log('Updated bag layer: publishing' + areas.length + ' features...');
            this.messageBus.publish('dynamic_project_layer', 'send-layer', layer);
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
        var iconName = path.join(path.basename(ld.iconUri, path.extname(ld.iconUri)) + template.projectId + path.extname(ld.iconUri));
        ld.iconUri = path.join('data', 'images', iconName);
        var featureTypeName = ld.featureType || 'Default';
        var featureTypeContent = {
            name: featureTypeName,
            style: {
                iconUri: ld.iconUri,
                iconWidth: ld.iconSize,
                iconHeight: ld.iconSize,
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
            default:
                if (!ld.parameter1) {
                    console.log('Error: At least parameter1 should contain a value!');
                    return;
                }
                this.createPolygonFeature(ld.geometryFile, ld.geometryKey, ld.parameter1, ld.includeOriginalProperties, features, template.properties, template.propertyTypes, template.sensors || [],
                    () => { callback(geojson); });
                break;
        }
        //console.log("Drawing mode" + ld.drawingMode);
        return geojson;
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
                if (f.properties[templateKey] === p[par1]) {
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
        var bg = this.bag;
        var asyncthis = this;

        async.eachSeries(properties, function(prop, innercallback) {
            var index = properties.indexOf(prop);

            if (prop.hasOwnProperty(zipCode) && typeof prop[zipCode] === 'string') {
                var zip = prop[zipCode].replace(/ /g, '');
                var nmb = prop[houseNumber];
                bg.lookupBagAddress(zip, nmb, bagOptions, (locations: Location[]) => {
                    //console.log(todo);
                    if (!locations || locations.length === 0 || typeof locations[0] === 'undefined') {
                        console.log(`Cannot find location with zip: ${zip}, houseNumber: ${nmb}`);
                        asyncthis.featuresNotFound[`${zip}${nmb}`] = { zip: `${zip}`, number: `${nmb}` };
                    } else {
                        for (var key in locations[0]) {
                            if (key !== 'lon' && key !== 'lat') {
                                if (locations[0][key]) {
                                    prop[(key.charAt(0).toUpperCase() + key.slice(1))] = locations[0][key];
                                    asyncthis.createPropertyType(propertyTypes, (key.charAt(0).toUpperCase() + key.slice(1)), 'BAG');
                                }
                            }
                        }
                        if (prop.hasOwnProperty('_mergedHouseNumber')) { delete prop['_mergedHouseNumber']; }
                        //console.log('locations[0] ' + locations[0]);
                        features.push(asyncthis.createFeature(locations[0].lon, locations[0].lat, prop, sensors[index] || {}));
                    }
                    innercallback();
                });
            } else {
                //console.log('No valid zipcode found: ' + prop[zipCode]);
                innercallback();
            }
        }, function(err) {
            callback();
        });


        // properties.forEach((prop, index) => {
        //     if (prop.hasOwnProperty(zipCode) && typeof prop[zipCode] === 'string') {
        //         var zip = prop[zipCode].replace(/ /g, '');
        //         var nmb = prop[houseNumber];
        //         this.bag.lookupBagAddress(zip, nmb, bagOptions, (locations: Location[]) => {
        //             //console.log(todo);
        //             if (!locations || locations.length === 0 || typeof locations[0] == 'undefined') {
        //                 console.log(`Cannot find location with zip: ${zip}, houseNumber: ${nmb}`);
        //                 this.featuresNotFound[`${zip}${nmb}`] = { zip: `${zip}`, number: `${nmb}` };
        //             } else {
        //                 for (var key in locations[0]) {
        //                     if (key !== "lon" && key !== "lat") {
        //                         if (locations[0][key]) {
        //                             prop[(key.charAt(0).toUpperCase() + key.slice(1))] = locations[0][key];
        //                             this.createPropertyType(propertyTypes, (key.charAt(0).toUpperCase() + key.slice(1)), "BAG");
        //                         }
        //                     }
        //                 }
        //                 if (prop.hasOwnProperty('_mergedHouseNumber')) delete prop['_mergedHouseNumber'];
        //                 //console.log('locations[0] ' + locations[0]);
        //                 features.push(this.createFeature(locations[0].lon, locations[0].lat, prop, sensors[index] || {}));
        //             }
        //         });
        //         todo--;
        //         if (todo <= 0)
        //           callback();
        //     } else {
        //         console.log('No valid zipcode found: ' + prop[zipCode]);
        //         todo--;
        //     }
        // });
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
        propertyTypes.push(propType);
    }

    private convertTime(date: string, time: string): number {
        if (date.length < 6) { return 0; }
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
                            p[name] = '[url=http://' + p[name] + ']' + p[name] + '[/url]';
                        } else {
                            p[name] = '[url=' + p[name] + ']' + p[name] + '[/url]';
                        }
                    }
                });
                pt['type'] = 'bbcode';
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
