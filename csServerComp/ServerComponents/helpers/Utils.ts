export function newGuid() {
    var guid = (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    return guid;
}

export function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
