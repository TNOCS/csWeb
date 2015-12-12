declare namespace L {
    /*
     * Utility functions to decode/encode numbers and array's of numbers
     * to/from strings (Google maps polyline encoding)
     *
     * Extends the L.Polyline and L.Polygon object with methods to convert
     * to and create from these strings.
     *
     * Jan Pieter Waagmeester <jieter@jieter.nl>
     *
     * Original code from:
     * http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/
     * (which is down as of december 2014)
     */

    export interface PolylineStatic extends ClassStatic {
        fromEncoded(encoded, options?);
    }
}
