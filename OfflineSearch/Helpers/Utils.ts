class Utils {
    /** Clean a JSON file by removing bad content
    * NOTE that this does not fix a wrong encoding, e.g. the UTF8 character at the
    * beginning of a file.
    */
    static cleanJSON(data: string): string {
        var s = data.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
        // remove non-printable and other non-valid JSON chars
        return s.replace(/[\u0000-\u0019]+/g, "");
    }
}
export = Utils;
