import ITransform = require("./ITransform");
import RepeatEnum = require("./RepeatEnum");

interface IImport {
    id:            string;
    title:         string;
    /**
     * Location of the original source, the file that needs to be imported.
     */
    sourceUrl:     string;
    /**
     * Location(s) where we are going to leave it, e.g. it may contain a set of files or database location.
     */
    destinations?: string[];
    description?:  string;
    contributor?:  string;
    image?:        string;
    tags?:         { [text: string]: string };
    transformers?: ITransform[];

    repeat?:       RepeatEnum;
    lastRun?:      Date;
}
export=IImport;
