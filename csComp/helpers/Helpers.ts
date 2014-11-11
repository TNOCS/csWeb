module csComp.Helpers {
    export function supportsDataUri() {
        var isOldIE = navigator.appName === "Microsoft Internet Explorer";
        var isIE11 = !!navigator.userAgent.match(/Trident\/7\./);
        return !(isOldIE || isIE11);  //Return true if not any IE
    }

} 