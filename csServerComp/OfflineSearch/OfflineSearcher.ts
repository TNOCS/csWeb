import path                  = require('path');
import fs                    = require('fs');
import geo                   = require('../Helpers/Feature');
import osr                   = require('./OfflineSearchResult');
import IOfflineSearchOptions = require('./IOfflineSearchOptions');
import IProjectLocation      = require('../Helpers/IProjectLocation');
import IProject              = require('../Helpers/IProject');
import IGroup                = require('../Helpers/IGroup');
import ILayer                = require('../Helpers/ILayer');

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
            project.groups.forEach((group) => {
                group.layers.forEach((layer) => {
                    var layerType = layer.type.toLowerCase();
                    if (!(layerType === 'geojson' || layerType === 'topojson')) return;
                    this.processLayer(layer, group.title);
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

        console.log(layerIndex + '. Processing ' + layer.title + ' (' + groupTitle + ')');
        fs.readFile(this.layerFilename(layer.url), 'utf8', (err, data) => {
            if (err) {
                this.filesToProcess--;
                console.log('Error: ' + err);
                this.saveResult();
                return;
            }
            var geojson: geo.IGeoJsonFile = JSON.parse(data);
            var featureIndex = 0;
            geojson.features.forEach((feature: geo.IFeature) => {
                resultLayer.featureNames.push(this.getShortenedName(feature));
                if (!feature.hasOwnProperty('properties')) return;
                this.processProperties(feature.properties, layerIndex, featureIndex++);
            });
            this.filesToProcess--;
            this.saveResult();
        });
    }

    /**
     * Get the shortened name of a feature.
     */
    private getShortenedName(feature: geo.IFeature) {
        var name = feature.properties.hasOwnProperty("Name")
            ? feature.properties["Name"]
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
    private processProperties(props: geo.IStringToAny, layerIndex: number, featureIndex: number) {
        for (var i=0; i<this.propertyNames.length; i++) {
            var key = this.propertyNames[i];
            if (!props.hasOwnProperty(key)) continue;
            var words = props[key].split(' ');
            if (words.length <= 0) continue;
            words.forEach((word) => {
                if (layerIndex === 10 && word.toLowerCase() === 'parnassia')
                    debugger;
                this.addEntry(word, layerIndex, featureIndex)
            });
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
