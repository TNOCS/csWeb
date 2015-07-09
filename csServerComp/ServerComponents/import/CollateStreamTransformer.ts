import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');

class CollateStreamTransformer implements transform.ITransform {
    id:          string;
    description: string;
    type = "CollateStreamTransformer";
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

    initialize(){

    }

    create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
      var t = new stream.Transform();
      /*stream.Transform.call(t);*/

      var split = -1;
      var buffer = "";

      t.setEncoding("utf8");
      t._transform = (chunk, encoding, done) => {
          // console.log("##### CST #####");

          var strChunk :string= chunk.toString("utf8");
          buffer += strChunk;

          done();
        }

      t._flush = (done) => {
        try {
           /*console.log("push buffer: ");*/
           /*console.log(buffer);*/
          if (buffer) {
            t.push(buffer);
            buffer = null;
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
export=CollateStreamTransformer;
