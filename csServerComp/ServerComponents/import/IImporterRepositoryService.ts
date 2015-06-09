import IApiService = require('../api/IApiService');
import IImport     = require("./IImport");

interface IImporterRepositoryService extends IApiService {
    getAll() : IImport[];
    get(id: string) : IImport;
    delete(id: string);
    create(importer: IImport): IImport;
    update(importer: IImport);
    addTransformer(transformer: ITransform);
}
export = IImporterRepositoryService;
