import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');

class GeoJsonFeaturesTransformer implements transform.ITransform {
    id:          string;
    description: string;
    type = "GeoJsonFeaturesTransformer";
    headers:string[] = null;
    /**
     * Accepted input types.
     */
    inputDataTypes:  transform.InputDataType[];
    /**
     * Generated output types.
     */
    outputDataTypes: transform.OutputDataType[];

    //create?(opt?: ITransformFactoryOptions[]): stream.Readable | stream.Writable | stream.Transform;

    constructor(public title: string) {
        this.id = Utils.newGuid();
        //this.description = description;
    }

    initialize(opt, callback){
      callback(null);
    }

    create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
      var t = new stream.Transform();
      /*stream.Transform.call(t);*/

      var split = -1;
      var headers :string[] = this.headers;

      t.setEncoding("utf8");
      t._transform = (chunk, encoding, done) => {
           /*console.log(chunk.toString("utf8"));*/

          var line :string= chunk.toString("utf8");

          if (!line || line.trim() == "") {
            console.log("Empty line, ignore");
            done();
            return;
          }

          try {
            // console.log("parse");
            // console.log(line);
            var geoJson = JSON.parse(line);
          }
          catch(err) {
            console.error("Error parsing input feature:" + err);
            done();
            return;
          }

          /*console.log(geoJson.features.length);*/
          if (geoJson.features.length > 0) {
            geoJson.features.forEach(f=>{
              t.push(JSON.stringify(f));
            });
          }

          done();
        }

    return t;
  }

}
export=GeoJsonFeaturesTransformer;
