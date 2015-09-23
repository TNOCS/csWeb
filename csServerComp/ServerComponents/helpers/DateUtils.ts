interface Date {
    /** Minimum date value */
    minValue: Date;
    /** Add a number of days */
    addDays(days: number): Date;
    /** Get the number of days between two dates */
    diffDays(date: Date): number;
    /** Get the number of hours between two dates */
    diffHours(date: Date): number;
    /** Get the number of minutes between two dates */
    diffMinutes(date: Date): number;
    /** Get the number of seconds between two dates */
    diffSeconds(date: Date): number;
}

Date.prototype.minValue = new Date(0);
Date.prototype.addDays = function(days: number) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};
Date.prototype.diffDays = function(date: Date) {
    var diffMs = (this.getTime() - date.getTime()); // milliseconds
    return Math.round(diffMs / 86400000);
}
Date.prototype.diffHours = function(date: Date) {
    var diffMs = (this.getTime() - date.getTime()); // milliseconds
    return Math.round((diffMs % 86400000) / 3600000); // hours
}
Date.prototype.diffMinutes = function(date: Date) {
    var diffMs = (this.getTime() - date.getTime()); // milliseconds
    return Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
}
Date.prototype.diffSeconds = function(date: Date) {
    var diffMs = (this.getTime() - date.getTime()); // milliseconds
    return Math.round(diffMs / 1000);
}
