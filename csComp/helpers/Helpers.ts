module csComp.Helpers {

    declare var String;//: StringExt.IStringExt;

    export function supportsDataUri() {
        var isOldIE = navigator.appName === "Microsoft Internet Explorer";
        var isIE11 = !!navigator.userAgent.match(/Trident\/7\./);
        return !(isOldIE || isIE11);  //Return true if not any IE
    }

    export function standardDeviation(values: number[]) {
        var avg = average(values);

        var squareDiffs = values.map(value => {
            var diff = value - avg;
            var sqrDiff = diff * diff;
            return sqrDiff;
        });

        var avgSquareDiff = average(squareDiffs);

        var stdDev = Math.sqrt(avgSquareDiff);
        return { avg: avg, stdDev: stdDev };
    }

    export function average(data: number[]) {
        var sum = data.reduce((accumulatedSum, value) => (accumulatedSum + value), 0);
        var avg = sum / data.length;
        return avg;
    }

    /**
     * Convert a property value to a display value using the property info.
     */
    export function convertPropertyInfo(pt: csComp.Services.IPropertyType, text: string): string {
        var displayValue: string;
        if (!csComp.StringExt.isNullOrEmpty(text) && !$.isNumeric(text))
            text = text.replace(/&amp;/g, '&');
        if (csComp.StringExt.isNullOrEmpty(text)) return text;
        switch (pt.type) {
            case "bbcode":
                if (!csComp.StringExt.isNullOrEmpty(pt.stringFormat))
                    text = String.format(pt.stringFormat, text);
                displayValue = XBBCODE.process({ text: text }).html;
                break;
            case "number":
                if (!$.isNumeric(text))
                    displayValue = text;
                else if (csComp.StringExt.isNullOrEmpty(pt.stringFormat))
                    displayValue = text.toString();
                else
                    displayValue = String.format(pt.stringFormat, parseFloat(text));
                break;
            case "rank":
                var rank = text.split(',');
                if (rank.length != 2) return text;
                if (pt.stringFormat)
                    displayValue = String.format(pt.stringFormat, rank[0], rank[1]);
                else
                    displayValue = String.format("{0) / {1}", rank[0], rank[1]);
                break;
            default:
                displayValue = text;
                break;
        }
        return displayValue;
    }

    export function getGuid() {
        var guid = (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
        return guid;
    }

     export function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

} 