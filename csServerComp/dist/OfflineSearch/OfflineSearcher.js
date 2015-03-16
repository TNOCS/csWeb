'use strict';
var fs = require('fs');
var osr = require('OfflineSearchResult');
var OfflineSearcher = (function () {
    function OfflineSearcher(projectFile, stopwords) {
        this.projectFile = projectFile;
        this.stopwords = stopwords;
        this.result = new osr.OfflineSearchResult(projectFile, stopwords);
        this.layers = this.result.layers;
        this.propertyNames = this.result.propertyNames;
        this.keywordIndex = this.result.keywordIndex;
    }
    Object.defineProperty(OfflineSearcher.prototype, "filename", {
        get: function () {
            return this.projectFile.replace('project', 'offline_search_result');
        },
        enumerable: true,
        configurable: true
    });
    OfflineSearcher.prototype.openProject = function () {
        var _this = this;
        var file = this.projectFile;
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            data.groups.forEach(function (group) {
                group.layers.forEach(function (layer) {
                    if (!(layer.type === 'geojson' || layer.type === 'topojson'))
                        return;
                    _this.processLayer(layer);
                });
            });
        });
    };
    OfflineSearcher.prototype.processLayer = function (layer) {
        if (layer.title == null)
            layer.title = layer.id;
        this.layers.push(new osr.Layer(layer.id, layer.title, layer.url));
        // TDDO
    };
    OfflineSearcher.prototype.saveResult = function () {
        var file = this.filename;
        fs.writeFile(file, JSON.stringify(this.result, null, 2), function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('JSON saved to ' + file);
            }
        });
    };
    OfflineSearcher.prototype.loadResult = function () {
        var _this = this;
        var file = this.filename;
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) {
                console.log('Error: ' + err);
                return;
            }
            _this.layers = data.layers;
            _this.propertyNames = data.propertyNames;
            _this.keywordIndex = data.keywordIndex;
            _this.projectFile = data.projectFile;
            _this.stopwords = data.stopwords;
        });
    };
    OfflineSearcher.prototype.addEntry = function (key, layerIndex, featureIndex, propertyIndex) {
        key = key.toLowerCase();
        if (this.stopwords.indexOf(key) >= 0)
            return;
        if (!this.keywordIndex.hasOwnProperty(key))
            this.keywordIndex[key] = [];
        this.keywordIndex[key].push(new osr.Entry(layerIndex, featureIndex, propertyIndex));
    };
    return OfflineSearcher;
})();
exports.OfflineSearcher = OfflineSearcher;
