var OfflineSearchManager = require('./OfflineSearchManager');
var offlineSearchOptions = {
    propertyNames: ['Name', 'LOC_NAAM', 'GeoAddress', 'LOC_STRAAT', 'adres', 'gemeente', 'postcode', 'plaats', 'Organisatie'],
    stopWords: ['de', 'het', 'een', 'en', 'van', 'aan']
};
var offlineSearchManager = new OfflineSearchManager('public/data/projects/projects.json', offlineSearchOptions);
