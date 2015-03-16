'use strict'
/**
* Offline Search reads the solution file, and creates an OfflineSearchResult for each project it contains. 
*/

import path = require('path');
import fs   = require('fs');
import osr  = require('OfflineSearchResult');

export class OfflineSearcher {
    private result       : osr.OfflineSearchResult;
    private layers       : osr.Layer[];
    private propertyNames: osr.PropertyName[];
    private keywordIndex : osr.KeywordIndex;

    constructor(private projectFile: string, private stopwords: string[]) {
        this.result        = new osr.OfflineSearchResult(projectFile, stopwords);
        this.layers        = this.result.layers;
        this.propertyNames = this.result.propertyNames;
        this.keywordIndex  = this.result.keywordIndex;
    }

    get filename(): string {
        return this.projectFile.replace('project', 'offline_search_result');
    }

    openProject() {
        var file = this.projectFile;
        fs.readFile(file, 'utf8',(err, data) => {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            data.groups.forEach((group) => {
                group.layers.forEach((layer) => {
                    if (!(layer.type === 'geojson' || layer.type === 'topojson')) return;
                    this.processLayer(layer);
                });
            });
          });        
    }

    processLayer(layer) {
        if (layer.title == null) layer.title = layer.id;
        this.layers.push(new osr.Layer(layer.id, layer.title, layer.url));
        // TDDO
    }

    saveResult() {
        var file = this.filename;
        fs.writeFile(file, JSON.stringify(this.result, null, 2), err => {
            if (err) {
                console.log(err);
            } else {
                console.log('JSON saved to ' + file);
            }
        });
    }

    loadResult() {
        var file = this.filename;
        fs.readFile(file, 'utf8',(err, data: osr.OfflineSearchResult) => {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            this.layers        = data.layers;
            this.propertyNames = data.propertyNames;
            this.keywordIndex  = data.keywordIndex;
            this.projectFile   = data.projectFile;
            this.stopwords     = data.stopwords;
        });
    }

    private addEntry(key: string, layerIndex: number, featureIndex: number, propertyIndex: number) {
        key = key.toLowerCase();
        if (this.stopwords.indexOf(key) >= 0) return;
        if (!this.keywordIndex.hasOwnProperty(key))
            this.keywordIndex[key] = [];
        this.keywordIndex[key].push(new osr.Entry(layerIndex, featureIndex, propertyIndex));
    }

}