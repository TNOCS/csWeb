import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import BagDatabase = require("../database/BagDatabase");
import ConfigurationService = require('../configuration/ConfigurationService');
import IBagOptions          = require('../database/IBagOptions');
import Location             = require('../database/Location');

class BagDetailsTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "BagDetailsTransformer";

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

  create(config: ConfigurationService, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    if (!config) {
      console.error("Configuration service instance is required");
      return null;
    }

    var t = new stream.Transform();
    stream.Transform.call(t);

    var bagDb = new BagDatabase(config);

    t.setEncoding("utf8");
    t._transform =  (chunk, encoding, done) => {
      // console.log("##### BDT #####");

      // var startTs = new Date();
      // console.log((new Date().getTime() - startTs.getTime()) + ": start");

      var feature = JSON.parse(chunk);

      // console.log("=== Before: ===");
      // console.log(feature);

      var huisnummer = feature.properties.huisnummer;
      var postcode = feature.properties.postcode;

      if (!huisnummer || !postcode) {
        done();
        return;
      }

      try {
        // console.log("=== Query bag");
        bagDb.lookupBagAddress(postcode, huisnummer, IBagOptions.All, (addresses: Location[]) => {
          // console.log("=== Query bag result:");
          // console.log(addresses);
          if (!addresses || !(addresses[0]) ) {
            // console.log("Address not found: " + postcode + " " + huisnummer);
            done();
            return;
          }

          var firstAddress = addresses[0];

          // Add details to feature
          feature.geometry = {
            "type": "Point",
            "coordinates": [firstAddress.lon, firstAddress.lat]
          };

          feature.properties.woonplaats = firstAddress.woonplaatsnaam;
          feature.properties.gemeentenaam = firstAddress.gemeentenaam;
          feature.properties.provincienaam = firstAddress.provincienaam;

          // console.log("=== After: ===");
          // console.log(feature);

          t.push(JSON.stringify(feature));
          // console.log((new Date().getTime() - startTs.getTime()) + ": finish");

          done();
        });
      } catch(error) {
        console.log("Error querying bag: " + error);
      }
    };

    return t;
  }
}

export = BagDetailsTransformer;
