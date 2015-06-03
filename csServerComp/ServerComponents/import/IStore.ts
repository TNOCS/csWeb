import IImport = require("./IImport");

interface IStore {
    /**
     * Save all importers.
     */
    save();
    /**
     * Get a single importer.
     */
    get(id: string) : IImport;
    /**
     * Get all importers as an array.
     */
    getAll() : IImport[];
    /**
     * Delete an existing importer.
     */
    delete(id: string);
    /**
     * Create a new importer and store it.
     */
    create(importer: IImport): IImport;
    /**
     * Update an existing importer.
     */
    update(importer: IImport);
}
export=IStore;
