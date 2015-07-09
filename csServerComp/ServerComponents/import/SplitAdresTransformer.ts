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

  streetHouseNumberProperty: string;
  zipcodeCityProperty: string;

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt?: transform.ITransformFactoryOptions, callback?: (error)=>void) {
    var zipcodeCityPropertyParameter = opt.parameters.filter(p=>p.type.title == "zipcodeCityProperty")[0];
    if (zipcodeCityPropertyParameter) {
      this.zipcodeCityProperty = <string>zipcodeCityPropertyParameter.value;
    }

    var streetHouseNumberPropertyParameter = opt.parameters.filter(p=>p.type.title == "streetHouseNumberProperty")[0];
    if (streetHouseNumberPropertyParameter) {
      this.streetHouseNumberProperty = <string>streetHouseNumberPropertyParameter.value;
    }

    if (callback) {
      callback(null);
    }
  }

  create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    t.setEncoding("utf8");
    t._transform =  (chunk, encoding, done) => {
      var feature = JSON.parse(chunk);

      // console.log("##### SAT #####");
      // console.log("=== Before:")
      // console.log(feature);

      if (this.streetHouseNumberProperty) {
        var adres:string = feature.properties[this.streetHouseNumberProperty];
        // console.log(this.streetHouseNumberProperty + ": " + adres);

        var street = adres.slice(0,adres.search(/\d/)).trim();
        var addressNumberWithAddition = adres.slice(adres.search(/\d/)).trim();
        var strAddressNumber = addressNumberWithAddition.slice(0,addressNumberWithAddition.search(/\D/)).trim();
        var addressNumber = parseInt(strAddressNumber);
        feature.straat = street;
        feature.properties.huisnummer = addressNumber;
      }

      if (this.zipcodeCityProperty) {
        var pc_plaats:string = feature.properties[this.zipcodeCityProperty];
        var postcode = pc_plaats.slice(0,7);
        feature.properties.postcode = postcode;
      }


      t.push(JSON.stringify(feature));

      // console.log("=== After:");
      // console.log(feature);

      done();
    };

    return t;
  }

}

export = SplitAdresTransformer;
