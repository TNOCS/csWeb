import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');

var splitStream = require("split");

class CsvToJsonTransformer implements transform.ITransform {
    id:          string;
    description: string;
    type = "CsvToJsonTransformer";
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

    fieldDelimiter:string;
    textQualifier:string;
    latField:string;
    longField:string;

    constructor(public title: string) {
        this.id = Utils.newGuid();
        //this.description = description;
    }

    initialize(opt, callback) {
      var propertyParameter = opt.parameters.filter((p)=>p.type.title == "fieldDelimiter")[0];
      if (propertyParameter) {
        this.fieldDelimiter = propertyParameter.value;
      }

      propertyParameter = opt.parameters.filter((p)=>p.type.title == "textQualifier")[0];
      if (propertyParameter) {
        this.textQualifier = propertyParameter.value;
      }

      propertyParameter = opt.parameters.filter((p)=>p.type.title == "latField")[0];
      if (propertyParameter) {
        this.latField = propertyParameter.value;
      }

      propertyParameter = opt.parameters.filter((p)=>p.type.title == "longField")[0];
      if (propertyParameter) {
        this.longField = propertyParameter.value;
      }

      callback(null);
    }

    create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
      var t = new stream.Transform();
      /*stream.Transform.call(t);*/

      var split = -1;
      var headers :string[];

      t.setEncoding("utf8");

      t._transform = (chunk, encoding, done) => {
           /*console.log("##### CTJT #####");*/
          // console.log(chunk.toString("utf8"));

          var line :string= chunk.toString("utf8");

          if (!line || line.trim() == "") {
            console.log("Empty line, ignore");
            done();
            return;
          }

          var textQualifierRegExp = new RegExp("(?:\\s*(?:" + this.textQualifier + "([^" + this.textQualifier + "]*)" + this.textQualifier + "|([^" + this.fieldDelimiter + "]+))?\\s*" + this.fieldDelimiter + "?)+?","g");
          var fields:any[] = [];
          var result:RegExpExecArray;
          var prevIndex = -1;
          while ((result = textQualifierRegExp.exec(line)).index > prevIndex) {
            var strValue: string = '';
            if (result[1] && result[1].length > 0) {
              strValue = result[1];
            } else if (result[2] && result[2].length > 0) {
              strValue = result[2];
            }

              /*console.log("Number: '" + strValue + "': " + /^\-?[0-9]*(,|\.)?[0-9]+$/.test(strValue));*/
            if (/^\-?[0-9]*(,|\.)?[0-9]+$/.test(strValue)) {
              fields.push(parseInt(strValue.replace(/,/,'.')));
            }
            else {
              fields.push(strValue);
            }

            prevIndex = result.index;
          }

          /*var fields = line.split(this.fieldDelimiter);*/
          // console.log(line);

          if (!headers) {
            headers = [];
            fields.filter(f=>f && f!='').forEach(f=>{
              headers.push(f.toString());
            });
            console.log(headers);
            done();
            return;
          }
          else {
            var obj:any = {type:"Feature", properties:{}};

            headers.forEach(h=>{
              var hIndex = headers.indexOf(h);
              obj.properties[h] = fields[hIndex];
            })

            /*console.log(obj);*/

            if (this.latField && this.longField && !obj.geometry) {
              var strLat:string = obj.properties[this.longField];
              var strLong:string = obj.properties[this.latField];
              strLat = strLat.replace(/,/g,'.');
              strLong = strLong.replace(/,/g,'.');
              var lat = parseFloat(strLat);
              var long = parseFloat(strLong);

              /*console.log(lat + " - " + long);*/


              obj.geometry = {
                type: "Point",
                coordinates: [lat, long]
              }

            }

            // console.log(obj);
            t.push(JSON.stringify(obj));
            done();
          }
        }

    //var s = splitStream().pipe(t);

    return t;
  }

}
export=CsvToJsonTransformer;
