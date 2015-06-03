import Utils = require("../helpers/Utils");
import ITransform = require("./ITransform");

class BaseTransformer implements ITransform {
    id:                    string;
    description:           string;
    parameterTitles:       string[] = [];
    parameterDescriptions: string[] = [];
    parameterTypes:        string[] = [];

    constructor(public title: string) {
        this.id = Utils.newGuid();
    }

    transform(s: MSStreamReader, ...params) {

    }

    init() {

    }

    run() {

    }
}
export=BaseTransformer;
