module csComp.StringExt {
    export function isNullOrEmpty(s: string): boolean {
        return !isNumber(s) && !s;
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
    export function isDate(n: any): boolean {
        return moment(n, moment.ISO_8601).isValid();
    }

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
        //if (typeof s === 'boolean') return true;
    }

    /*
     * Returns true if we are dealing with a array, false otherwise.
     */
    export function isArray(s: any): boolean {
        return s && s.constructor === Array;
    }

    /*
     * Returns true if we are dealing with a bbcode, false otherwise.
     */
    export function isBbcode(s: any): boolean {
        //return false;
        if (s == null) return false;
        return s.indexOf("[b]") > 0 || s.indexOf("[i]") > 0 || s.indexOf("[url") > 0;
    }
}
