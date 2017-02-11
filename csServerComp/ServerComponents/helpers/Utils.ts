import * as fs from 'fs';
import * as path from 'path';


/**
 * Delete a folder synchronously.
 * Source: http://stackoverflow.com/a/32197381/319711
 *
 * @export
 * @param {string} folder
 */
export function deleteFolderRecursively(folder: string) {
    if (!fs.existsSync(folder)) { return; }
    fs.readdirSync(folder).forEach(function (file, index) {
        var curPath = folder + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursively(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(folder);
};

/** Create a new GUID */
export function newGuid() {
    var guid = (this.S4() + this.S4() + '-' + this.S4() + '-4' + this.S4().substr(0, 3) + '-' + this.S4() + '-' + this.S4() + this.S4() + this.S4()).toLowerCase();
    return guid;
}

export function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

/** Get all the directories in a folder. */
export function getDirectories(srcpath: string): string[] {
    return fs.readdirSync(srcpath).filter(function (file: string) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

/** Get all the files in a folder. */
export function getFiles(srcpath: string): string[] {
    return fs.readdirSync(srcpath).filter(function (file: string) {
        return fs.statSync(path.join(srcpath, file)).isFile();
    });
}

/**
 * Get the IP4 address (assuming you have only one active network card).
 * See also: http://stackoverflow.com/a/15075395/319711
 */
export function getIPAddress(): string {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];

        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
        }
    }

    return '0.0.0.0';
}
