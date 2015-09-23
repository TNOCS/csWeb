import path                  = require('path');
import fs                    = require('fs');
import geo                   = require('./Helpers/Feature');
import osr                   = require('./OfflineSearchResult');
import IOfflineSearchOptions = require('./IOfflineSearchOptions');
import IProjectLocation      = require('./Helpers/IProjectLocation');
import IProject              = require('./Helpers/IProject');
import IGroup                = require('./Helpers/IGroup');
import ILayer                = require('./Helpers/ILayer');

/**
* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains.
*/
export class OfflineSearcher {
    private result       : osr.OfflineSearchResult;
    private layers       : osr.Layer[];
    private propertyNames: string[] = [];
    private stopWords    : string[];
    private keywordIndex : osr.KeywordIndex;

    private filesToProcess = 0;

    constructor(private project: IProjectLocation, private options: IOfflineSearchOptions) {
        this.result        = new osr.OfflineSearchResult(project, options);
        this.layers        = this.result.layers;
        this.stopWords     = this.result.options.stopWords;
        this.keywordIndex  = this.result.keywordIndex;

        this.result.options.propertyNames.forEach((pt) => {
            this.propertyNames.push(pt);
        });
    }

    get savedFilename(): string {
        return 'public/' + this.project.url.replace('project.json', 'offline_search_result.json');
    }

    get projectFilename(): string {
        return 'public/' + this.project.url;
    }

    /**
     * Return the (local) layer file name.
     */
    private layerFilename(baseUrl: string): string {
        return 'public/' + baseUrl;
    }

    /**
     * Process the project by extracting the groups and processing each layer.
     */
    processProject() {
        fs.readFile(this.projectFilename, 'utf8', (err, data) => {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            var project : IProject = JSON.parse(data);
            if (!project.groups) return;
            project.groups.forEach((group: IGroup) => {
                if (!group.layers) return;
                group.layers.forEach((layer) => {
                    var layerType = layer.type.toLowerCase();
                    if (!(layerType === 'geojson')) return;
                    this.processLayer(layer, group.title || group.languages['nl'].title);
                });
            });
            this.saveResult();
          });
    }

    /**
     * Process a single layer by calling processProperties on each feature.
     * @layer {ILayer}
     */
    private processLayer(layer: ILayer, groupTitle: string) {
        this.filesToProcess++;

        if (layer.title == null) layer.title = layer.id;
        var layerIndex = this.layers.length;
        var resultLayer = new osr.Layer(groupTitle, layerIndex, layer.id, layer.title, layer.url, layer.type);
        this.layers.push(resultLayer);

        var featureTypeLookup: geo.IFeatureTypeResourceFile = {};
        if (layer.typeUrl != null) {
          //console.log("Load resource type file " + layer.typeUrl);
          let typeFileLocation = path.resolve("public",layer.typeUrl);
          let layerTypes: geo.IFeatureTypeResourceFile = JSON.parse(fs.readFileSync(typeFileLocation).toString());
          let featureTypeIds = Object.getOwnPropertyNames(layerTypes.featureTypes);
          featureTypeIds.forEach(featureTypeId => {
              featureTypeLookup[featureTypeId] = layerTypes.featureTypes[featureTypeId];
          });
        }

        console.log(layerIndex + '. Processing ' + layer.title + ' (' + groupTitle + ')');
        fs.readFile(this.layerFilename(layer.url), 'utf8', (err, data) => {
            if (err) {
                this.filesToProcess--;
                console.log(err);
                this.saveResult();
                return;
            }
            var geojson: geo.IGeoJsonFile = JSON.parse(data);

            if (geojson.featureTypes != null) {
              let featureTypeIds = Object.getOwnPropertyNames(geojson.featureTypes);
              featureTypeIds.forEach(featureTypeId => {
                  featureTypeLookup[featureTypeId] = geojson.featureTypes[featureTypeId];
              });
            }

            var featureIndex = 0;
            if (!geojson.features) return;
            geojson.features.forEach((feature: geo.IFeature) => {
                let featureTypeId = feature.properties["FeatureTypeId"] || layer.defaultFeatureType;
                if (featureTypeId == null) {
                  console.log("Unknown feature type '" + featureTypeId + "' for feature in layer " + layer.url + "(" + layer.defaultFeatureType + ")");
                  return;
                }

                let featureType = featureTypeLookup[featureTypeId];

                if (featureType == null) {
                  console.log("Cannot find featureType '" + featureTypeId + "' for feature in layer " + layer.url);
                  return;
                }

                let nameLabel = featureType.style.nameLabel;
                let effectiveProperties = this.propertyNames.slice(0); // copy provided property names

                if (nameLabel != null) {
                  if (effectiveProperties.indexOf(nameLabel) == -1) {
                    effectiveProperties.push(nameLabel); // add name label if it wasn't included in te provided property names
                  }
                } else {
                  nameLabel = "Name";
                  if (feature.properties[nameLabel] ==  null) {
                    console.log("Cannot resolve nameLabel for feature in layer " + layer.url);
                  }
                }

                resultLayer.featureNames.push(this.getShortenedName(feature, nameLabel));
                if (feature.hasOwnProperty('properties'))
                  this.processProperties(feature.properties, effectiveProperties, layerIndex, featureIndex++);
            });
            console.log(layerIndex + '. Processed ' + layer.title);
            this.filesToProcess--;
            this.saveResult();
        });
    }

