import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import request                    = require("request");

var turf = require("turf");

class GeoJsonAggregateTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "GeoJsonAggregateTransformer";

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

  initialize(opt: transform.ITransformFactoryOptions[], callback: (error)=>void) {
    request({ url: "http://localhost:3456/data/wijk-empty.geojson" }, (error, response, body)=>{
      if (error) {
        callback(error);
        return;
      }

      console.log("Gemeente geojson loaded");
      this.geometry = JSON.parse(body);

      callback(null);
    });
  }

  create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var baseGeo: any;

    var accumulator:any = {};

    t.setEncoding("utf8");
    t._transform =  (chunk, encoding, done) => {
      // var startTs = new Date();
      // console.log((new Date().getTime() - startTs.getTime()) + ": start");
      var feature = JSON.parse(chunk);

      if (!feature.geometry) {
        done();
        return;
      }

      // console.log("##### GJAT #####");
      // console.log("=== Before:")
      // console.log(feature);

      this.geometry.features.forEach((f)=>{
        // console.log("=== Gemeente feature:")
        // console.log(f);
        // console.log("=== Piped feature:");
        // console.log(feature);
        if (turf.inside(feature, f)) {
          // console.log(f);
          // console.log(feature.properties.gemeentenaam + "<-- matched -->" + f.properties.wk_naam);
          var accEntry = accumulator[f.properties.wk_code];
          // console.log(accEntry);
          if (accEntry) {
            accEntry.sum++;
          }
          else {
            accEntry = {
              feature: f,
              sum:1
            }
            accumulator[f.properties.wk_code] = accEntry;
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
        console.log("#### start GJAT flush")

        for(var wijkCode in accumulator) {
          var wijkAcc = accumulator[wijkCode];
          console.log ("#### push wijk");
          console.log(wijkAcc);
          wijkAcc.feature.properties.total = wijkAcc.sum;
          t.push(JSON.stringify(wijkAcc.feature));
        }
        done();
      }
      catch(error) {
        done();
      }
    }

    return t;
  }

}

export = GeoJsonAggregateTransformer;
