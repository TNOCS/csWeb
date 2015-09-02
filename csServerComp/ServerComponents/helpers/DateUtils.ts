interface Date {
    minValue: Date;
    /** Add a number of days to the current date. */
    addDays(days: number): Date;
}

Date.prototype.minValue = new Date(0);

/**
 * Add a number of days to the current date.
 * @ref http://stackoverflow.com/questions/563406/add-days-to-datetime
 */
Date.prototype.addDays = function(days: number)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