    /**
     * Get the shortened name of a feature.
     */
    private getShortenedName(feature: geo.IFeature, nameLabel: string) {
      if (nameLabel == null) {
        nameLabel = "Name"
      }

      var name = feature.properties.hasOwnProperty(nameLabel)
          ? feature.properties[nameLabel]
          : feature.properties.hasOwnProperty("name")
              ? feature.properties["name"]
              : "Unknown";
      if (name.length > 25) name = name.substring(0,22) + '...';
      return name;
    }

    /**
     * Process each property that is included, and save the resulting Entry for each word
     * that is not a stop word.
     * @props {geo.IStringToAny}
     * @layerIndex {number}
     * @featureIndex {number}
     */
    private processProperties(props: geo.IStringToAny, propertiesToIndex: string[], layerIndex: number, featureIndex: number) {
        for (var i=0; i < propertiesToIndex.length; i++) {
            var key = propertiesToIndex[i];
            if (!props.hasOwnProperty(key)) continue;
            var value : string | number = props[key];
            if (typeof value === 'string') {
                var words = value.split(' ');
                if (words.length <= 0) continue;
                words.forEach((word) => {
                    // if (layerIndex === 10 && word.toLowerCase() === 'parnassia')
                    //     debugger;
                    this.addEntry(word, layerIndex, featureIndex)
                });
            } else {
                // Value is a number
                this.addEntry('' + value, layerIndex, featureIndex)
            }
        }

    //   for (var key in props) {
    //       var propertyIndex = this.propertyNames.indexOf(key);
    //       if (propertyIndex >= 0) {
    //           var words = props[key].split(' ');
    //           if (words.length <= 0) continue;
    //           words.forEach((word) => {
    //               this.addEntry(word, layerIndex, featureIndex, propertyIndex)
    //           });
    //       }
    //   }
    }

    /**
     * Add a new or enhance an existing entry.
     * @key {string}
     * @layerIndex {number}
     * @featureIndex {number}
     * @propertyIndex {number}
     */
    private addEntry(key: string, layerIndex: number, featureIndex: number) {
        key = key.toLowerCase();
        if (this.stopWords.indexOf(key) >= 0) return;
        if (!this.keywordIndex.hasOwnProperty(key)) {
            this.keywordIndex[key] = [];
            //console.log('New key: ' + key)
        } else {
            // Check for duplicate keys
            var entries = this.keywordIndex[key];
            for (var i=0; i<entries.length; i++) {
                var entry = entries[i];
                if (entry.layerIndex === layerIndex && entry.featureIndex === featureIndex) return;
            }
        }
        this.keywordIndex[key].push(new osr.Entry(layerIndex, featureIndex));
    }

    /**
     * Add a new or enhance an existing entry.
     * @key {string}
     * @entry {number[]}
     */
    private addFullEntry(key: string, entry: number[]) {
        if (!this.keywordIndex.hasOwnProperty(key)) {
            this.keywordIndex[key] = [];
        }
        this.keywordIndex[key].push(new osr.Entry(entry));
    }

    private saveResult() {
        if (this.filesToProcess > 0) return;
        var file = this.savedFilename;
        fs.writeFile(file, JSON.stringify(this.result, null, 0), err => {
            if (err) {
                console.log(err);
            } else {
                console.log('JSON saved to ' + file);
            }
        });
    }

    loadResult() {
        var file = this.savedFilename;
        fs.readFile(file, 'utf8',(err, data: string) => {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            var osr: osr.OfflineSearchResult = JSON.parse(data);

            this.layers        = osr.layers;
            this.options       = osr.options;
            this.propertyNames = [];
            this.project       = osr.project;
            this.stopWords     = osr.options.stopWords;
            osr.options.propertyNames.forEach((pt) => {
                this.propertyNames.push(pt.toLowerCase());
            });
            this.keywordIndex  = {};
            for (var key in osr.keywordIndex) {
                osr.keywordIndex[key].forEach((entry: any) => {
                    this.addFullEntry(key, entry);
                });
            }
        });
    }
}
