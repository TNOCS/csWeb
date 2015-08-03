import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');

var turf = require("turf");

class FieldSplitTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "FieldSplitTransformer";

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  keyProperty: string;

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt: transform.ITransformFactoryOptions, callback: (error)=>void) {
    /*console.log(JSON.stringify(opt,null,4));*/

    var keyPropertyParameter = opt.parameters.filter(p=>p.type.title == "keyProperty")[0];
    if (!keyPropertyParameter) {
      callback("keyProperty missing")
      return;
    }
    this.keyProperty = <string>keyPropertyParameter.value;

      callback(null);
  }

  create(config, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var accumulator:any = {};

    t.setEncoding("utf8");
    var index = 0;
    t._transform =  (chunk, encoding, done) => {
       /*var startTs = new Date();*/
       /*console.log((new Date().getTime() - startTs.getTime()) + ": start");*/
       /*console.log(index++);*/
      var feature = JSON.parse(chunk);

      var keyValue = feature.properties[this.keyProperty];

      var accEntry = accumulator[keyValue];
      if (accEntry) {
        accEntry.push(feature);
      }
      else {
        accEntry = [feature];
        accumulator[keyValue] = accEntry;
      }
      done();
    };

    t._flush = (done) => {
      try {

        var keys = Object.keys(accumulator);

        keys.forEach(key=> {
          /*console.log(key);*/
          var group = accumulator[key];

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

export = FieldSplitTransformer;
