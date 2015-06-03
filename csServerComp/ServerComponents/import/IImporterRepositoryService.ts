import IImport = require("./IImport");

interface IImporterRepositoryService {
    getAll() : IImport[];
    get(id: string) : IImport;
    delete(id: string);
    create(importer: IImport): IImport;
    update(importer: IImport);
}
export = IImporterRepositoryService;
