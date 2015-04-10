module csComp.Helpers
{
    export function getColorFromStringValue(v: string, gs: csComp.Services.GroupStyle) {
        if (gs.activeLegend) {
            var defaultcolor: string = '#000000';
            var l = gs.activeLegend;
            var s: String = l.id;
            var n = l.legendEntries.length;
            if (n == 0) return (defaultcolor);
            if (l.legendKind == 'discretestrings') {
                var i: number = 0;
                while (i < n) {
                    var e = l.legendEntries[i];
                    if (v == e.stringValue)  {
                        return e.color;
                    }
                    i++;
                }
                return defaultcolor;
            }
            return defaultcolor;
        }
    }

    export function getColor(v: number, gs: csComp.Services.GroupStyle) {
        if (gs.activeLegend) {
            var defaultcolor: string = '#000000';
            var l = gs.activeLegend;
            var s: String = l.id;
            var n = l.legendEntries.length;
            if (n == 0) return (defaultcolor);
            var e1 = l.legendEntries[0];    // first
            var e2 = l.legendEntries[n - 1];  // last
            if (l.legendKind == 'interpolated') {
                // interpolate between two colors
                if (v < e1.value) return e1.color;
                if (v > e2.value) return e2.color;
                var i: number = 0;
                while (i < n-1) {
                    e1 = l.legendEntries[i];
                    e2 = l.legendEntries[i + 1];
                    if ((v >= e1.value) && (v <= e2.value)) {
                        var bezInterpolator = chroma.interpolate.bezier([e1.color, e2.color]);
                        var r = bezInterpolator((v - e1.value) / (e2.value - e1.value)).hex();
                        return r;
                    }
                    i++;
                }
                return(defaultcolor);
            }
            if (l.legendKind == 'discrete') {
                if (v < e1.interval.min) return l.legendEntries[0].color;
                if (v > e2.interval.max) return l.legendEntries[n - 1].color;
                var i: number = 0;
                while (i < n) {
                    var e = l.legendEntries[i];
                    if ((v >= e.interval.min) && (v <= e.interval.max)) {
                        return e.color;
                    }
                    i++;
                }
                return defaultcolor;
            }
            return defaultcolor;
        }
        
        if (v > gs.info.sdMax) return gs.colors[gs.colors.length - 1];
        if (v < gs.info.sdMin) return gs.colors[0];
        var bezInterpolator = chroma.interpolate.bezier(gs.colors);
        var r = bezInterpolator((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin)).hex();
        return r;
    }

    /**
     * Extract a valid color string, without transparency.
     */
    export function getColorString(color: string, defaultColor = '#f00') {
        if (!color) return defaultColor;
        if (color.length == 4 || color.length == 7) return color;
        if (color.length == 9) return '#' + color.substr(3, 6);
        return defaultColor;
    }
}
