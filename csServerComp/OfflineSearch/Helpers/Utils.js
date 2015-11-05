var Utils = (function () {
    function Utils() {
    }
    Utils.cleanJSON = function (data) {
        var s = data.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
        return s.replace(/[\u0000-\u0019]+/g, "");
    };
    return Utils;
})();
module.exports = Utils;
