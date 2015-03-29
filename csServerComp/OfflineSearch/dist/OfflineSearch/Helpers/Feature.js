var Event = (function () {
    function Event() {
        var _this = this;
        this.startDate = function () {
            return new Date(_this.start);
        };
    }
    return Event;
})();
exports.Event = Event;
/**
 * A feature is a single object that is show on a map (e.g. point, polyline, etc)
 * Features are part of a layer and filtered and styled using group filters and styles
 *
 */
var Feature = (function () {
    function Feature() {
    }
    return Feature;
})();
exports.Feature = Feature;
(function (DrawingModeType) {
    DrawingModeType[DrawingModeType["None"] = 0] = "None";
    DrawingModeType[DrawingModeType["Image"] = 1] = "Image";
    DrawingModeType[DrawingModeType["Point"] = 2] = "Point";
    DrawingModeType[DrawingModeType["Square"] = 3] = "Square";
    DrawingModeType[DrawingModeType["Rectangle"] = 4] = "Rectangle";
    DrawingModeType[DrawingModeType["Line"] = 5] = "Line";
    DrawingModeType[DrawingModeType["Circle"] = 6] = "Circle";
    DrawingModeType[DrawingModeType["Freehand"] = 7] = "Freehand";
    DrawingModeType[DrawingModeType["Polyline"] = 8] = "Polyline";
    DrawingModeType[DrawingModeType["Polygon"] = 9] = "Polygon";
    DrawingModeType[DrawingModeType["MultiPolygon"] = 10] = "MultiPolygon";
})(exports.DrawingModeType || (exports.DrawingModeType = {}));
var DrawingModeType = exports.DrawingModeType;
//export enum propertyTypeType {
//    Text,
//    TextArea,
//    Rating,
//    Number,
//    Bbcode,
//    Boolean,
//    Bit,
//    Sensor,
//    Xml,
//    Options,
//    Unknown,
//    Image,
//    DateTime,
//    Mediafolder
//}
(function (featureFilterType) {
    /** Turn filtering off */
    featureFilterType[featureFilterType["none"] = 0] = "none";
    /** Default for numbers: histogram */
    featureFilterType[featureFilterType["bar"] = 1] = "bar";
    /** Default for text */
    featureFilterType[featureFilterType["text"] = 2] = "text";
})(exports.featureFilterType || (exports.featureFilterType = {}));
var featureFilterType = exports.featureFilterType;
var PropertyInfo = (function () {
    function PropertyInfo() {
    }
    return PropertyInfo;
})();
exports.PropertyInfo = PropertyInfo;
