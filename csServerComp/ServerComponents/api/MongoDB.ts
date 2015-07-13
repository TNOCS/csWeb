import LayerManager = require('LayerManager');
import Layer = LayerManager.Layer;
import mongodb = require('mongodb');


export class MongoDBStorage implements LayerManager.IStorage {
    public manager: LayerManager.LayerManager

    public db : mongodb.Db;



    constructor(public server: string, public port : number) {

    }

    public addLayer(layer: Layer) {
        console.log('Adding layer');
        //todo

    }

    public addFeature2() {
      // normally, you'd take the layerID here and toString it
      // so you can enter a collection dynamically
      var collection = this.db.collection("testFeatures");
      collection.insert({hello: 'Isitmeyourelookingfor'}, function (err) {
        if (err)
          console.log(err);
        else
          console.log("inserted 1 document");
      } );
    }

    public addFeature(layerId: string, feature: any) {
      // normally, you'd take the layerID here and toString it
      // so you can enter a collection dynamically
      var collection = this.db.collection("testFeatures");
      collection.insert({hello: 'Isitmeyourelookingfor'}, function (err) {
        if (err)
          console.log(err);
        else
          console.log("inserted 1 document");
      } );
    }

    public getAllFeatures(layer: Layer) {

    }

    public delFeature(layer: Layer, f: string) {

    }

    public getFeature(layer: Layer, i: string) {

    }

    public updateFeature(layer: Layer, feature: any) {

    }

    public init(layerManager: LayerManager.LayerManager, options: any) {
      this.manager = layerManager;
      // set up connection
      var server = new mongodb.Server('localhost', 27017, {auto_reconnect: true})
      //set up the db instance
      this.db = new mongodb.Db('mydb', server, { w: 1 });
      this.db.open(function() {});
      console.log('init MongoDB Storage');

    }
}
