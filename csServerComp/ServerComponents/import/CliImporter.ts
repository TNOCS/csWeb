import Store                     = require('./Store');
import ConfigurationService      = require('../configuration/ConfigurationService');
import ImporterRepositoryService = require('./ImporterRepositoryService');

// Import transformers
import BaseTransformer           = require('./BaseTransformer');
import CsvToJsonTransformer      = require('./CsvToJsonTransformer');
import KvKToJsonTransformer      = require('./KvKToJsonTransformer');
import SplitAdresTransformer      = require('./SplitAdresTransformer');
import BagDetailsTransformer      = require('./BagDetailsTransformer');
import GeoJsonAggregateTransformer = require('./GeoJsonAggregateTransformer');
import GeoJsonOutputTransformer = require('./GeoJsonOutputTransformer');
import FieldFilterTransformer = require('./FieldFilterTransformer');
import GeoJsonSplitTransformer = require('./GeoJsonSplitTransformer');
import GeoJsonFeaturesTransformer = require('./GeoJsonFeaturesTransformer');
import CollateStreamTransformer = require('./CollateStreamTransformer');
import GeoJsonSaveTransformer = require('./GeoJsonSaveTransformer');
import BushalteAggregateTransformer = require('./BushalteAggregateTransformer');
import MergeGeoJsonTransformer = require('./MergeGeoJsonTransformer');
import AggregateOpportunitiesToOrganisationTransformer = require('./AggregateOpportunitiesToOrganisationTransformer');
import FieldSplitTransformer = require('./FieldSplitTransformer');
import AggregateOpportunitiesToGeoJsonTransformer = require('./AggregateOpportunitiesToGeoJsonTransformer');

var config = new ConfigurationService('./configuration.json');

var store = new Store.FileStore({storageFile: config['importersStore']});
var importerService = new ImporterRepositoryService(store);

var transformers = [
  new CsvToJsonTransformer("Convert Csv to JSON"),
  new KvKToJsonTransformer("Convert KvK to JSON"),
  new SplitAdresTransformer("Split adres"),
  new BagDetailsTransformer("Lookup BAG details"),
  new GeoJsonAggregateTransformer("GeoJSON aggregate"),
  new FieldFilterTransformer("Filter gemeente Utrecht"),
  new GeoJsonOutputTransformer("GeoJSON output"),
  new GeoJsonSplitTransformer("GeoJSON split"),
  new GeoJsonFeaturesTransformer("GeoJSON features input"),
  new CollateStreamTransformer("Wait for complete stream"),
  new GeoJsonSaveTransformer("Save GeoJSON"),
  new BushalteAggregateTransformer("Aggegreer Bushaltedata"),
  new MergeGeoJsonTransformer("Merge GeoJSON"),
  new AggregateOpportunitiesToOrganisationTransformer("Aggregate opportunities"),
  new FieldSplitTransformer("Split on field"),
  new AggregateOpportunitiesToGeoJsonTransformer("Aggregate opportunities to GeoJson")
];
transformers.forEach( (t:any)=>{
  importerService.addTransformer(t);
});

var importerId:string;
try {
  importerId = process.argv[2];
  if (!importerId) throw new Error("Importer id not specified")
} catch(err){
  console.log(err);
  process.exit(10);
}

var importers = importerService.getAll();
console.log(importers);

var importer = importerService.get(importerId);
if (!importer) {
  console.log("Importer with id '" + importerId + "' not found");
  process.exit(11);
}
console.log("Running importer: " + importerId)

importerService.runImporter(importer, (error: Error) => {
  if (error) {
    console.log("Error running importers: " + error);
    process.exit(20);
  }

  console.log("done");
});
