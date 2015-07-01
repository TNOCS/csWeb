import fs = require('fs');
import path = require('path');
import express = require('express');
import Utils = require("../helpers/Utils");
import IStore = require("./IStore");
import ConfigurationService = require('../configuration/ConfigurationService');

export class FileStore implements IStore {
    private store: string;
    private resources: { [id: string]: any } = {};

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
    create(id: string, newObject: any) {
        if (typeof id === 'undefined' || !newObject.hasOwnProperty("id"))
            newObject.id = id = Utils.newGuid();
        else if (this.get(newObject.id) !== null) return;
        this.resources[id] = newObject;
        this.save();
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
    update(id: string, resource: any) {
        this.resources[id] = resource;
        this.save();
    }
}


export class FolderStore implements IStore {
    private folder: string;
    private resources: { [id: string]: string } = {};

    constructor(opt?: { [key: string]: any }) {
        this.folder = path.join(path.dirname(require.main.filename), opt["storageFolder"] || "public/data/resourceTypes");
        this.load();
    }

    /**
     * Load the file from disk.
     */
    private load(callback?: Function) {
        fs.readdir(this.folder, (err, res) => {
            if (err) {
                console.log('No folder store found: ' + this.folder);
            }
            else {
                res.forEach(resource => {
                    this.resources[resource] = path.join(this.folder, resource);
                });
            }
            if (callback) callback();
        });
    }

    save(id: string, resource: any) {
        var filename = path.join(this.folder, id);
        fs.writeFile(filename, JSON.stringify(resource, null, 2), (err) => {
            var b = this.folder;
            if (err) {
                console.error(err);
            } else {
                this.resources[id] = filename;
            }
        });
    }


    /**
     * Get all importers as an array.
     */
    getAll() {
        var resourceArray: string[] = [];
        for (var id in this.resources) {
            if (this.resources.hasOwnProperty(id))
                resourceArray.push(id);
        }
        return resourceArray;
    }

    /**
     * Get a single resource.
     */
    get(id: string) {
        if (!this.resources.hasOwnProperty(id)) {
            this.load();
        }
        if (!this.resources.hasOwnProperty(id)) {
            return null;
        }
        return this.resources[id];
    }

    /**
     * Get a single resource.
     */
    getAsync(id: string, res: express.Response) {
        // If resource cannot be found, refresh the resourcelist and try again
        if (!this.resources.hasOwnProperty(id)) {
            this.load(() => {
                if (!this.resources.hasOwnProperty(id)) {
                    res.status(404);
                    res.write("");
                    res.end();
                } else {
                    var filename = this.resources[id];
                    res.sendFile(filename);
                }
            });
        } else {
            var filename = this.resources[id];
            res.sendFile(filename);
        }
    }

    /**
     * Create a new importer and store it.
     */
    create(id: string, resource: any) {
        this.save(id, resource);
    }

    /**
     * Delete an existing importer.
     */
    delete(id: string) {
        if (!this.resources.hasOwnProperty(id)) return null;
        fs.unlink(this.resources[id], (err) => {
            if (err) {
                console.error(err);
            } else {
                this.resources[id] = null;
                delete this.resources[id];
            }
        });
    }

    /**
     * Update an existing resource.
     */
    update(id: string, resource: any) {
        this.save(id, resource);
    }
}
