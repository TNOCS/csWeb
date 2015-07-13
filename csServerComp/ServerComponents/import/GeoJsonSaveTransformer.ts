import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import request                    = require("request");
import fs                    = require("fs");

var turf = require("turf");

class GeoJsonSaveTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "GeoJsonSaveTransformer";

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  targetFolder: string;
  filenameKey: string;
  filename:string;

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt: transform.ITransformFactoryOptions, callback: (error)=>void) {
    var keyPropertyParameter = opt.parameters.filter(p=>p.type.title == "filenameKeyProperty")[0];
    if (keyPropertyParameter) {
      this.filenameKey = <string>keyPropertyParameter.value;
    }

    var filenameParameter = opt.parameters.filter(p=>p.type.title == "filename")[0];
    if (filenameParameter) {
      this.filename = <string>filenameParameter.value;
    }

    var targetFolderParameter = opt.parameters.filter(p=>p.type.title == "targetFolder")[0];
    if (targetFolderParameter) {
      this.targetFolder = <string>targetFolderParameter.value;
    }

    if (!this.filename && !this.filenameKey) {
      callback("Either filename or filenameKey must be specified");
      return
    }

    callback(null);
  }

  create(config, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

var index = 0;
    t.setEncoding("utf8");
    t._transform =  (chunk, encoding, done) => {
       var startTs = new Date();
      // console.log((new Date().getTime() - startTs.getTime()) + ": start");
      /*console.log(index++);*/
      var featureCollection = JSON.parse(chunk);

       /*console.log("##### GJST #####");*/
      // console.log("=== Before:")
      // console.log(feature);

      var filename = this.filename;
      if (this.filenameKey) {
        filename = featureCollection.features[0].properties[this.filenameKey] + ".json";
        filename = filename.replace(/[\/\\\|&;\$%@"<>\(\)\+,]/g, "");
      }


      if (!fs.existsSync(this.targetFolder)) {
        console.log("Folder does not exist, create " + this.targetFolder);
        fs.mkdirSync(this.targetFolder);
      }

      var outputStream = fs.createWriteStream(this.targetFolder + '/' + filename)
      outputStream.write(chunk);
      outputStream.close();
      console.log("Output written to " +this.targetFolder + "/" + filename );

      // console.log("=== After:");
      // console.log(feature);

      t.push(JSON.stringify(featureCollection));

      done();
    };

    return t;
  }

}

export = GeoJsonSaveTransformer;
