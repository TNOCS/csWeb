var fs = require('fs');
var ConfigurationService = (function () {
    function ConfigurationService(configurationFile) {
        this.configurationFile = configurationFile;
        var data = fs.readFileSync(configurationFile, 'utf8');
        var content = JSON.parse(data);
        for (var key in content) {
            if (content.hasOwnProperty(key)) {
                var value = content[key];
                this.add(key, value);
            }
        }
    }
    ConfigurationService.prototype.initialize = function (init) {
        for (var x = 0; x < init.length; x++) {
            this[init[x].key] = init[x].value;
            ConfigurationService.theKeys.push(init[x].key);
            ConfigurationService.theValues.push(init[x].value);
        }
    };
    ConfigurationService.prototype.add = function (key, value) {
        this[key] = value;
        ConfigurationService.theKeys.push(key);
        ConfigurationService.theValues.push(value);
    };
    ConfigurationService.prototype.remove = function (key) {
        var index = ConfigurationService.theKeys.indexOf(key, 0);
        ConfigurationService.theKeys.splice(index, 1);
        ConfigurationService.theValues.splice(index, 1);
        delete this[key];
    };
    ConfigurationService.prototype.clear = function () {
        for (var i = ConfigurationService.theKeys.length; i >= 0; i--) {
            var key = ConfigurationService.theKeys[i];
            this.remove(key);
        }
    };
    ConfigurationService.prototype.count = function () {
        return ConfigurationService.theKeys.length;
    };
    ConfigurationService.prototype.keys = function () {
        return ConfigurationService.theKeys;
    };
    ConfigurationService.prototype.values = function () {
        return ConfigurationService.theValues;
    };
    ConfigurationService.prototype.containsKey = function (key) {
        return (typeof this[key] !== "undefined");
    };
    ConfigurationService.prototype.toLookup = function () {
        return this;
    };
    ConfigurationService.theKeys = [];
    ConfigurationService.theValues = [];
    return ConfigurationService;
})();
module.exports = ConfigurationService;
