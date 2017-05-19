import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import request                    = require("request");

class AggregateOpportunitiesToOrganisationTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "AggregateOpportunitiesToOrganisationTransformer";

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

  initialize(opt: transform.ITransformFactoryOptions, callback: (error)=>void) {
    var urlParameter = opt.parameters.filter((p)=>p.type.title == "opportunitiesUrl")[0];
    if (!urlParameter) {
      callback("opportunitiesUrl missing");
      return;
    }

    var parameter = opt.parameters.filter(p=>p.type.title == "keyProperty")[0];
    if (!parameter) {
      callback("keyProperty missing")
      return;
    }
    this.keyProperty = <string>parameter.value;

    request({ url: <string>urlParameter.value }, (error, response, body)=>{
      if (error) {
        callback(error);
        return;
      }

      this.geometry = JSON.parse(body);
      console.log("Opportunity Geojson loaded: " + this.geometry.features.length + " features");

      callback(null);
    });


  }

  create(config, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var index = 0;

    t.setEncoding("utf8");
    (<any>t)._transform =  (chunk, encoding, done) => {
       var startTs = new Date();
       /*console.log((new Date().getTime() - startTs.getTime()) + ": start");*/
      /*console.log("##### GJAT #####");*/

      if (!this.geometry) {
        console.log("No target geometry found");
        done();
        return;
      }

      var feature = JSON.parse(chunk);

      console.log("Start aggregation");
      var organisatieOpportunities :any[] = this.geometry.features.filter(f=>f.properties[this.keyProperty] == feature.properties[this.keyProperty]);
      var aggregateProperties = organisatieOpportunities.map((value: any, index: number, array: any[]) => {
        var brutoOmvang = value.properties.brutoOmvang;
        var kans = value.properties.kans;
        return {
          kans: kans,
          brutoOmvang: brutoOmvang,
          nettoOmvang: brutoOmvang * (kans / 100),
          opportunityManager: value.properties.OpportunityManager
        }
      });

      var aggregatedOpportunities = aggregateProperties.reduce((previousValue: any, currentValue: any, currentIndex: number, array: any[]) => {
        previousValue.kans_min = Math.min(previousValue.kans_min, currentValue.kans);
        previousValue.kans_max = Math.max(previousValue.kans_max, currentValue.kans);
        previousValue.kans_totaal += currentValue.kans;

        previousValue.brutoOmvang_min = Math.min(previousValue.brutoOmvang_min, currentValue.brutoOmvang);
        previousValue.brutoOmvang_max = Math.max(previousValue.brutoOmvang_max, currentValue.brutoOmvang);
        previousValue.brutoOmvang_totaal += currentValue.brutoOmvang;

        previousValue.nettoOmvang_min = Math.min(previousValue.nettoOmvang_min, currentValue.nettoOmvang);
        previousValue.nettoOmvang_max = Math.max(previousValue.nettoOmvang_max, currentValue.nettoOmvang);
        previousValue.nettoOmvang_totaal += currentValue.nettoOmvang;

        if (currentValue.opportunityManager && previousValue.opportunityManagers.indexOf(currentValue.opportunityManager) < 0) {
          previousValue.opportunityManagers.push(currentValue.opportunityManager);
        }

        previousValue.aantalOpportunities++;

        return previousValue;

      }, {
          kans_min: Number.MAX_VALUE,
          kans_max: Number.MIN_VALUE,
          kans_totaal: 0,
          brutoOmvang_min: Number.MAX_VALUE,
          brutoOmvang_max: Number.MIN_VALUE,
          brutoOmvang_totaal: 0,
          nettoOmvang_min: Number.MAX_VALUE,
          nettoOmvang_max: Number.MIN_VALUE,
          nettoOmvang_totaal: 0,
          aantalOpportunities: 0,
          opportunityManagers: [],

      });

      aggregatedOpportunities.kans_gemiddeld = aggregatedOpportunities.kans_totaal / aggregatedOpportunities.aantalOpportunities;
      aggregatedOpportunities.brutoOmvang_gemiddeld = aggregatedOpportunities.brutoOmvang_totaal / aggregatedOpportunities.aantalOpportunities;
      aggregatedOpportunities.nettoOmvang_gemiddeld = aggregatedOpportunities.nettoOmvang_totaal / aggregatedOpportunities.aantalOpportunities;

      console.log("Aggregation finished");
      console.log(aggregatedOpportunities);

      for(var field in aggregatedOpportunities) {
        feature.properties[field] = aggregatedOpportunities[field];
      }

      /*console.log(feature.properties);*/

      t.push(JSON.stringify(feature));

      // console.log("=== After:");
      // console.log(feature);

      //t.push(JSON.stringify(feature));
      done();
      /*console.log((new Date().getTime() - startTs.getTime()) + ": finish " + index++);*/
    };

    return t;
  }

}

export = AggregateOpportunitiesToOrganisationTransformer;
