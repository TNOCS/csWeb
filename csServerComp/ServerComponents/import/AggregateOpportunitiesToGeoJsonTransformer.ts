import Utils     = require('../helpers/Utils');
import transform = require('./ITransform');
import stream  = require('stream');
import request                    = require('request');
var turf = require('turf');

class AggregateOpportunitiesToGeoJsonTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = 'AggregateOpportunitiesToGeoJsonTransformer';

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  geometry: any;
  keyProperty: string;

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt: transform.ITransformFactoryOptions, callback: (error) => void) {
    var urlParameter = opt.parameters.filter((p) => p.type.title === 'aggregateShapeUrl')[0];
    if (!urlParameter) {
      callback('opportunitiesUrl missing');
      return;
    }

    var parameter = opt.parameters.filter(p => p.type.title === 'keyProperty')[0];
    if (!parameter) {
      callback('keyProperty missing');
      return;
    }
    this.keyProperty = <string>parameter.value;

    request({ url: <string>urlParameter.value }, (error, response, body) => {
      if (error) {
        callback(error);
        return;
      }
      this.geometry = JSON.parse(body);
      console.log('Geojson loaded: ' + this.geometry.features.length + ' features');

      callback(null);
    });
  }

  create(config, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var accumulator: any = {};
    var index = 0;

    t.setEncoding('utf8');
    (<any>t)._transform =  (chunk, encoding, done) => {
       var startTs = new Date();
       /*console.log((new Date().getTime() - startTs.getTime()) + ": start");*/
      /*console.log("##### GJAT #####");*/

      if (!this.geometry) {
        console.log('No target geometry found');
        done();
        return;
      }

      var feature = JSON.parse(chunk);

      /*console.log("Start aggregation");*/

      var found = false;
      this.geometry.features.forEach(f => {
        if (found) return;

        if (turf.inside(feature, f)) {
          var keyValue = f.properties[this.keyProperty];
          var accEntry = accumulator[keyValue];

          if (accEntry) {
            accEntry.kans_min = Math.min(accEntry.kans_min, feature.properties.kans);
            accEntry.kans_max = Math.max(accEntry.kans_max, feature.properties.kans);
            accEntry.kans_totaal += feature.properties.kans;

            accEntry.brutoOmvang_min = Math.min(accEntry.brutoOmvang_min, feature.properties.brutoOmvang);
            accEntry.brutoOmvang_max = Math.max(accEntry.brutoOmvang_max, feature.properties.brutoOmvang);
            accEntry.brutoOmvang_totaal += feature.properties.brutoOmvang;

            var nettoOmvang = feature.properties.brutoOmvang * feature.properties.kans;

            accEntry.nettoOmvang_min = Math.min(accEntry.nettoOmvang_min, nettoOmvang);
            accEntry.nettoOmvang_max = Math.max(accEntry.nettoOmvang_max, nettoOmvang);
            accEntry.nettoOmvang_totaal += nettoOmvang;

            if (feature.properties.OpportunityManager && accEntry.opportunityManagers.indexOf(feature.properties.OpportunityManager) < 0) {
              accEntry.opportunityManagers.push(feature.properties.OpportunityManager);
            }

            accEntry.aantalOpportunities++;
          } else {
            accEntry = {feature: f};

            accEntry.kans_totaal = accEntry.kans_max = accEntry.kans_min = feature.properties.kans;
            accEntry.brutoOmvang_totaal = accEntry.brutoOmvang_max = accEntry.brutoOmvang_min = feature.properties.brutoOmvang;

            var nettoOmvang = feature.properties.brutoOmvang * feature.properties.kans;
            accEntry.nettoOmvang_min = accEntry.nettoOmvang_max = accEntry.nettoOmvang_totaal = nettoOmvang;

            accEntry.opportunityManagers = [feature.properties.OpportunityManager];

            accEntry.aantalOpportunities = 1;

            accumulator[keyValue] = accEntry;
          }
          found = true;

        }
      });

      if (!found) {
        console.log('feature ' + feature.properties.name + ' could not be aggregated, town: ' + feature.properties.town + '. ' + feature.geometry.coordinates);
      }

      /*console.log("Aggregation finished");*/

      // console.log("=== After:");
      // console.log(feature);

      //t.push(JSON.stringify(feature));
      done();
      /*console.log((new Date().getTime() - startTs.getTime()) + ": finish " + index++);*/
    };

    (<any>t)._flush = (done) => {
      try {
        console.log('#### start AOTGJT flush');
        /*console.log(accumulator);*/

        for (var key in accumulator) {
          console.log(key);
          var featureAcc = accumulator[key];
          /*console.log ("#### push feature");*/
          /*console.log(featureAcc);*/

          /*console.log("kans");*/
          featureAcc.feature.properties.kans_min = featureAcc.kans_min;
          featureAcc.feature.properties.kans_max = featureAcc.kans_max;
          featureAcc.feature.properties.kans_totaal = featureAcc.kans_totaal;
          featureAcc.feature.properties.kans_gemiddeld = featureAcc.kans_totaal / featureAcc.aantalOpportunities;

          /*console.log("brutoOmvang");*/
          featureAcc.feature.properties.brutoOmvang_min = featureAcc.brutoOmvang_min;
          featureAcc.feature.properties.brutoOmvang_max = featureAcc.brutoOmvang_max;
          featureAcc.feature.properties.brutoOmvang_totaal = featureAcc.brutoOmvang_totaal;
          featureAcc.feature.properties.brutoOmvang_gemiddeld = featureAcc.brutoOmvang_totaal / featureAcc.aantalOpportunities;

          /*console.log("nettoOmvang");*/
          featureAcc.feature.properties.nettoOmvang_min = featureAcc.nettoOmvang_min;
          featureAcc.feature.properties.nettoOmvang_max = featureAcc.nettoOmvang_max;
          featureAcc.feature.properties.nettoOmvang_totaal = featureAcc.nettoOmvang_totaal;
          featureAcc.feature.properties.nettoOmvang_gemiddeld = featureAcc.nettoOmvang_totaal / featureAcc.aantalOpportunities;

          featureAcc.feature.properties.opportunityManagers = featureAcc.opportunityManagers;

          featureAcc.feature.properties.aantalOpportunities = featureAcc.aantalOpportunities;

          /*console.log(JSON.stringify(featureAcc.feature));*/

          t.push(JSON.stringify(featureAcc.feature));
        }
        done();
      } catch (error) {
        console.log('Agg error: ' + error);
        done();
      }
    };

    return t;
  }

}

export = AggregateOpportunitiesToGeoJsonTransformer;
