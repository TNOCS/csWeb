require('rootpath')();
import express              = require('express');
import MessageBus           = require('ServerComponents/bus/MessageBus');
import pg                   = require('pg');
import ConfigurationService = require('ServerComponents/configuration/ConfigurationService');
import fs                   = require('fs');
import http                 = require('http');
import Location             = require('../database/Location');
import BagDatabase          = require('../database/BagDatabase');
import IBagOptions          = require('../database/IBagOptions');
import IGeoJsonFeature      = require('./IGeoJsonFeature');

interface ILayerDefinition {
    projectTitle:  string,
    reference:     string,
    group:         string,
    layerTitle:    string,
    description:   string,
    geometryType:  string,
    parameter1:    string,
    parameter2:    string,
    parameter3:    string,
    iconUri:       string,
    iconSize:      number,
    fillColor:     string,
    strokeColor:   string,
    strokeWidth:   number,
    isEnabled:     boolean,
    clusterLevel:  number,
    useClustering: boolean,
    opacity:       number,
    nameLabel:     string,
    includeOriginalProperties: boolean
}

interface ILayerTemplate {
    layerDefinition: ILayerDefinition[],
    propertyTypes:   csComp.Services.IPropertyType[],
    properties:      csComp.Services.IProperty[],
    sensors?:        csComp.Services.IProperty[]
}

/** A factory class to create new map layers based on input, e.g. from Excel */
class MapLayerFactory {

    templateFiles: csComp.Services.IProperty[];

    constructor(private bag: BagDatabase, private messageBus: MessageBus.MessageBusService) {
        var fileList: csComp.Services.IProperty[] = [];
        fs.readdir("public/data/templates", function (err, files) {
          if(err) {
            console.log("Error while looking for templates");
          } else {
            files.forEach((f) => {
              fileList[f.replace(/\.[^/.]+$/, "")] = ("public/data/templates/" + f); // Filter extension from key and store in dictionary
            });
          }
        });
        this.templateFiles = fileList;
    }

