import IApiService = require('../api/IApiService');
import IImport = require("./IImport");
import transform   = require("./ITransform");

interface IImporterRepositoryService extends IApiService {
    getAll(): Object[];
    get(id: string): Object;
    delete(id: string);
    create(importer: Object): Object;
    update(importer: Object);
    addTransformer(transformer: transform.ITransform);
}
export = IImporterRepositoryService;
