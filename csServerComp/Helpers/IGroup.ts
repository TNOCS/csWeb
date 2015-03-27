import ILayer = require('ILayer');

interface IGroup {
    title:      string;
    clustering: boolean;
    layers:     ILayer[];
}

export = IGroup;
