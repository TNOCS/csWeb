import Utils     = require("../helpers/Utils");
import transform = require("./ITransform");
import stream  = require('stream');
import request                    = require("request");

var turf = require("turf");

class BushalteAggregateTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = "BushalteAggregateTransformer";

  /**
   * Accepted input types.
   */
  inputDataTypes:  transform.InputDataType[];
  /**
   * Generated output types.
   */
  outputDataTypes: transform.OutputDataType[];

  geometry: any;
  aggregateShapeUrl: string;
  aggregateShapeKeyProperty: string;

  constructor(public title: string) {
      this.id = Utils.newGuid();
      //this.description = description;
  }

  initialize(opt: transform.ITransformFactoryOptions, callback: (error)=>void) {
    var urlParameter = opt.parameters.filter((p)=>p.type.title == "aggregateShapeUrl")[0];
    if (!urlParameter) {
      callback("aggregateShapeUrl missing");
      return;
    }
    this.aggregateShapeUrl = <string>urlParameter.value;

    var parameter = opt.parameters.filter(p=>p.type.title == "aggregateShapeKeyProperty")[0];
    if (!parameter) {
      callback("aggregateShapeKeyProperty missing")
      return;
    }
    this.aggregateShapeKeyProperty = <string>parameter.value;

    request({ url: <string>urlParameter.value }, (error, response, body)=>{
      if (error) {
        callback(error);
        return;
      }

      this.geometry = JSON.parse(body);
      console.log("Geojson loaded: " + this.geometry.features.length + " features");

      callback(null);
    });


  }

  create(config, opt?: transform.ITransformFactoryOptions): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var baseGeo: any;

    var accumulator:any = {};
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

      if (!feature.geometry) {
        index++;
        done();
        return;
      }

      // console.log("=== Before:")
      // console.log(feature);
      var found = false;
      this.geometry.features.forEach((f)=>{
        if (found) {
          return;
        }
        // console.log("=== Gemeente feature:")
        // console.log(f);
        // console.log("=== Piped feature:");
        // console.log(feature);
        /*console.log(feature.geometry);*/
        if (turf.inside(feature, f)) {
           /*console.log(f);*/
          // console.log(feature.properties.gemeentenaam + "<-- matched -->" + f.properties.wk_naam);
          /*console.log(f.properties[this.aggregateShapeKeyProperty]);*/
          var accEntry = accumulator[f.properties[this.aggregateShapeKeyProperty]];
          // console.log(accEntry);
          if (accEntry) {
            var currRoutes = parseInt(feature.properties["number_of_routes_at_stop"]);
            if (accEntry["number_of_routes_at_stop_max"] < currRoutes) {
              accEntry["number_of_routes_at_stop_max"] = currRoutes;
            }
            accEntry["number_of_routes_at_stop_total"] += currRoutes
            accEntry["number_of_routes_at_stop_count"] ++;

            var strRoutes = <string>feature.properties["routes at stop"].toString(); // if a single route is a number it will be parsed as a number, we need routes as string

            var routes = strRoutes.split(/;/g);

            var accRoutes :string[]= <string[]>accEntry["routes"];
            /*console.log("before: " + accEntry["routes"]);*/
            /*console.log("add " + routes);*/
            routes.filter((value, index, arr)=>accRoutes.indexOf(value)<0).forEach(r=>accRoutes.push(r));
            /*console.log("after: " + accEntry["routes"]);*/

            accEntry.nFeatures ++;
          }
          else {
            accEntry = {
              feature: f,
              nFeatures:1
            }
            accEntry["number_of_routes_at_stop_max"] = parseInt(feature.properties["number_of_routes_at_stop"]);
            accEntry["number_of_routes_at_stop_total"] = parseInt(feature.properties["number_of_routes_at_stop"]);
            accEntry["number_of_routes_at_stop_count"] = 1;

            var strRoutes:string = feature.properties["routes at stop"].toString();
            var routes = strRoutes.split(/;/g);

            accEntry["routes"] = routes;
            accumulator[f.properties[this.aggregateShapeKeyProperty]] = accEntry;
          }

          found = true;

        }
      });

      if (!found) {
        console.log("feature " + feature.properties.name + " could not be aggregated, town: " + feature.properties.town + ". " + feature.geometry.coordinates);
      }

      // console.log("=== After:");
      // console.log(feature);

      //t.push(JSON.stringify(feature));
      done();
      /*console.log((new Date().getTime() - startTs.getTime()) + ": finish " + index++);*/
    };

    (<any>t)._flush = (done) => {
      try {
        /*console.log("#### start BAT flush");*/
        /*console.log(accumulator);*/

        for(var key in accumulator) {
          var featureAcc = accumulator[key];
          /*console.log ("#### push feature");*/
          /*console.log(featureAcc);*/
          featureAcc.feature.properties["routes"] = (<string[]>featureAcc["routes"]).join(";");
          featureAcc.feature.properties["routes_in_wijk"] = (<string[]>featureAcc["routes"]).length;
          featureAcc.feature.properties["bushaltes"] = featureAcc.nFeatures;
          featureAcc.feature.properties["number_of_routes_at_stop_average"] = featureAcc["number_of_routes_at_stop_total"] / featureAcc["number_of_routes_at_stop_count"];
          featureAcc.feature.properties["number_of_routes_at_stop_max"] = featureAcc["number_of_routes_at_stop_max"];
          t.push(JSON.stringify(featureAcc.feature));
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

export = BushalteAggregateTransformer;
