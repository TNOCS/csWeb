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
import IBagOptions = require('../database/IBagOptions');
import IGeoJsonFeature = require('./IGeoJsonFeature');

export interface ILayerDefinition {
    projectTitle: string,
    reference: string,
    group: string,
    layerTitle: string,
    description: string,
    featureType: string,
    geometryType: string,
    parameter1: string,
    parameter2: string,
    parameter3: string,
    iconUri: string,
    iconSize: number,
    drawingMode: string,
    fillColor: string,
    strokeColor: string,
    selectedStrokeColor: string,
    strokeWidth: number,
    isEnabled: boolean,
    clusterLevel: number,
    useClustering: boolean,
    opacity: number,
    nameLabel: string,
    includeOriginalProperties: boolean,
    defaultFeatureType: string
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
    layerDefinition: ILayerDefinition[],
    propertyTypes: IPropertyType[],
    properties: IProperty[],
    sensors?: IProperty[],
    projectId?: string
}

export interface IBagContourRequest {
    bounds: string,
    layer: any
}

/** A factory class to create new map layers based on input, e.g. from Excel */
export class MapLayerFactory {
    templateFiles: IProperty[];
    featuresNotFound: any;

    constructor(private bag: BagDatabase, private messageBus: MessageBus.MessageBusService) {
        var fileList: IProperty[] = [];
        fs.readdir("public/data/templates", function(err, files) {
            if (err) {
                console.log("Error while looking for templates");
            } else {
                files.forEach((f) => {
                    fileList[f.replace(/\.[^/.]+$/, "")] = ("public/data/templates/" + f); // Filter extension from key and store in dictionary
                });
            }
        });
        this.templateFiles = fileList;
        this.featuresNotFound = {};
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

            var data = {
                project: ld.projectTitle,
                projectId: (template.projectId) ? template.projectId : ld.projectTitle,
                layerTitle: ld.layerTitle,
                description: ld.description,
                reference: ld.reference.toLowerCase(),
                featureType: ld.featureType,
                clusterLevel: ld.clusterLevel,
                useClustering: ld.useClustering,
                group: ld.group,
                geojson: geojson,
                enabled: ld.isEnabled
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

            console.log("New map created: publishing...");
            this.messageBus.publish('dynamic_project_layer', 'created', data);

            this.sendLayerThroughApi(data);
        });
    }

    public sendLayerThroughApi(data: any) {
        request({
            url: "http://localhost:3002/api/layers",
            method: "POST",
            json: true,
            body: { title: data.layerTitle, id: data.reference, features: data.geojson.features }
        }, function(error, response, body) {
            console.log('Creating layer... ' + response.statusCode + ' ' + body.error);
            request({
                url: "http://localhost:3002/api/projects/" + data.projectId + "/group",
                method: "POST",
                json: true,
                body: { title: data.group, id: data.group}
            }, function(error, response, body) {
                console.log('Creating group... ' + response.statusCode + ' ' + body.error);
                request({
                    url: "http://localhost:3002/api/projects/" + data.projectId + "/group/" + data.group + '/layer/' + data.reference,
                    method: "POST",
                    json: true,
                    body: { title: data.group, id: data.group}
                }, function(error, response, body) {
                    console.log('Adding layer to group... ' + response.statusCode + ' ' + body.error);
                });
            });
        });

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
                        if (p !== 'contour') props[p] = area[p];
                    }
                }
                var f: IGeoJsonFeature = {
                    type: "Feature",
                    geometry: JSON.parse(area.contour),
                    properties: props
                };
                layer.data.features.push(f);
            });
            console.log("Updated bag layer: publishing" + areas.length + " features...");
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
        var featureTypeName = ld.featureType || "Default";
        var featureTypeContent = {
            name: featureTypeName,
            style: {
                iconUri: ld.iconUri,
                iconWidth: ld.iconSize,
                iconHeight: ld.iconSize,
                drawingMode: ld.drawingMode,
                stroke: ld.strokeWidth > 0,
                strokeWidth: (typeof ld.strokeWidth !== 'undefined') ? ld.strokeWidth : 3,
                strokeColor: ld.strokeColor || "#000",
                selectedStrokeColor: ld.selectedStrokeColor || "#00f",
                fillColor: ld.fillColor || "#ff0",
                opacity: ld.opacity || 0.5,
                fillOpacity: ld.opacity || 0.5,
                nameLabel: ld.nameLabel
            },
            propertyTypeData: template.propertyTypes
        }
        var geojson = {
            type: "FeatureCollection",
            featureTypes: {},
            features: features
        };
        geojson.featureTypes[featureTypeName] = featureTypeContent;
        if (timestamps.length > 0) {
            geojson["timestamps"] = JSON.parse(JSON.stringify(timestamps));
        }
        // Convert dates (from a readable key to a JavaScript Date string notation)
        this.convertDateProperties(template.propertyTypes, template.properties);
        // Convert types (from a readable key to type notation)
        this.convertTypes(template.propertyTypes, template.properties);
        // Add geometry
        switch (ld.geometryType) {
            case "Postcode6_en_huisnummer":
                if (!ld.parameter1) {
                    console.log("Error: Parameter1 should be the name of the column containing the zip code!")
                    return;
                }
                if (!ld.parameter2) {
                    console.log("Error: Parameter2 should be the name of the column containing the house number!")
                    return;
                }
                this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.OnlyCoordinates, features, template.properties, template.propertyTypes, template.sensors || [], () => { callback(geojson) });
                break;
            case "Postcode6_en_huisnummer_met_bouwjaar":
                if (!ld.parameter1) {
                    console.log("Error: Parameter1 should be the name of the column containing the zip code!")
                    return;
                }
                if (!ld.parameter2) {
                    console.log("Error: Parameter2 should be the name of the column containing the house number!")
                    return;
                }
                this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.WithBouwjaar, features, template.properties, template.propertyTypes, template.sensors || [], () => { callback(geojson) });
                break;
            case "Postcode6_en_huisnummer_met_bag":
                if (!ld.parameter1) {
                    console.log("Error: Parameter1 should be the name of the column containing the zip code!")
                    return;
                }
                if (!ld.parameter2) {
                    console.log("Error: Parameter2 should be the name of the column containing the house number!")
                    return;
                }
                this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.All, features, template.properties, template.propertyTypes, template.sensors || [], () => { callback(geojson) });
                break;
            case "Postcode6_en_huisnummer_met_bag_en_woningtype":
                if (!ld.parameter1) {
                    console.log("Error: Parameter1 should be the name of the column containing the zip code!")
                    return;
                }
                if (!ld.parameter2) {
                    console.log("Error: Parameter2 should be the name of the column containing the house number!")
                    return;
                }
                this.createPointFeature(ld.parameter1, ld.parameter2, IBagOptions.AddressCountInBuilding, features, template.properties, template.propertyTypes, template.sensors || [], () => { callback(geojson) });
                break;
            case "Latitude_and_longitude":
                if (!ld.parameter1) {
                    console.log("Error: Parameter1 should be the name of the column containing the latitude!")
                    return;
                }
                if (!ld.parameter2) {
                    console.log("Error: Parameter2 should be the name of the column containing the longitude!")
                    return;
                }
                this.createLatLonFeature(ld.parameter1, ld.parameter2, features, template.properties, template.sensors || [], () => { callback(geojson) });
                break;
            case "RD_X_en_Y":
                if (!ld.parameter1) {
                    console.log("Error: Parameter1 should be the name of the column containing the RD X coordinate!")
                    return;
                }
                if (!ld.parameter2) {
                    console.log("Error: Parameter2 should be the name of the column containing the RD Y coordinate!")
                    return;
                }
                this.createRDFeature(ld.parameter1, ld.parameter2, features, template.properties, template.sensors || [], () => { callback(geojson) });
                break;
            default:
                if (!ld.parameter1) {
                    console.log("Error: At least parameter1 should contain a value!")
                    return;
                }
                this.createPolygonFeature(ld.geometryType, ld.parameter1, ld.includeOriginalProperties, features, template.properties, template.propertyTypes, template.sensors || [], () => { callback(geojson) });
                break;
        }
        //console.log("Drawing mode" + ld.drawingMode);
        return geojson;
    }

    /**
     * This function extracts the timestamps and sensorvalues from the
     * template.propertyTypes. Every sensorvalue is parsed as propertyType in
     * MS Excel, which should be converted to a sensor-array for each feature.
     * Note: Each propertyname is appended with a 6-digit number, as JSON objects
     * need unique keys. These are trimmed in this function.
     * @param  {ILayerTemplate} template : The input template coming from MS Excel
     * @return {array} timestamps        : An array with all date/times converted to milliseconds
     */
    private convertTimebasedPropertyData(template: ILayerTemplate) {
        var propertyTypes: IPropertyType[] = template.propertyTypes;
        if (!propertyTypes) return;
        var timestamps = [];
        var targetProperties = [];
        var realPropertyTypes: IPropertyType[] = []; //Filter out propertyTypes that are actually a timestamp value
        propertyTypes.forEach((pt) => {
            if (pt.hasOwnProperty("targetProperty")) {
                //Prevent duplicate properties
                if (targetProperties.indexOf(pt["targetProperty"]) < 0) targetProperties.push(pt["targetProperty"]);
                //Prevent duplicate timestamps
                var timestamp = this.convertTime(pt["date"], pt["time"]);
                if (timestamps.indexOf(timestamp) < 0) timestamps.push(timestamp);
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
            targetProperties.forEach((tp: string) => {
                sensors[tp] = [];
            });
            for (var key in p) {
                if (p.hasOwnProperty(key)) {
                    var itemName: string = key.substr(0, key.length - 6);
                    if (targetProperties.indexOf(itemName) >= 0) {
                        sensors[itemName].push(p[key]);
                    } else {
                        realProperty[itemName] = p[key];
                    }
                }
            }
            if (Object.keys(sensors).length !== 0) realSensors.push(sensors);
            realProperties.push(realProperty);
        });
        if (realSensors.length > 0) template.sensors = realSensors;
        template.properties = realProperties;
        return timestamps;
    }

    private createPolygonFeature(templateName: string, par1: string, inclTemplProps: boolean, features: IGeoJsonFeature[], properties: IProperty[], propertyTypes: IPropertyType[], sensors: IProperty[], callback: Function) {
        if (!properties) callback();
        if (!this.templateFiles.hasOwnProperty(templateName)) {
            console.log("Error: could not find template: " + templateName);
            callback();
        }
        var templateUrl: string = this.templateFiles[templateName];
        var templateFile = fs.readFileSync(templateUrl);
        var templateJson = JSON.parse(templateFile.toString());

        if (inclTemplProps && templateJson.featureTypes && templateJson.featureTypes.hasOwnProperty("Default")) {
            templateJson.featureTypes["Default"].propertyTypeData.forEach((ft) => {
                if (!properties[0].hasOwnProperty(ft.label) && ft.label !== "Name") { //Do not overwrite input data, only add new items
                    propertyTypes.push(ft);
                }
            });
        }
        var fts = templateJson.features;
        properties.forEach((p, index) => {
            var foundFeature = false;
            fts.some((f) => {
                if (f.properties["Name"] === p[par1]) {
                    console.log(p[par1]);
                    if (inclTemplProps) {
                        for (var key in f.properties) {
                            if (!p.hasOwnProperty(key) && key !== "Name") { //Do not overwrite input data, only add new items
                                p[key] = f.properties[key];
                            }
                        }
                    }
                    var featureJson: IGeoJsonFeature = {
                        type: "Feature",
                        geometry: f.geometry,
                        properties: p
                    }
                    if (sensors.length > 0) {
                        featureJson["sensors"] = sensors[index];
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
        if (!properties) callback();
        properties.forEach((prop, index) => {
            var lat = prop[latString];
            var lon = prop[lonString];
            if (isNaN(lat) || isNaN(lon)) {
                console.log("Error: Not a valid coordinate ( " + lat + ", " + lon + ")");
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
        if (!properties) callback();
        //https://github.com/yuletide/node-proj4js-defs/blob/master/epsg.js
        //Proj4js.defs["EPSG:28992"] = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs";
        proj4.defs('RD', "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs");
        var converter = proj4('RD');
        properties.forEach((prop, index) => {
            var x = prop[rdX];
            var y = prop[rdY];
            if (isNaN(x) || isNaN(y)) {
                console.log("Error: Not a valid coordinate ( " + x + ", " + y + ")");
            } else {
                var wgs = converter.inverse({ x: x, y: y });
                //console.log(JSON.stringify(wgs));
                features.push(this.createFeature(wgs.x, wgs.y, prop, sensors[index] || {}));
            }
        });
        callback();
    }

    private createPointFeature(zipCode: string, houseNumber: string, bagOptions: IBagOptions, features: IGeoJsonFeature[], properties: IProperty[], propertyTypes: IPropertyType[], sensors: IProperty[], callback: Function) {
        if (!properties) callback();
        var todo = properties.length;
        properties.forEach((prop, index) => {
            if (prop.hasOwnProperty(zipCode) && typeof prop[zipCode] === 'string') {
                var zip = prop[zipCode].replace(/ /g, '');
                var nmb = prop[houseNumber];
                this.bag.lookupBagAddress(zip, nmb, bagOptions, (locations: Location[]) => {
                    //console.log(todo);
                    todo--;
                    if (!locations || locations.length === 0) {
                        console.log(`Cannot find location with zip: ${zip}, houseNumber: ${nmb}`);
                        this.featuresNotFound[`${zip}${nmb}`] = { zip: `${zip}`, number: `${nmb}` };
                    } else {
                        for (var key in locations[0]) {
                            if (key !== "lon" && key !== "lat") {
                                if (locations[0][key]) {
                                    prop[(key.charAt(0).toUpperCase() + key.slice(1))] = locations[0][key];
                                    this.createPropertyType(propertyTypes, (key.charAt(0).toUpperCase() + key.slice(1)), "BAG");
                                }
                            }
                        }
                        features.push(this.createFeature(locations[0].lon, locations[0].lat, prop, sensors[index] || {}));
                    }
                    if (todo <= 0) callback();
                });
            }
        });
    }

    private createFeature(lon: number, lat: number, properties: IProperty, sensors?: IProperty): IGeoJsonFeature {
        var gjson = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lon, lat]
            },
            properties: properties
        }
        if (Object.keys(sensors).length !== 0) {
            gjson["sensors"] = sensors;
        }
        return gjson;
    }

    private createPropertyType(propertyTypes: IPropertyType[], name: string, section?: string) {
        if (!name) return;
        var propertyTypeExists = false;
        propertyTypes.some((pt) => {
            if (pt.label.toLowerCase() === name.toLowerCase()) {
                propertyTypeExists = true;
                return true;
            } else {
                return false;
            }
        });
        if (propertyTypeExists) return;
        var propType: IPropertyType = {
            label: name,
            title: name,
            type: "text",
            visibleInCallOut: true,
            canEdit: true,
            isSearchable: false
        };
        if (section) propType["section"] = section;
        propertyTypes.push(propType);
    }

    private convertTime(date: string, time: string): number {
        if (date.length < 6) return 0;
        var year = Number(date.substr(0, 4));
        var month = Number(date.substr(4, 2));
        var day = Number(date.substr(6, 2));
        var d = new Date(0);
        d.setFullYear(year);
        d.setMonth(month - 1);
        d.setDate(day);
        //TODO: Take time into account
        var timeInMs = d.getTime();
        console.log("Converted " + date + " " + time + " to " + d.toDateString() + " (" + d.getTime() + " ms)");
        return timeInMs;
    }

    private convertDateProperties(propertyTypes: IPropertyType[], properties: IProperty[]) {
        if (!propertyTypes || !properties) return;
        propertyTypes.forEach((pt) => {
            if (pt.hasOwnProperty("type") && pt["type"] === "date") {
                var name = pt["label"]; //Store name of the property with type "date"
                properties.forEach((p) => {
                    if (p.hasOwnProperty(name)) {
                        var timeInMs = this.convertTime(p[name], ""); //TODO: Add Time compatibility
                        var d = new Date(timeInMs);
                        p[name] = d.toString();
                    }
                });
            }
        });
    }

    private convertTypes(propertyTypes: IPropertyType[], properties: IProperty[]) {
        if (!propertyTypes || !properties) return;
        propertyTypes.forEach((pt) => {
            if (pt.hasOwnProperty("type") && pt["type"] === "url") {
                var name = pt["label"]; //Store name of the property with type "url"
                properties.forEach((p) => {
                    if (p.hasOwnProperty(name)) {
                        if (p[name].substring(0, 3) === "www") {
                            p[name] = '[url=http://' + p[name] + ']' + p[name] + '[/url]';
                        } else {
                            p[name] = '[url=' + p[name] + ']' + p[name] + '[/url]';
                        }
                    }
                });
                pt["type"] = "bbcode";
            }
        });
    }

    private convertStringFormats(properties) {
        properties.forEach(function(prop) {
            if (prop.hasOwnProperty("stringFormat")) {
                switch (prop["stringFormat"]) {
                    case "No_decimals":
                        prop["stringFormat"] = "{0:#,#}";
                        break;
                    case "One_decimal":
                        prop["stringFormat"] = "{0:#,#.#}";
                        break;
                    case "Two_decimals":
                        prop["stringFormat"] = "{0:#,#.##}";
                        break;
                    case "Euro_no_decimals":
                        prop["stringFormat"] = "€{0:#,#}";
                        break;
                    case "Euro_two_decimals":
                        prop["stringFormat"] = "€{0:#,#.00}";
                        break;
                    case "Percentage_no_decimals":
                        prop["stringFormat"] = "{0:#,#}%";
                        break;
                    case "Percentage_one_decimal":
                        prop["stringFormat"] = "{0:#,#.#}%";
                        break;
                    case "Percentage_two_decimals":
                        prop["stringFormat"] = "{0:#,#.##}%";
                        break;
                    case "Percentage_four_decimals":
                        prop["stringFormat"] = "{0:#,#.####}%";
                        break;
                    default:
                        if ((prop["stringFormat"].indexOf('{') < 0) && (prop["stringFormat"].indexOf('}') < 0)) {
                            console.log("stringFormat \'" + prop["stringFormat"] + "\' not found.");
                        }
                        break;
                }
            }
        });
    }
}
