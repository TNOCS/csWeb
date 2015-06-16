import fs                   = require('fs');
import Utils                = require("../helpers/Utils");
import IStore               = require("./IStore");
import ConfigurationService = require('../configuration/ConfigurationService');

export class FileStore implements IStore {
    private store: string;
    private resources: { [id: string]: any} = {};

    constructor(opt?: { [key: string]: any }) {
        this.store = opt["storageFile"] || "importers.json";
        this.load();
    }

    /**
     * Load the file from disk.
     */
    private load() {
        fs.readFile(this.store, 'utf8', (err, res) => {
            if (err) {
                console.log('No file store found: ' + this.store);
            }
            else {
                this.resources = JSON.parse(res);
            }
        });
    }

    /**
     * Save the list of importers to disk.
     */
    save() {
        fs.writeFile(this.store, JSON.stringify(this.resources, null, 2), { encoding: 'utf8' }, (err) => {
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
        var resourceArray: Object[] = [];
        for (var id in this.resources) {
            if (!this.resources.hasOwnProperty(id)) continue;
            resourceArray.push(this.resources[id]);
        }
        return resourceArray;
    }

    /**
     * Get a single importer.
     */
    get(id: string) {
        if (!this.resources.hasOwnProperty(id)) return null;
        return this.resources[id];
    }

    /**
     * Create a new importer and store it.
     */
    create(newObject: any): Object {
        if (!newObject.hasOwnProperty("id") || typeof newObject.id === 'undefined')
            newObject.id = Utils.newGuid();
        else if (this.get(newObject.id) !== null) return;
        this.resources[newObject.id] = newObject;
        this.save();
        return newObject;
    }

    /**
     * Delete an existing importer.
     */
    delete(id: string) {
        if (!this.resources.hasOwnProperty(id)) return null;
        this.resources[id] = null;
        delete this.resources[id];
        this.save();
    }

    /**
     * Update an existing importer.
     */
    update(resources: { id: string } ) {
        this.resources[resources.id] = resources;
        this.save();
    }
}
