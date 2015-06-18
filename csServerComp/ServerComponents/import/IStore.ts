import express = require('express');

interface IStore {
    /**
     * Save all importers.
     */
    save(id?: string, resource?: any);
    /**
     * Get a single importer.
     */
    get(id: string) : Object;
    getAsync?(id: string, res: express.Response);

    /**
     * Get all importers as an array.
     */
    getAll() : Object[];
    /**
     * Delete an existing importer.
     */
    delete(id: string);
    /**
     * Create a new importer and store it.
     */
    create(id: string, resource: any);
    /**
     * Update an existing importer.
     */
    update(id: string, resource: any);
}
export=IStore;
