module csComp.Helpers {
    import IMetaInfo = GeoJson.IMetaInfo;

    declare var String: StringExt.IStringExt;

    export function supportsDataUri() {
        var isOldIE = navigator.appName === "Microsoft Internet Explorer";
        var isIE11 = !!navigator.userAgent.match(/Trident\/7\./);
        return !(isOldIE || isIE11);  //Return true if not any IE
    }


    /**
     * Convert a property value to a display value using the property info.
     */
    export function convertPropertyInfo(mi: IMetaInfo, text: string): string {
        var displayValue: string;
        if (!csComp.StringExt.isNullOrEmpty(text) && !$.isNumeric(text))
            text = text.replace(/&amp;/g, '&');
        if (csComp.StringExt.isNullOrEmpty(text)) return '';
        switch (mi.type) {
            case "bbcode":
                if (!csComp.StringExt.isNullOrEmpty(mi.stringFormat))
                    text = String.format(mi.stringFormat, text);
                displayValue = XBBCODE.process({ text: text }).html;
                break;
            case "number":
                if (!$.isNumeric(text))
                    displayValue = text;
                else if (csComp.StringExt.isNullOrEmpty(mi.stringFormat))
                    displayValue = text.toString();
                else
                    displayValue = String.format(mi.stringFormat, parseFloat(text));
                break;
            case "rank":
                var rank = text.split(',');
                if (rank.length != 2) return text;
                if (mi.stringFormat)
                    displayValue = String.format(mi.stringFormat, rank[0], rank[1]);
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