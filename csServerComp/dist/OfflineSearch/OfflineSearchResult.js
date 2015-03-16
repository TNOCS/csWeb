'use strict';
var Layer = (function () {
    function Layer(id, title, path) {
        this.id = id;
        this.title = title;
        this.path = path;
    }
    return Layer;
})();
exports.Layer = Layer;
var PropertyName = (function () {
    function PropertyName() {
    }
    return PropertyName;
})();
exports.PropertyName = PropertyName;
/**
* An index entry that contains a search result.
*/
var Entry = (function () {
    function Entry(layerIndex, featureIndex, propertyIndex) {
        this.layerIndex = layerIndex;
        this.featureIndex = featureIndex;
        this.propertyIndex = propertyIndex;
    }
    return Entry;
})();
exports.Entry = Entry;
var KeywordIndex = (function () {
    function KeywordIndex() {
    }
    return KeywordIndex;
})();
exports.KeywordIndex = KeywordIndex;
var OfflineSearchResult = (function () {
    function OfflineSearchResult(projectFile, stopwords) {
        this.projectFile = projectFile;
        this.stopwords = stopwords;
        this.layers = [];
        this.propertyNames = [];
        this.keywordIndex = {};
    }
    return OfflineSearchResult;
})();
exports.OfflineSearchResult = OfflineSearchResult;
