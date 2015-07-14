import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import request                    = require("request");

var turf = require("turf");

class GeoJsonSplitTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "GeoJsonSplitTransformer";

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  geometry: any;
  keyProperty: string;
  identifierProperty: string;

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt: transform.ITransformFactoryOptions, callback: (error)=>void) {
    /*console.log(JSON.stringify(opt,null,4));*/

    var splitShapeUrlParameter = opt.parameters.filter((p)=>p.type.title == "splitShapeUrl")[0];
    if (!splitShapeUrlParameter) {
      callback("splitShapeUrl missing");
      return;
    }

    var keyPropertyParameter = opt.parameters.filter(p=>p.type.title == "splitShapeKeyProperty")[0];
    if (!keyPropertyParameter) {
      callback("splitShapeKeyProperty missing")
      return;
    }
    this.keyProperty = <string>keyPropertyParameter.value;

    var identifierPropertyParameter = opt.parameters.filter(p=>p.type.title == "splitShapeIdentifierProperty")[0];
    if (!identifierPropertyParameter) {
      callback("splitShapeIdentifierProperty missing")
      return;
    }
    this.identifierProperty = <string>identifierPropertyParameter.value;

    request({ url: <string>splitShapeUrlParameter.value }, (error, response, body)=>{
      if (error) {
        callback(error);
        return;
      }

      this.geometry = JSON.parse(body);
      console.log("Split shape geojson loaded");

      callback(null);
    });

  }

  create(config, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var baseGeo: any;

    var accumulator:any = {};

    t.setEncoding("utf8");
    var index = 0;
    t._transform =  (chunk, encoding, done) => {
       /*var startTs = new Date();*/
       /*console.log((new Date().getTime() - startTs.getTime()) + ": start");*/
       /*console.log(index++);*/
      var feature = JSON.parse(chunk);

      if (!feature.geometry) {
        console.log("No geometry");
        done();
        return;
      }

       /*console.log("##### GJST #####");*/
      // console.log("=== Before:")
      // console.log(feature);



      this.geometry.features.forEach((f)=>{
        // console.log("=== Gemeente feature:")
        // console.log(f);
        // console.log("=== Piped feature:");
        // console.log(feature);
        if (turf.inside(feature, f)) {
          // console.log(feature.properties.Gemeente + "<-- matched -->" + f.properties.Name);
          // feature.properties.wk_code = f.properties.wk_code;
          // feature.properties.wk_naam = f.properties.wk_naam;
          //feature.properties.Gemeente = f.properties.Name;

          feature.properties[this.identifierProperty] = f.properties[this.keyProperty];

          var accEntry = accumulator[f.properties[this.keyProperty]];
          if (accEntry) {
            accEntry.push(feature);
          }
          else {
            accEntry = [feature];
            accumulator[f.properties[this.keyProperty]] = accEntry;
          }
        }
      });

      // console.log("=== After:");
      // console.log(feature);

      //t.push(JSON.stringify(feature));
      done();
      // console.log((new Date().getTime() - startTs.getTime()) + ": finish");
    };
    t._flush = (done) => {
      try {

        var keys = Object.keys(accumulator);
         /*console.log(JSON.stringify(keys));*/
        // for(var wijkCode in keys) {
        /*console.log(keys.length);*/
        keys.forEach(key=> {
          /*console.log(key);*/
          var group = accumulator[key];
          // console.log ("#### push wijk: " + wijkCode + " - " + wijkFeatures.length + " features");

          // console.log(wijkAcc);
          var groupGeoJson = {
            type: "FeatureCollection",
            features: group
          };
          t.push(JSON.stringify(groupGeoJson));
        });
        done();
      }
      catch(error) {
        console.error(error);
        done();
      }
    }

    return t;
  }

}

export = GeoJsonSplitTransformer;