    public process(req: express.Request, res: express.Response) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('');
        console.log('Received project template. Processing...');
        var template: ILayerTemplate = req.body;
        var ld = template.layerDefinition[0];
        this.createMapLayer(template, (geojson) => {

            //if (!fs.existsSync("public/data/projects/DynamicExample")) fs.mkdirSync("public/data/projects/DynamicExample");
            //if (!fs.existsSync("public/data/projects/DynamicExample/" + ld.group)) fs.mkdirSync("public/data/projects/DynamicExample/" + ld.group);
            //fs.writeFileSync("public/data/projects/DynamicExample/" + ld.group + "/" + ld.layerTitle + ".json", JSON.stringify(geojson));

            var data = {
                project      : ld.projectTitle,
                layerTitle   : ld.layerTitle,
                description  : ld.description,
                reference    : ld.reference,
                clusterLevel : ld.clusterLevel,
                useClustering: ld.useClustering,
                group        : ld.group,
                geojson      : geojson,
                enabled      : ld.isEnabled };
            this.messageBus.publish('dynamic_project_layer', 'created', data);
        });
    }

    public createMapLayer(template: ILayerTemplate, callback: (Object) => void) {
        var ld = template.layerDefinition[0];
        var features: IGeoJsonFeature[] = [];
        // Convert StringFormats (from a readable key to StringFormat notation)
        this.convertStringFormats(template.propertyTypes);
        // Check propertyTypeData for time-based data
        var timestamps = this.convertTimebasedPropertyData(template);
        var geojson = {
            type: "FeatureCollection",
            featureTypes: {
                "Default": {
                    name: "Default",
                    style: {
                        iconUri:     ld.iconUri,
                        iconWidth:   ld.iconSize,
                        iconHeight:  ld.iconSize,
                        stroke:      ld.strokeWidth > 0,
                        strokeColor: ld.strokeColor || "#000",
                        fillColor:   ld.fillColor || "#ff0",
                        opacity:     ld.opacity || 0.5,
                        fillOpacity: ld.opacity || 0.5,
                        nameLabel:   ld.nameLabel
                    },
                    propertyTypeData: template.propertyTypes
                }
            },
            features: features
        };
        if (timestamps.length > 0) {
          geojson["timestamps"] = JSON.parse(JSON.stringify(timestamps));
        }
        // Convert dates (from a readable key to a JavaScript Date string notation)
        this.convertDateProperties(template.propertyTypes, template.properties);
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
            default:
                if(!ld.parameter1) {
                  console.log("Error: At least parameter1 should contain a value!")
                  return;
                }
                this.createPolygonFeature(ld.geometryType, ld.parameter1, ld.includeOriginalProperties, features,template.properties, template.propertyTypes, template.sensors || [], () => { callback(geojson) });
                break;
        }

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
      var propertyTypes: csComp.Services.IPropertyType[] = template.propertyTypes;
      if (!propertyTypes) return;
      var timestamps = [];
      var targetProperties = [];
      var realPropertyTypes:csComp.Services.IPropertyType[] = []; //Filter out propertyTypes that are actually a timestamp value
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
      var properties: csComp.Services.IProperty[] = template.properties;
      var realProperties: csComp.Services.IProperty[] = []; //To filter out properties that are actually a sensor value
      var realSensors: csComp.Services.IProperty[] = [];
      properties.forEach((p) => {
        var realProperty:csComp.Services.IProperty = {};
        var sensors: csComp.Services.IProperty = {};
        targetProperties.forEach((tp: string)=>{
          sensors[tp] = [];
        });
        for (var key in p) {
          if (p.hasOwnProperty(key)) {
            var itemName: string = key.substr(0, key.length-6);
            if (targetProperties.indexOf(itemName) >= 0) {
              sensors[itemName].push(p[key]);
            } else {
              realProperty[itemName] = p[key];
            }
          }
        }
        realSensors.push(sensors);
        realProperties.push(realProperty);
      });
      if (realSensors.length > 0) template.sensors = realSensors;
      template.properties = realProperties;
      return timestamps;
    }

    private createPolygonFeature(templateName:string, par1: string, inclTemplProps: boolean, features: IGeoJsonFeature[], properties: csComp.Services.IProperty[], propertyTypes: csComp.Services.IPropertyType[], sensors: csComp.Services.IProperty[], callback: Function) {
      if (!properties) callback();
      if (!this.templateFiles.hasOwnProperty(templateName)) {
        console.log("Error: could not find template: " + templateName);
        callback();
      }
      var templateUrl: string = this.templateFiles[templateName];
      var templateFile = fs.readFileSync(templateUrl);
      var templateJson = JSON.parse(templateFile.toString());

      if (inclTemplProps) {
        templateJson.featureTypes["Default"].propertyTypeData.forEach((ft) => {
          if (!properties[0].hasOwnProperty(ft.label) && ft.label !== "Name") { //Do not overwrite input data, only add new items
            propertyTypes.push(ft);
          }
        });
      }
      var fts = templateJson.features;
      properties.forEach((p, index) => {
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
            var featureJson : IGeoJsonFeature = {
        			type: "Feature",
        			geometry: f.geometry,
        			properties: p
        		}
            if (sensors.length > 0) {
              featureJson["sensors"] = sensors[index];
            }
            features.push(featureJson);
            return true;
          } else {
            return false;
          }
        })
      });
      callback();
    }

    private createLatLonFeature(latString: string, lonString: string, features: IGeoJsonFeature[], properties: csComp.Services.IProperty[], sensors: csComp.Services.IProperty[], callback: Function) {
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

    private createPointFeature(zipCode: string, houseNumber: string, bagOptions: IBagOptions, features: IGeoJsonFeature[], properties: csComp.Services.IProperty[], propertyTypes: csComp.Services.IPropertyType[], sensors: csComp.Services.IProperty[], callback: Function) {
        if (!properties) callback();
        var todo = properties.length;
        properties.forEach((prop, index) => {
            var zip = prop[zipCode].replace(/ /g, '');
            var nmb = prop[houseNumber];
            this.bag.lookupBagAddress(zip, nmb, bagOptions, (locations: Location[]) => {
                //console.log(todo);
                todo--;
                if (!locations || locations.length === 0) {
                    console.log(`Cannot find location with zip: ${zip}, houseNumber: ${nmb}`);
                } else {
                    for (var key in locations[0]) {
                      if (key !== "lon" && key !== "lat") {
                        if (locations[0][key]) {
                          prop[(key.charAt(0).toUpperCase()+key.slice(1))] = locations[0][key];
                          this.createPropertyType(propertyTypes, (key.charAt(0).toUpperCase()+key.slice(1)), "BAG");
                        }
                      }
                    }
                    features.push(this.createFeature(locations[0].lon, locations[0].lat, prop, sensors[index] || {}));
                }
                if (todo <= 0) callback();
            });
        });
    }

    private createFeature(lon: number, lat: number, properties: csComp.Services.IProperty, sensors?: csComp.Services.IProperty): IGeoJsonFeature {
        var gjson = {
                			type: "Feature",
                			geometry: {
                				type: "Point",
                				coordinates: [ lon, lat ]
                			},
                			properties: properties
                		}
        if (sensors !== {}) {
          gjson["sensors"] = sensors;
        }
        return gjson;
    }

    private createPropertyType(propertyTypes: csComp.Services.IPropertyType[], name: string, section?: string) {
      if(!name) return;
      var propertyTypeExists = false;
      propertyTypes.some((pt) => {
        if (pt.label.toLowerCase() === name.toLowerCase()) {
          propertyTypeExists = true;
          return true;
        } else {
          return false;
        }
      });
      if(propertyTypeExists) return;
      var propType: csComp.Services.IPropertyType  = {
                    label: name,
                    titel: name,
                    type: "text",
                    visibleInCallOut: true,
                    canEdit: true,
                    isSearchable: false
                  };
      if (section) propType["section"] = section;
      propertyTypes.push(propType);
    }

    private convertTime(date: string, time: string) : number{
      if (date.length < 6) return 0;
      var year = Number(date.substr(0,4));
      var month = Number(date.substr(4,2));
      var day = Number(date.substr(6,2));
      var d = new Date(0);
      d.setFullYear(year);
      d.setMonth(month-1);
      d.setDate(day);
      //TODO: Take time into account
      var timeInMs = d.getTime();
      console.log("Converted " + date + " " + time + " to " + d.toDateString() + " (" + d.getTime() + " ms)");
      return timeInMs;
    }

    private convertDateProperties(propertyTypes: csComp.Services.IPropertyType[], properties: csComp.Services.IProperty[]){
      if (!propertyTypes || ! properties) return;
      propertyTypes.forEach((pt) => {
        if (pt.hasOwnProperty("type") && pt["type"] === "date") {
          var name = pt["title"]; //Store name of the property with type "date"
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

    private convertStringFormats(properties) {
      properties.forEach(function (prop) {
        if (prop.hasOwnProperty("stringFormat")) {
          switch (prop["stringFormat"]) {
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
            default:
              console.log("stringFormat \'" + prop["stringFormat"] + "\' not found.");
              break;
          }
        }
      });
    }
}
export = MapLayerFactory;
