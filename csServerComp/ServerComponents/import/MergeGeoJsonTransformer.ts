import Utils     = require('../helpers/Utils');
import transform = require('./ITransform');
import stream  = require('stream');
import request                    = require('request');

var turf = require('turf');

class MergeGeoJsonTransformer implements transform.ITransform {
  id:          string;
  description: string;
  type = 'MergeGeoJsonTransformer';

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
    var featuresToMergeUrlProperty = opt.parameters.filter((p) => p.type.title === 'featuresToMergeUrl')[0];
    if (!featuresToMergeUrlProperty) {
      callback('feature url missing');
      return;
    }

    var keyPropertyParameter = opt.parameters.filter((p) => p.type.title === 'keyProperty')[0];
    if (!keyPropertyParameter) {
      callback('key property missing');
      return;
    }
    this.keyProperty = <string>keyPropertyParameter.value;

    request({ url: <string>featuresToMergeUrlProperty.value }, (error, response, body) =>{
      if (error) {
        callback(error);
        return;
      }

      this.geometry = JSON.parse(body);
      console.log('Merge geojson loaded');

      callback(null);
    });
  }

  create(config, opt?: transform.ITransformFactoryOptions[]): NodeJS.ReadWriteStream {
    var t = new stream.Transform();
    /*stream.Transform.call(t);*/

    var baseGeo: any;

    t.setEncoding('utf8');
    (<any>t)._transform =  (chunk, encoding, done) => {
      // var startTs = new Date();
      // console.log((new Date().getTime() - startTs.getTime()) + ": start");
      var feature = JSON.parse(chunk);

      // console.log(this.filterProperty + "  - " + this.filterValue);

      var featureKeyValue = <string>feature.properties[this.keyProperty];

      var mergeFeature = this.geometry.features.filter(f => f.properties[this.keyProperty] === featureKeyValue)[0];

      if (!mergeFeature) {
        console.log('No merge feature found based on ' + this.keyProperty + '=' + featureKeyValue);
        done();
        return;
      }

      for (var field in mergeFeature.properties) {
        feature.properties[field] = mergeFeature.properties[field];
      }
      feature.geometry = mergeFeature.geometry;

      t.push(JSON.stringify(feature));

      // console.log(feature);
      // console.log("=== After:");
      // console.log(feature);
      done();
      // console.log((new Date().getTime() - startTs.getTime()) + ": finish");
    };

    return t;
  }

}

export = MergeGeoJsonTransformer;
