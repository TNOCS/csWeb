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

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(callback: (error)=>void) {
      callback(null);
  }

  create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    stream.Transform.call(t);

    var baseGeo: any;

    t.setEncoding("utf8");
    t._transform =  (chunk, encoding, done) => {
      // var startTs = new Date();
      // console.log((new Date().getTime() - startTs.getTime()) + ": start");
      var feature = JSON.parse(chunk);

      var pcNr = 0;
      try {
        pcNr = parseInt(feature.properties.postcode.slice(0,4));
      }
      catch(err){
        done();
        return;
      }

      // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (pcNr > 1000 && pcNr < 1099)) { // Zorg Amsterdam
      // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) && (pcNr > 3500 && pcNr < 3585)) { // Zorg Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(85)/) && (pcNr > 1000 && pcNr < 1099)) { // Onderwijs Amsterdam
      // if (feature.properties.HoofdactiviteitenCode.match(/^(85)/) && (pcNr > 3500 && pcNr < 3585)) { // Onderwijs Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(90|91)/) && (pcNr > 1000 && pcNr < 1099)) { // Cultuur Amsterdam
      // if (feature.properties.HoofdactiviteitenCode.match(/^(90|91)/) && (pcNr > 3500 && pcNr < 3585)) { // Cultuur Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(93)/) && (pcNr > 1000 && pcNr < 1099)) { // Sport en Recreatie Amsterdam
      if (feature.properties.HoofdactiviteitenCode.match(/^(93)/) && (pcNr > 3500 && pcNr < 3585)) { // Sporten Recreatie Utrecht
      // if (feature.properties.HoofdactiviteitenCode.match(/^(86|87|88)/) ) { // NL
        t.push(JSON.stringify(feature));
      }



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
