import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');

class SplitAdresTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "SplitAdresTransformer";

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(){

  }

  create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    stream.Transform.call(t);

    t.setEncoding("utf8");
    t._transform =  (chunk, encoding, done) => {
      var feature = JSON.parse(chunk);

      // console.log("##### SAT #####");
      // console.log("=== Before:")
      // console.log(feature);

      var adres:string = feature.adres;
      var pc_plaats:string = feature.pc_plaats;

      var street = adres.slice(0,adres.search(/\d/)).trim();
      var addressNumberWithAddition = adres.slice(adres.search(/\d/)).trim();
      var strAddressNumber = addressNumberWithAddition.slice(0,addressNumberWithAddition.search(/\D/)).trim();
      var addressNumber = parseInt(strAddressNumber);

      feature.straat = street;
      feature.huisnummer = addressNumber;

      var pcPlaats = feature.pc_plaats;
      var postcode = pcPlaats.slice(0,7);

      feature.postcode = postcode;

      t.push(JSON.stringify(feature));

      // console.log("=== After:");
      // console.log(feature);

      done();
    };

    return t;
  }

}

export = SplitAdresTransformer;
