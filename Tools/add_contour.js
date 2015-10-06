//USAGE:
// input parameter 1: inputfile containing features with properties (e.g., residences)
// input parameter 2: contourfile containing contours (e.g., building contours)
// input parameter 3: output file
// input parameter 4: property-name for identifying the input feature (should have a common value with #5)
// input parameter 5: property-name for identifying the contour feature (should have a common value with #4) 
//
// This tool will add the geometry of a feature as a property of another feature (stringified). In that way, it is
// possible to add a meaningful contour to a feature (e.g., a building contour to an address, the coverage area to
// a cell tower, etc.). Use the ContourAction in csWeb to show the contour when hovering over a feature. 
// The property-name of the contour will be 'contour', you can change it by a search and replace if desired.
var fs = require('fs');
var path = require('path');
var filePath;
var rcName;
var outFile;
var inProp;
var contProp;

var ptArray = [];
var ptObj = {};
var ptKeys = '';
var outObj = {};

var printMsg;
if (process.argv.length < 7) {
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
            rcName = val;
            printMsg = 'ResourceType name will be ' + rcName;
            break;
        case 4: 
            outFile = path.join(__dirname, val);
            printMsg = 'Output file: ' + outFile;
            break;
        case 5: 
            inProp = val.trim();
            printMsg = 'Input property-name: ' + inProp;
            break;
        case 6: 
            contProp = val.trim();
            printMsg = 'Contour property-name: ' + contProp;
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
        var inputJson = JSON.parse(data);
        this.ConvertData(inputJson, rcName);
    }else{
        console.log(err);
    }
});


ConvertData = function (inputJson, rcName) {
    outObj['type'] = "FeatureCollection";
    outObj['features'] = [];
    var contourJson = JSON.parse(fs.readFileSync(rcName, 'utf8'));
    inputJson.features.forEach(function(f_in) {
        var id = f_in.properties[inProp];
        contourJson.features.some(function(f){
            if (f.properties[contProp] === id) {
                console.log(id);
                f_in.properties['contour'] = JSON.stringify(f.geometry);
                return true;
            }
            return false;
        });
        outObj.features.push(f_in);
    });
    fs.writeFileSync(outFile, JSON.stringify(outObj));
    console.log('done!');
};