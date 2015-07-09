import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import request                    = require("request");

var turf = require("turf");

class GeoJsonOutputTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "GeoJsonOutputTransformer";

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  geoJson:any[] = [];

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt?: transform.ITransformFactoryOptions[], callback?: (error)=>void) {
    if (callback) {
      callback(null);
    }
  }

  create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    stream.Transform.call(t);

    t.setEncoding("utf8");
    t._transform =  (chunk, encoding, done) => {
      // var startTs = new Date();
      // console.log((new Date().getTime() - startTs.getTime()) + ": start");
      var feature = JSON.parse(chunk);

      // console.log("##### GJOT #####");
      // console.log("=== Before:")
      // console.log(feature);

      this.geoJson.push(feature);

      // console.log("=== After:");
      // console.log(feature);

      done();
      // console.log((new Date().getTime() - startTs.getTime()) + ": finish");
    };

    t._flush = (done) => {
      try {
        console.log("#### start GJOT flush")
        var result = {
          type: "FeatureCollection",
          features: this.geoJson
        };

        console.log ("nFeatures: " + result.features.length);
        var strResult = JSON.stringify(result);
        // console.log(result);
        t.push(strResult);

        done();
      }
      catch(error) {
        console.log("#### GJOT flush error: " + error);
        done();
      }
    }

    return t;
  }

}

export = GeoJsonOutputTransformer;
