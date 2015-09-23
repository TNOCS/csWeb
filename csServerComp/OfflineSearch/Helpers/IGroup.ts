import ILayer = require('./ILayer');

interface IGroup {
    title?:     string;
    clustering: boolean;
    layers:     ILayer[];
    languages?: { [key: string] : { title?: string }}
}

export = IGroup;
