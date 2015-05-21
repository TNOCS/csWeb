declare class Utils {
    /** Clean a JSON file by removing bad content
    * NOTE that this does not fix a wrong encoding, e.g. the UTF8 character at the
    * beginning of a file.
    */
    static cleanJSON(data: string): string;
}
export = Utils;
