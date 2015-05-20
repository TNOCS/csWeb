import IConfiguration = require('./IConfiguration');
import fs             = require('fs');
/**
 * Service that contains default configuration options.
 * Is based on csComp.Helpers.Dictionary.
 */
class ConfigurationService implements IConfiguration {
    private static theKeys: string[] = [];
    private static theValues: string[] = [];

    /**
     * Create a configuration service based on a configuration file.
     */
    constructor(private configurationFile: string) {
        var data = fs.readFileSync(configurationFile, 'utf8');
        var content: Object = JSON.parse(data);
        for (var key in content) {
            if (content.hasOwnProperty(key)) {
                var value = content[key];
                this.add(key, value);
            }
        }
        // fs.readFile(configurationFile, 'utf8', (err, data) => {
        //   if (err) throw err;
        //   var content: Object = JSON.parse(data);
        //   for (var key in content) {
        //       if (content.hasOwnProperty(key)) {
        //           var value = content[key];
        //           this.add(key, value);
        //       }
        //   }
        // });
    }

    initialize(init: { key: string; value: string; }[]) {
        for (var x = 0; x < init.length; x++) {
            this[init[x].key] = init[x].value;
            ConfigurationService.theKeys.push(init[x].key);
            ConfigurationService.theValues.push(init[x].value);
        }
    }

    add(key: string, value: string) {
        this[key] = value;
        ConfigurationService.theKeys.push(key);
        ConfigurationService.theValues.push(value);
    }

    remove(key: string) {
        var index = ConfigurationService.theKeys.indexOf(key, 0);
        ConfigurationService.theKeys.splice(index, 1);
        ConfigurationService.theValues.splice(index, 1);
        delete this[key];
    }

    clear() {
        for (var i = ConfigurationService.theKeys.length; i >= 0; i--) {
            var key = ConfigurationService.theKeys[i];
            this.remove(key);
        }
    }

    count() {
        return ConfigurationService.theKeys.length;
    }

    keys(): string[] {
        return ConfigurationService.theKeys;
    }

    values(): string[] {
        return ConfigurationService.theValues;
    }

    containsKey(key: string) {
        return (typeof this[key] !== "undefined")
    }

    toLookup(): IConfiguration {
        return this;
    }
}
export = ConfigurationService;
