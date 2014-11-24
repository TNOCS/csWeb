module csComp.StringExt {
    export interface IStringExt extends String {
        format(s: string, ...args: string[]): string;
    }

    export class Utils {
        /** Convert a CamelCase string to one with underscores. */
        public static toUnderscore(s: string) {
            return s.replace(/([A-Z])/g, $1 => "_" + $1.toLowerCase());
        }
    }

    export function isNullOrEmpty(s: string): boolean {
        return !s;
    }

    /**
     * String formatting
     * 'Added {0} by {1} to your collection'.f(title, artist)
     * 'Your balance is {0} USD'.f(77.7)
     */
    export function format(s: string, ...args: string[]): string {
        var i = args.length;

        while (i--) {
            // "gm" = RegEx options for Global search (more than one instance) and for Multiline search
            s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), args[i]);
        }
        return s;
    };

    /*
     * Returns true if we are dealing with a number, false otherwise.
     */
    export function isNumber(n: any): boolean {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    /*
     * Returns true if we are dealing with a boolean, false otherwise.
     */
    export function isBoolean(s: any): boolean {
        return s === 'true' || s === 'false';
    }

    /*
     * Returns true if we are dealing with a bbcode, false otherwise.
     */
    export function isBbcode(s: any): boolean {
        return false;
        if (s == null) return false;
        return s.indexOf("[b]") > 0 || s.indexOf("[i]") > 0 || s.indexOf("[url") > 0;
    }
}

//module String {
//    export function isNullOrEmpty(s: string): boolean {
//        return !s;
//    }

//}

////interface String {
////    format: () => string;
////    isNullOrEmpty: () => boolean;
////}

////String.prototype.format = function (...args: any[]): string {
////    var formatted = this;
////    for (var i = 0; i < args.length; i++) {
////        formatted = formatted.replace(
////            RegExp("\\{" + i + "\\}", 'g'), args[i].toString());
////    }
////    return formatted;
////};

////String.prototype.isNullOrEmpty = function (): boolean {
////    //var s: string = this;
////    return this.length == 0;
//}