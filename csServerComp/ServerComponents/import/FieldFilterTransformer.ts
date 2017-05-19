import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import request                    = require("request");

var turf = require("turf");

class FieldFilterTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "FieldFilterTransformer";

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  geometry: any;

  filterProperty: string;
  filterValue: string | number | RegExp;

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt: transform.ITransformFactoryOptions, callback: (error)=>void) {
    var filterPropertyParameter = opt.parameters.filter((p)=>p.type.title == "property")[0];
    if (!filterPropertyParameter) {
      callback("property missing");
      return;
    }
    this.filterProperty = <string>filterPropertyParameter.value;

    var filterValueParameter = opt.parameters.filter((p)=>p.type.title == "value")[0];
    if (!filterValueParameter) {
      /*console.log("value missing");*/
      callback("value missing");
      return;
    }

    if (typeof filterValueParameter.value  === "string") {
      var strValue = <string>filterValueParameter.value;
      try {
        var regExp = new RegExp(strValue);
        this.filterValue = regExp;
        /*console.log(strValue + ": regex");*/
      } catch(error) {
        callback("Error parsing regex: " + strValue);
        return;
      }
    } else if (typeof filterValueParameter.value === "number") {
      this.filterValue = <number>filterValueParameter.value;
      console.log(strValue + ": number");
    }

    callback(null);
  }

  create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var baseGeo: any;

    t.setEncoding("utf8");
    (<any>t)._transform =  (chunk, encoding, done) => {
      // var startTs = new Date();
      // console.log((new Date().getTime() - startTs.getTime()) + ": start");
      var feature = JSON.parse(chunk);

      // console.log(this.filterProperty + "  - " + this.filterValue);

      if (<any>this.filterValue instanceof RegExp) {
        if ( (<string>feature.properties[this.filterProperty]).match(<RegExp>this.filterValue)) {
          // console.log(feature.properties[this.filterProperty] + " matches " + this.filterValue + " regex.")
          t.push(JSON.stringify(feature));
        } else {
          // console.log(feature.properties[this.filterProperty] + " does not match " + this.filterValue + " regex.")
        }
      } else if (<any>this.filterValue instanceof Number) {
        if (feature.properties[this.filterProperty] == this.filterValue) {
          // console.log(feature.properties[this.filterProperty] + " matches " + this.filterValue + " numerical.")
          t.push(JSON.stringify(feature));
        } else {
          // console.log(feature.properties[this.filterProperty] + " does not match " + this.filterValue + " numerical.")
        }
      }

      // console.log(feature);
      // var gemeentecode = feature.properties.gemeentecode;

      // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (pcNr > 1000 && pcNr < 1099)) { // Zorg Amsterdam
      // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (pcNr > 3500 && pcNr < 3585)) { // Zorg Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (gemeentecode == "0344")) { // Zorg Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(85)/) && (pcNr > 1000 && pcNr < 1099)) { // Onderwijs Amsterdam
      // if (feature.properties.HoofdactiviteitenCode.match(/^(85)/) && (pcNr > 3500 && pcNr < 3585)) { // Onderwijs Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(90|91)/) && (pcNr > 1000 && pcNr < 1099)) { // Cultuur Amsterdam
      // if (feature.properties.HoofdactiviteitenCode.match(/^(90|91)/) && (pcNr > 3500 && pcNr < 3585)) { // Cultuur Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(93)/) && (pcNr > 1000 && pcNr < 1099)) { // Sport en Recreatie Amsterdam
      // if (feature.properties.HoofdactiviteitenCode.match(/^(93)/) && (pcNr > 3500 && pcNr < 3585)) { // Sporten Recreatie Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) ) { // NL
        // t.push(JSON.stringify(feature));
      // }



/*
      if (pcNr > 3500 && pcNr < 3585) {
        t.push(JSON.stringify(feature));
      }
*/
      // console.log("=== After:");
      // console.log(feature);
      done();
      // console.log((new Date().getTime() - startTs.getTime()) + ": finish");
    };

    return t;
  }

}

export = FieldFilterTransformer;
