//USAGE:
// input parameter 1: file to convert
// input parameter 2: name of resourceType that is created (e.g., hospital)
// input parameter 3: output file
var fs = require('fs');
var path = require('path');
var filePath;
var rtName;
var outFile;

var ptArray = [];
var ptObj = {};
var ptKeys = '';
var resourceOut = {};

var printMsg;
if (process.argv.length < 5) {
   console.log('Too few input parameters. Exiting...');
   process.exit();
} 
process.argv.forEach(function (val, index, array) {
    switch(index) {
        case 0:
        case 1:
            break;
        case 2:
            filePath = path.join(__dirname, val);
            printMsg = 'Input file: ' + filePath;
            break;
        case 3: 
            rtName = val;
            printMsg = 'ResourceType name will be ' + rtName;
            break;
        case 4: 
            outFile = path.join(__dirname, val);
            printMsg = 'Output file: ' + outFile;
            break;
        default:
            printMgs = 'Additional parameter ignored';
            break;            
    }
    if (printMsg) console.log(printMsg);
});


fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err){
        console.log('Received data successfully');
        var oldJson = JSON.parse(data);
        this.ConvertData(oldJson, rtName);
    }else{
        console.log(err);
    }
});


ConvertData = function (data) {
    var geojsonfile = outFile;
    var resourcefile = filePath = path.join(__dirname, rtName + '.json');
    var combinedjson = splitJson(data);
    fs.writeFileSync(resourcefile, JSON.stringify(combinedjson.resourcejson));
    fs.writeFileSync(geojsonfile, JSON.stringify(combinedjson.geojson));
    console.log('done!');
};
    
splitJson = function (data) {
    var geojson = {}, resourcejson = {};
    var combinedjson = data;
    if (combinedjson.hasOwnProperty('type') && combinedjson.hasOwnProperty('features')) {
        geojson = {
            type: combinedjson.type,
            features: combinedjson.features
        };
    }
    //remove FeatureTypeId properties
    if (true) {
        geojson.features.forEach(function(f) {
            if (f.properties.hasOwnProperty('FeatureTypeId')) {
                delete f.properties.FeatureTypeId;
            }
        })
    }
    
    if (combinedjson.hasOwnProperty('timestamps')) {
        geojson['timestamps'] = combinedjson['timestamps'];
    }
    if (combinedjson.hasOwnProperty('featureTypes')) {
        for (var ftName in combinedjson.featureTypes) {
            if (combinedjson.featureTypes.hasOwnProperty(ftName)) {
                var defaultFeatureType = combinedjson.featureTypes[ftName];
                if (defaultFeatureType.hasOwnProperty('propertyTypeData')) {
                    var propertyTypeObjects = {};
                    var propKeys = '';
                    defaultFeatureType.propertyTypeData.forEach(function (pt) {
                        propertyTypeObjects[pt.label] = pt;
                        propKeys = propKeys + pt.label + ';';
                    });
                    delete defaultFeatureType.propertyTypeData;
                    defaultFeatureType.propertyTypeKeys = propKeys;
                    defaultFeatureType.name = rtName;
                    resourcejson['featureTypes'] = {};
                    resourcejson.featureTypes[rtName] = defaultFeatureType;
                    resourcejson['propertyTypeData'] = {};
                    resourcejson.propertyTypeData = propertyTypeObjects;
                    data.defaultFeatureType = defaultFeatureType.name;
                }
            }
        }
    }
    return { geojson: geojson, resourcejson: resourcejson };
};


















/* fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err){
        console.log('Received data successfully');
        var oldJson = JSON.parse(data);
        ptArray = oldJson.featureTypes.Default.propertyTypeData;
        ptArray.forEach( function(p) { ptObj[p.label] = p; ptKeys=ptKeys + ';' + p.label;});
        //console.log(JSON.stringify(ptObj));
        ptKeys = ptKeys.slice(1);
        console.log(JSON.stringify({propertyTypeKeys: ptKeys}));
        resourceOut.featureTypes = {};
        resourceOut.featureTypes[rtName] = oldJson.featureTypes.Default;
        resourceOut.featureTypes[rtName].propertyTypeData = ptObj;
    }else{
        console.log(err);
    }
});

ptArray.forEach( function(p) { ptObj[p.label] = p; ptKeys=ptKeys + ';' + p.label;});
console.log(JSON.stringify(ptObj));
ptKeys = ptKeys.slice(1);
console.log(JSON.stringify({propertyTypeKeys: ptKeys}));
						 */
						