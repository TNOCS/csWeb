import fs                   = require('fs');
import Utils                = require("../helpers/Utils");
import IImport              = require("./IImport");
import IStore               = require("./IStore");
import ConfigurationService = require('../configuration/ConfigurationService');

export class FileStore implements IStore {
    private store: string;
    private importers: { [id: string]: IImport} = {};

    constructor(config: ConfigurationService) {
        this.store = config["importersStore"] || "importers.json";
        this.load();
    }

    /**
     * Load the file from disk.
     */
    private load() {
        fs.readFile(this.store, 'utf8', (err, res) => {
            if (err) {
                console.log(err);
            }
            else {
                this.importers = JSON.parse(res);
            }
        });
    }

    /**
     * Save the list of importers to disk.
     */
    save() {
        fs.writeFile(this.store, JSON.stringify(this.importers, null, 2), { encoding: 'utf8' }, (err) => {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    }

    /**
     * Get all importers as an array.
     */
    getAll() {
        var importerArray: IImport[] = [];
        for (var id in this.importers) {
            if (!this.importers.hasOwnProperty(id)) continue;
            importerArray.push(this.importers[id]);
        }
        return importerArray;
    }

    /**
     * Get a single importer.
     */
    get(id: string) {
        if (!this.importers.hasOwnProperty(id)) return null;
        return this.importers[id];
    }

    /**
     * Create a new importer and store it.
     */
    create(importer: IImport): IImport {
        if (typeof importer.id === 'undefined')
            importer.id = Utils.newGuid();
        else if (this.get(importer.id) !== null) return;
        this.importers[importer.id] = importer;
        this.save();
        return importer;
    }

    /**
     * Delete an existing importer.
     */
    delete(id: string) {
        if (!this.importers.hasOwnProperty(id)) return null;
        this.importers[id] = null;
        delete this.importers[id];
        this.save();
    }

    /**
     * Update an existing importer.
     */
    update(importer: IImport) {
        this.importers[importer.id] = importer;
        this.save();
    }
}
