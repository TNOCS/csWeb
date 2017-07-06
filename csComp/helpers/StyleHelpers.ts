module csComp.Helpers {

    /**
     * Either get the color from the string value by using the active legend, or else return
     * the current value (e.g. assuming that the current property contains a color).
     */
    export function getColorFromStringValue(v: string, gs: csComp.Services.GroupStyle) {
        var defaultcolor: string = '#000000';
        if (gs.activeLegend) {
            var l = gs.activeLegend;
            var s: String = l.id;
            var n = l.legendEntries.length;
            if (n === 0) return (defaultcolor);
            //if (l.legendKind.toLowerCase() === 'discretestrings' || l.legendKind.toLowerCase() === 'discrete') {
            var i: number = 0;
            while (i < n) {
                var e = l.legendEntries[i];
                if (v === e.stringValue) {
                    return e.color;
                }
                i++;
            }
            return defaultcolor;
            //}

            //return defaultcolor;
        }
        if (v && v.indexOf('#') === 0) {
            return v;
        } else {
            // Validate color
            if (this.validateCSSColor(v)) {
                return v;
            } else {
                return defaultcolor;
            }
        }
    }

    export function validateCSSColor(col: string) {
        var ele = document.createElement('div');
        ele.style.color = col;
        var str = ele.style.color.split(/\s+/).join('').toLowerCase();
        return (str) ? true : false;
    }

    export function getImageUri(ft: csComp.Services.IFeatureType): string {
        if (!ft) return;
        var iconUri = (ft && ft.style && ft.style.iconUri) ? ft.style.iconUri : 'bower_components/csweb/dist-bower/images/marker.png';
        if (iconUri.indexOf('{') >= 0) iconUri = iconUri.replace('{', '').replace('}', '');

        if (ft && ft.style != null && ft.style.drawingMode != null && ft.style.drawingMode.toLowerCase() != "point") {
            if (iconUri.indexOf('_Media') < 0) {
                return iconUri;
            } else {
                return 'cs/images/polygon.png';
            }
        } else if (ft && ft.style != null && iconUri != null) {
            return iconUri;
        } else {
            return 'bower_components/csweb/dist-bower/images/marker.png';
        }
    }

    export function getColorAndOpacityFromRgbaString(v: string) {
        if (!v || typeof v !== 'string' || v.length < 9 || v[0] !== '#') return;
        let opacity = parseInt(v.substr(7), 16);
        opacity /= 255;
        return { color: v.substr(0, 7), opacity: opacity };
    }

    export function getColorFromStringLegend(v: string, l: csComp.Services.Legend, defaultcolor: string = '#000000') {
        var n = l.legendEntries.length;
        if (n === 0) return (defaultcolor);
        if (l.legendKind.toLowerCase() === 'discretestrings') {
            var i: number = 0;
            while (i < n) {
                var e = l.legendEntries[i];
                if (v === e.stringValue) {
                    return e.color;
                }
                i++;
            }
            return defaultcolor;
        }
        return defaultcolor;
    }

    export function getColorFromLegend(v: any, l: csComp.Services.Legend, defaultcolor = '#000000') {
        var n = l.legendEntries.length;
        if (l.defaultLabel) {
            let defaultLE = _.find(l.legendEntries, (le) => { return le.label === l.defaultLabel; });
            if (defaultLE && defaultLE.color) {
                defaultcolor = defaultLE.color;
            }
        }
        if (n === 0) return (defaultcolor);
        if (l.legendKind.toLowerCase() === 'discretestrings') {
            var i: number = 0;
            while (i < n) {
                var e = l.legendEntries[i];
                if (v.toString() === e.stringValue) {
                    return e.color;
                }
                i++;
            }
            return defaultcolor;
        }
        if (l.legendKind.toLowerCase() === 'interpolated') {
            var entries = _.sortBy(l.legendEntries, (le) => { return le.value; });
            var e1 = _.first(entries); // minimum value
            var e2 = _.last(entries);  // maximum value
            // interpolate between two colors
            if (v < e1.value) return e1.color;
            if (v > e2.value) return e2.color;
            var i: number = 0;
            while (i < n - 1) {
                e1 = entries[i];
                e2 = entries[i + 1];
                if ((v >= e1.value) && (v <= e2.value)) {
                    var bezInterpolator = (<any>chroma).bezier([e1.color, e2.color]);
                    var r = bezInterpolator((v - e1.value) / (e2.value - e1.value)).hex();
                    return r;
                }
                i++;
            }
            return (defaultcolor);
        }
        if (l.legendKind.toLowerCase() === 'discrete') {
            var entries = _.sortBy(l.legendEntries, (le) => { return (le.interval ? le.interval.min : Infinity); });
            var e1 = _.first(entries); // minimum value
            var e2 = _.last(entries);  // maximum value
            if (e1.interval && e2.interval && typeof e1.interval.min !== 'undefined' && typeof e2.interval.max !== 'undefined') {
                if (v < e1.interval.min) return e1.color;
                if (v > e2.interval.max) return e2.color;
            }
            var i: number = 0;
            while (i < n) {
                var e = entries[i];
                if (e.value && v === e.value) {
                    return e.color;
                } else if (e.interval && (v >= e.interval.min) && (v <= e.interval.max)) {
                    return e.color;
                }
                i++;
            }
            return defaultcolor;
        }
        return defaultcolor;
    }

    export function getColor(v: number, gs: csComp.Services.GroupStyle) {
        if (gs.activeLegend) {
            return getColorFromLegend(v, gs.activeLegend);
        }

        var max = gs.info.userMax || gs.info.max;
        var min = gs.info.userMin || gs.info.min;

        if (v > max) return gs.colors[gs.colors.length - 1];
        if (v < min) return gs.colors[0];
        //var bezInterpolator = chroma.interpolate.bezier(gs.colors);
        //var r = bezInterpolator((v - gs.info.sdMin) / (gs.info.sdMax - gs.info.sdMin)).hex();
        //return r;
        var color = d3.scale.linear()
            .domain([min, max])//domain and range should have the same arraylength!!!
            .range(gs.colors);
        var hexColor = color(v).toString();
        return hexColor;
    }

    /**
     * Extract a valid color string, without transparency.
     */
    export function getColorString(color: string, defaultColor = '#000000') {
        if (!color) return defaultColor;
        if (color === 'transparent') return '#00000000';
        if (color.length === 4 || color.length === 7) return color;
        if (color.length === 9) return '#' + color.substr(3, 6);
        return defaultColor;
    }
}
