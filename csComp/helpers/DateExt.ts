interface Date {
    getJulian(): number;
    getGMST(): number;
    /**
     * Get date in YYYYMMDD format
     */
    yyyymmdd(): string;
}

Date.prototype.getJulian = function() {
    /* Calculate the present UTC Julian Date. Function is valid after
     * the beginning of the UNIX epoch 1970-01-01 and ignores leap
     * seconds. */
    return (this / 86400000) + 2440587.5;
}

Date.prototype.getGMST = function() {
    /* Calculate Greenwich Mean Sidereal Time according to
       http://aa.usno.navy.mil/faq/docs/GAST.php */
    var julianDay = this.getJulian();
    var d = julianDay - 2451545.0;
    // Low precision equation is good enough for our purposes.
    return (18.697374558 + 24.06570982441908 * d) % 24;
}

Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
}
