interface IStore {
    /**
     * Save all importers.
     */
    save();
    /**
     * Get a single importer.
     */
    get(id: string) : Object;
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
    create(newObject: Object): Object;
    /**
     * Update an existing importer.
     */
    update(oldObject: Object);
}
export=IStore;
