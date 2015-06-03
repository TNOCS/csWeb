import IImport    = require("./IImport");
import ITransform = require("./ITransform");
import Utils      = require("../helpers/Utils");
import RepeatEnum = require("./RepeatEnum");

export class BaseImport implements IImport {
    id:           string;
    title:        string;
    sourceUrl:    string;
    description:  string;
    contributor:  string;
    destination:  string;
    tags:         { [text: string]: string } = {};
    transformers: ITransform[] = [];
    repeat:       RepeatEnum = RepeatEnum.never;
    lastRun:      Date;

    constructor() {
        this.id = Utils.newGuid();
    }

}
