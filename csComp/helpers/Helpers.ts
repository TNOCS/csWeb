// export interface Array<T> {
//     serialize<T>(): string
// }
//
// Array<T>.prototype.serialize<T> = function() {
//     return "";
// }

module csComp.Helpers {

    /**
     * Translate the object to the user's language.
     */
    export function translateObject(obj: any, language: string, recursive = false): any {
        if (obj && obj.hasOwnProperty('languages') && obj.languages.hasOwnProperty(language)) {
            for (var p in obj.languages[language]) {
                obj[p] = obj.languages[language][p];
            }
        }
        if (recursive) {
            for (var key in obj) {
                if (_.isObject(obj[key])) obj[key] = translateObject(obj[key], language, recursive);
            }
        }
        return obj;
    }

    /**
     * Serialize an array of type T to a JSON string, by calling the callback on each array element.
     */
    export function serialize<T>(arr: Array<T>, callback: (T) => Object, skipTitlesOrIdStartingWithUnderscore = false) {
        if (typeof arr === 'undefined' || arr === null || arr.length === 0) return null;
        var result: Object[] = [];
        arr.forEach(a => {
            if (skipTitlesOrIdStartingWithUnderscore
                && ((a.hasOwnProperty('title') && a['title'][0] === '_')
                    || (a.hasOwnProperty('id') && a['id'][0] === '_'))) return;
            result.push(callback(a));
        });
        return result;
    }


    export function cloneWithoutUnderscore(v: any): any {
        if (typeof v !== 'object') return v;
        if (v instanceof Array) {
            var a = [];
            v.forEach((i) => {
                a.push(this.cloneWithoutUnderscore(i));
            });
            return a;
        } else {
            var c = {};
            for (var k in v) {
                if (k[0] !== '_') c[k] = this.cloneWithoutUnderscore(v[k]);
            }
            return c;
        }
    }

    /** get the name part of a featureid (strips resource uri part if needed) */
    export function getFeatureTypeName(id: string) {
        if (id.indexOf('#') >= 0) {
            return id.split('#')[1];
        }
        else return id;
    }

    export function getDefaultFeatureStyle(feature: csComp.Services.IFeature): csComp.Services.IFeatureTypeStyle {
        if (feature && (feature.geometry && feature.geometry.type && feature.geometry.type.toLowerCase() === 'point') || (feature.fType && feature.fType.style && feature.fType.style.drawingMode && feature.fType.style.drawingMode.toLowerCase() === "point")) {
            var p: csComp.Services.IFeatureTypeStyle = {
                nameLabel: 'Name',
                drawingMode: 'Point',
                strokeWidth: 1,
                strokeColor: '#0033ff',
                fillOpacity: 1,
                strokeOpacity: 0,
                opacity: 1,
                fillColor: '#999999',
                stroke: true,
                rotate: 0,
                cornerRadius: 50,
                iconHeight: 32,
                iconWidth: 32
            };
            return p;
        } else {
            var s: csComp.Services.IFeatureTypeStyle = {
                nameLabel: 'Name',
                drawingMode: 'Polygon',
                strokeWidth: 1,
                strokeColor: '#0033ff',
                fillOpacity: 0.75,
                strokeOpacity: 1,
                opacity: 0.75,
                fillColor: '#FFFF00',
                stroke: true,
                iconUri: 'bower_components/csweb/dist-bower/images/marker.png'
            };
            return s;
        }
        //TODO: check compatibility for both heatmaps and other features
    }

    /**
     * Export data to the file system.
     */
    export function saveData(data: string, filename: string, fileType: string) {
        fileType = fileType.replace('.', '');
        filename = filename.replace('.' + fileType, '') + '.' + fileType; // if the filename already contains a type, first remove it before adding it.

        if (navigator.msSaveBlob) {
            // IE 10+
            var link: any = document.createElement('a');
            link.addEventListener('click', event => {
                var blob = new Blob([data], { 'type': 'text/' + fileType + ';charset=utf-8;' });
                navigator.msSaveBlob(blob, filename);
            }, false);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (!csComp.Helpers.supportsDataUri()) {
            // Older versions of IE: show the data in a new window
            var popup = window.open('', fileType, '');
            popup.document.body.innerHTML = '<pre>' + data + '</pre>';
        } else {
            // Support for browsers that support the data uri.
            var a: any = document.createElement('a');
            document.body.appendChild(a);
            a.href = 'data:    text/' + fileType + ';charset=utf-8,' + encodeURI(data);
            a.target = '_blank';
            a.download = filename;
            a.click();
            document.body.removeChild(a);
        }
    }

    /**
     * Export image to the file system.
     */
    export function saveImage(data: string, filename: string, fileType: string, base64?: boolean) {
        fileType = fileType.replace('.', '');
        filename = filename.replace('.' + fileType, '') + '.' + fileType; // if the filename already contains a type, first remove it before adding it.

        if (navigator.msSaveBlob) {
            // IE 10+
            var link: any = document.createElement('a');
            link.addEventListener('click', event => {
                var byteCharacters = atob(data.split(',').pop());
                var byteArrays = [];
                var sliceSize = 512;

                for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    var slice = byteCharacters.slice(offset, offset + sliceSize);
                    var byteNumbers = new Array(slice.length);
                    for (var i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    var byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
                var blob = new Blob(byteArrays, { 'type': 'image/' + fileType + ';' });
                navigator.msSaveBlob(blob, filename);
            }, false);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (!csComp.Helpers.supportsDataUri()) {
            // Older versions of IE: show the data in a new window
            var popup = window.open('', fileType, '');
            popup.document.body.innerHTML = '<pre>' + data + '</pre>';
        } else {
            // Support for browsers that support the data uri.
            var a: any = document.createElement('a');
            document.body.appendChild(a);
            if (base64) {
                a.href =  `data:image/${fileType};base64,${data}`;
            } else {
                a.href = encodeURI(data);
            }
            a.target = '_blank';
            a.download = filename;
            a.click();
            document.body.removeChild(a);
        }
    }

    declare var String; //: StringExt.IStringExt;

    /** Returns the next character. */
    export function nextChar(c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    }

    export function supportsDataUri() {
        var isOldIE = navigator.appName === 'Microsoft Internet Explorer';
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
     * Generates the title for the feature tooltip. A string format can be 
     * defined in the featureType parameter 'tooltipStringFormat'. 
     * E.g. tooltipStringFormat: "Province {0}"
     * 
     * @export
     * @param {IFeature} feature
     * @returns {string} Formatted title
     */
    export function getFeatureTooltipTitle(feature: IFeature): string {
        if (!feature.fType || !feature.fType.style || !feature.fType.style.tooltipStringFormat) return featureTitle(null, feature);
        let sf: string = feature.fType.style.tooltipStringFormat;
        let title: string = featureTitle(feature.fType, feature);
        return String.format(sf, title);
    }

    export function getFeatureTitle(feature: IFeature): string {
        return featureTitle(feature.fType, feature);
    }

    export function featureTitle(type: csComp.Services.IFeatureType, feature: IFeature): string {
        var title = '';
        if (feature.hasOwnProperty('properties')) {
            if (feature.properties.hasOwnProperty('Name')) {
                title = feature.properties['Name'];
            } else if (feature.properties.hasOwnProperty('name')) {
                title = feature.properties['name'];
            } else if (feature.properties.hasOwnProperty('naam')) {
                title = feature.properties['naam'];
            }
        } else if (type != null && type.style != null && type.style.nameLabel) {
            title = feature.properties[type.style.nameLabel];
        }
        if (!csComp.StringExt.isNullOrEmpty(title) && !$.isNumeric(title))
            title = title.replace(/&amp;/g, '&');
        return '' + title;
    }

    /**
     * Collect all the property types that are referenced by a feature type.
     */
    export function getPropertyTypes(type: csComp.Services.IFeatureType, propertyTypeData: csComp.Services.IPropertyTypeData, feature?: csComp.Services.IFeature) {
        var propertyTypes: Array<csComp.Services.IPropertyType> = [];
        if (type.propertyTypeKeys && type.propertyTypeKeys.length > 0 && typeof type.propertyTypeKeys === 'string') {
            var keys = type.propertyTypeKeys.split(/[,;]+/);
            keys.forEach((key) => {
                // First, lookup key in global propertyTypeData
                if (propertyTypeData && propertyTypeData.hasOwnProperty(key)) {
                    propertyTypes.push(propertyTypeData[key]);
                } else if (type._propertyTypeData != null) {
                    // If you cannot find it there, look it up in the featureType's propertyTypeData.
                    var result = $.grep(type._propertyTypeData, e => e.label === key);
                    if (result.length >= 1) {
                        result.forEach((res) => {
                            propertyTypes.push(res);
                        });
                    }
                }
            });
        }
        if (type._propertyTypeData != null) {
            if (type._propertyTypeData.forEach) {
                type._propertyTypeData.forEach((pt) => {
                    propertyTypes.push(pt);
                });
            } else {
                for (var ptlabel in type._propertyTypeData) {
                    if (type._propertyTypeData.hasOwnProperty(ptlabel)) {
                        propertyTypes.push(type._propertyTypeData[ptlabel]);
                    }
                }
            }
        }
        return propertyTypes;
    }

    export function getPropertyKey(keyString: string, property: string): string {
        var keys = keyString.split(';');
        var prop = property;
        var count = 1;
        while (keys.indexOf(prop) >= 0) {
            prop = property + count;
            count++;
        }
        return prop;
    }

    export function getPropertyType(feature: csComp.Services.IFeature, key: string): csComp.Services.IPropertyType {
        var propertyType = <csComp.Services.IPropertyType>{};
        propertyType.label = key;
        propertyType.title = key.replace('_', ' ');
        propertyType.isSearchable = true;
        propertyType.visibleInCallOut = true;
        propertyType.canEdit = false;
        var value = feature.properties[key]; // TODO Why does TS think we are returning an IStringToString object?
        if (StringExt.isDate(value)) {
            propertyType.type = 'date';
        } else if (StringExt.isNumber(value)) {
            propertyType.type = 'number';
        } else if (StringExt.isBoolean(value)) {
            propertyType.type = 'boolean';
        } else if (StringExt.isArray(value)) {
            propertyType.type = 'tags';
        } else if (StringExt.isBbcode(value)) {
            propertyType.type = 'bbcode';
        } else {
            propertyType.type = 'text';
        }
        return propertyType;
    }

    export function getMissingPropertyTypes(feature: csComp.Services.IFeature): csComp.Services.IPropertyType[] {
        //var type = featureType;
        var res = <csComp.Services.IPropertyType[]>[];
        //        if (!type.propertyTypeData) type.propertyTypeData = [];

        for (var key in feature.properties) {
            //if (!type.propertyTypeData.some((pt: csComp.Services.IPropertyType) => { return pt.label === key; })) {
            if (!feature.properties.hasOwnProperty(key)) continue;
            res.push(getPropertyType(feature, key));
            //}
        }

        return res;
    }

    /** find a unique key name in object */
    export function findUniqueKey(o: Object, key: string): string {
        var i = 2;
        var pk = key;
        while (o.hasOwnProperty(pk)) {
            key = key + pk;
            pk += 1;
        }
        return pk;
    }

    export function addPropertyTypes(feature: csComp.Services.IFeature, featureType: csComp.Services.IFeatureType, resource: csComp.Services.TypeResource): csComp.Services.IFeatureType {
        var type = featureType;
        if (type._propertyTypeData && type._propertyTypeData.length > 0) {
            type._propertyTypeData.forEach(pt => {
                this.updateSection(feature.layer, pt);
            });
            // type.propertyTypeKeys.split(',').forEach((key) => {
            //     if (resource.propertyTypeData.hasOwnProperty(key)) {
            //         updateSection(feature.layer, resource.propertyTypeData[key]);
            //     }
            // })
        } else {
            for (var key in feature.properties) {
                var pt: csComp.Services.IPropertyType;
                if (resource) pt = _.find(_.values(resource.propertyTypeData), (i) => { return i.label === key; });
                if (!pt) {
                    pt = {};
                    pt.label = key;
                    pt.title = key.replace('_', ' ');
                    var value = feature.properties[key]; // TODO Why does TS think we are returning an IStringToString object?

                    // text is default, so we can ignore that
                    if (StringExt.isNumber(value)) {
                        { pt.type = 'number'; }
                    } else if (StringExt.isBoolean(value)) {
                        { pt.type = 'boolean'; }
                    } else if (StringExt.isBbcode(value)) {
                        { pt.type = 'bbcode'; }
                    }
                    if (resource && resource.propertyTypeData) {
                        var ke = findUniqueKey(resource.propertyTypeData, key);
                        if (ke === key) { delete pt.label; }
                        resource.propertyTypeData[ke] = pt;
                        // since k was set in an internal loop. However, it may be that k => key
                        resource.propertyTypeData[ke] = pt;
                    } else {
                        if (!featureType._propertyTypeData) { featureType._propertyTypeData = []; }
                        featureType._propertyTypeData[key] = pt;
                    }
                    updateSection(feature.layer, pt);
                }
            }
        }

        return type;
    }

    export function updateSection(layer: csComp.Services.ProjectLayer, prop: csComp.Services.IPropertyType) {
        if (!layer || !prop) return;
        if (prop.type === 'number' || prop.hasOwnProperty('legend')) {
            if (!layer._gui.hasOwnProperty('sections')) layer._gui['sections'] = {};
            var sections: { [key: string]: csComp.Services.Section } = layer._gui['sections'];
            var s = (prop.section) ? prop.section : 'general';
            if (!sections.hasOwnProperty(s)) sections[s] = new csComp.Services.Section();
            if (!sections[s].properties.hasOwnProperty(prop.label)) sections[s].properties[prop.label] = prop;
        }
    }

    /**
     * In case we are dealing with a regular JSON file without type information, create a default type.
     */
    export function createDefaultType(feature: csComp.Services.IFeature, resource: csComp.Services.TypeResource): csComp.Services.IFeatureType {
        var type: csComp.Services.IFeatureType = {};
        type.style = getDefaultFeatureStyle(feature);
        this.addPropertyTypes(feature, type, resource);
        return type;
    }

    /**
     * Convert a property value to a display value using the property info.
     */
    export function convertPropertyInfo(pt: csComp.Services.IPropertyType, text: any): string {
        var displayValue: string;
        // if (!csComp.StringExt.isNullOrEmpty(text) && !$.isNumeric(text))
        //     text = text.replace(/&amp;/g, '&');
        if (text === undefined || text === null || !pt.type) return text;
        switch (pt.type) {
            case 'bbcode':
                if (pt.stringFormat) text = String.format(pt.stringFormat, text);
                displayValue = XBBCODE.process({ text: text }).html;
                break;
            case 'number':
                if (!$.isNumeric(text)) {
                    if (typeof text === 'string' && $.isNumeric(text.replace(',', '.'))) {
                        // E.g. "9,876E-02" is not recognized as numeric, but "9.876E-02" is.
                        displayValue = String.format(pt.stringFormat, parseFloat(text.replace(',', '.')));
                    } else {
                        displayValue = text;
                    }
                } else if (isNaN(text)) {
                    displayValue = '';
                } else if (!pt.stringFormat) {
                    displayValue = text.toString();
                } else {
                    displayValue = String.format(pt.stringFormat, parseFloat(text));
                }
                break;
            case 'options':
                if (!$.isNumeric(text)) {
                    displayValue = text;
                } else {
                    displayValue = pt.options[text];
                }
                break;
            case 'rank':
                var rank = text.split(',');
                if (rank.length !== 2) return text;
                if (pt.stringFormat) {
                    displayValue = String.format(pt.stringFormat, rank[0], rank[1]);
                } else {
                    displayValue = String.format('{0} / {1}', rank[0], rank[1]);
                }
                break;
            case 'hierarchy':
                var hierarchy = text.split(';');
                var count = hierarchy[0];
                var calculation = hierarchy[1];
                displayValue = count.toString();
                break;
            case 'date':
                var d: Date;
                if ($.isNumeric(text)) {
                    d = new Date(text);
                } else {
                    d = new Date(Date.parse(text));
                }
                displayValue = pt.stringFormat
                    ? String.format(pt.stringFormat, d)
                    : d.toLocaleString();
                break;
            case 'duration': //in ms
                if (!$.isNumeric(text)) {
                    displayValue = text;
                } else {
                    var d0 = new Date(0); var d1 = new Date(text);
                    var h = d1.getHours() - d0.getHours();
                    var m = d1.getMinutes() - d0.getMinutes();
                    var s = d1.getSeconds() - d0.getSeconds();
                    displayValue = ('0' + h).slice(-2) + 'h' + ('0' + m).slice(-2) + 'm' + ('0' + s).slice(-2) + 's';
                }
                break;
            default:
                displayValue = pt.stringFormat
                    ? String.format(pt.stringFormat, text)
                    : text;
                break;
        }
        return displayValue;
    }

    /**
    * Set the name of a feature.
    * @param {csComp.Services.IFeature} feature
    */
    export function setFeatureName(feature: csComp.Services.IFeature, propertyTypeData?: csComp.Services.IPropertyTypeData) {
        // Case one: we don't need to set it, as it's already present.
        if (feature.properties.hasOwnProperty('Name')) return feature;
        if (feature.properties.hasOwnProperty('name')) {
            feature.properties['Name'] = feature.properties['name'];
            return feature;
        }
        if (feature.properties.hasOwnProperty('NAME')) {
            feature.properties['Name'] = feature.properties['NAME'];
            return feature;
        }
        // Case two: the feature's style tells us what property to use for the name.
        if (feature.fType && feature.fType.style && feature.fType.style.nameLabel) {
            var nameLabel = feature.fType.style.nameLabel;
            if (feature.properties.hasOwnProperty(nameLabel)) {
                if (propertyTypeData && propertyTypeData.hasOwnProperty(nameLabel)) {
                    feature.properties['Name'] = convertPropertyInfo(propertyTypeData[nameLabel], feature.properties[nameLabel]);
                } else {
                    feature.properties['Name'] = feature.properties[nameLabel];
                }
                return feature;
            }
        }
        // Case three: the feature has a Name property which specifies a string format, meaning that the Name is derived from several existing properties.
        if (feature.fType._propertyTypeData) {
            // for .. of
            for (var i = 0; i < feature.fType._propertyTypeData.length; i++) {
                var propertyType = feature.fType._propertyTypeData[i];
                if (propertyType.label !== 'Name' || !propertyType.stringFormat) continue;
                feature.properties['Name'] = Helpers.convertStringFormat(feature, propertyType.stringFormat);
                return feature;
            }
        }
        // If all else fails, use the first property
        for (var prop in feature.properties) {
            feature.properties['Name'] = prop.toString(); //feature.properties[prop];
            return feature;
        }
        // Finally, just create a GUID.
        feature.properties['Name'] = Helpers.getGuid();
        return feature;
    }

    /**
    * Convert a feature's stringFormat to a string.
    * @param {Services.IFeature} feature
    * @param {string} stringFormat
    */
    export function convertStringFormat(feature: Services.IFeature, stringFormat: string) {
        var openingBrackets = Helpers.indexes(stringFormat, '{');
        var closingBrackets = Helpers.indexes(stringFormat, '}');
        var convertedStringFormat = stringFormat;
        for (var j = 0; j < openingBrackets.length; j++) {
            var searchValue = stringFormat.substring(openingBrackets[j] + 1, closingBrackets[j]);
            var replaceValue = (feature.properties.hasOwnProperty(searchValue)) ? feature.properties[searchValue] : '';
            convertedStringFormat = convertedStringFormat.replace('{' + searchValue + '}', replaceValue);
        }
        return convertedStringFormat;
    }

    /**
    * Get all indexes of the 'find' substring in the 'source' string.
    * @param {string} source
    * @param {string} find
    */
    export function indexes(source: string, find: string) {
        if (!source) return [];
        var result: number[] = [];
        for (var i = 0; i < source.length; i++) {
            if (source.substr(i, find.length) === find) result.push(i);
        }
        return result;
    }

    export function getGuid() {
        var guid = (this.S4() + this.S4() + '-' + this.S4() + '-4' + this.S4().substr(0, 3) + '-' + this.S4() + '-' + this.S4() + this.S4() + this.S4()).toLowerCase();
        return guid;
    }

    export function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    /**
     * Load the features as visible on the map, effectively creating a virtual
     * GeoJSON file that represents all visible items.
     * Also loads the keys into the featuretype's propertyTypeData collection.
     */
    export function loadMapLayers(layerService: Services.LayerService): Services.IGeoJsonFile {
        var data: Services.IGeoJsonFile = {
            type: '',
            features: [],
            featureTypes: {}
        };
        // If we are filtering, load the filter results
        layerService.project.groups.forEach((group) => {
            if (group.filterResult != null)
                group.filterResult.forEach((f) => data.features.push(f));
        });
        // Otherwise, take all loaded features
        if (data.features.length === 0)
            data.features = layerService.project.features;

        data.features.forEach((f: Services.IFeature) => {
            if (!(data.featureTypes.hasOwnProperty(f.featureTypeName))) {
                var featureType = layerService.getFeatureType(f);
                if (!featureType.name) featureType.name = f.featureTypeName.replace('_Default', '');
                data.featureTypes[f.featureTypeName] = featureType;
                if (featureType.propertyTypeKeys) {
                    featureType._propertyTypeData = [];
                    featureType.propertyTypeKeys.split(/[,;]+/).forEach((key) => {
                        if (layerService.propertyTypeData.hasOwnProperty(key)) {
                            featureType._propertyTypeData.push(layerService.propertyTypeData[key]);
                        }
                    });
                }
            }
        });

        return data;
    }

    /**
     * Helper function to create content for the RightPanelTab
     * @param  {string} container The container name
     * @param  {string} directive The directive of the container
     * @param  {any}    data      Panel data
     * @return {RightPanelTab}    Returns the RightPanelTab instance. Add it to the
     * rightpanel by publishing it on the MessageBus.
     */
    export function createRightPanelTab(container: string, directive: string, data: any, title: string, popover?: string, icon?: string, replace?: boolean, canClose?: boolean): Services.RightPanelTab {
        var rpt = new Services.RightPanelTab();
        rpt.container = container;
        rpt.data = data;
        rpt.title = title;
        rpt.directive = directive;
        rpt.popover = popover || '';
        rpt.icon = icon || 'tachometer';
        rpt.replace = replace;
        if (typeof canClose !== 'undefined') rpt.canClose = canClose;
        return rpt;
    }

    /**
     * Helper function to parse a query of an url (e.g localhost:8080/api?a=1&b=2&c=3)
     */
    export function parseUrlParameters(url: string, baseDelimiter: string, subDelimiter: string, valueDelimiter: string): { [key: string]: any } {
        var baseUrl = url.split(baseDelimiter)[0];
        var croppedUrl = url.split(baseDelimiter)[1];
        var splittedUrl = croppedUrl.split(subDelimiter);
        var urlParameters: { [key: string]: any } = {};
        splittedUrl.forEach((param) => {
            var keyValue = param.split(valueDelimiter);
            urlParameters[keyValue[0]] = (isNaN(+keyValue[1])) ? keyValue[1] : +keyValue[1]; //Store as number when possible
        });
        urlParameters['baseUrl'] = baseUrl;
        return urlParameters;
    }

    /**
     * Helper function to parse a query of an url (e.g localhost:8080/api?a=1&b=2&c=3)
     */
    export function joinUrlParameters(params: { [key: string]: any }, baseDelimiter: string, subDelimiter: string, valueDelimiter: string): string {
        var url = params['baseUrl'] + baseDelimiter;
        for (var key in params) {
            if (params.hasOwnProperty(key) && key !== 'baseUrl' && params[key]) {
                url = url + key + valueDelimiter + params[key] + subDelimiter;
            }
        }
        url = url.substring(0, url.length - 1);
        return url;
    }

    export function createIconHtml(feature: IFeature, style? : csComp.Services.IFeatureTypeStyle): {
        html: string,
        iconPlusBorderWidth: number,
        iconPlusBorderHeight: number
    } {
        var es = (typeof style === 'undefined') ? feature.effectiveStyle : style;
        var iconUri = es.iconUri; //ft.style.iconUri;
        var html: string,
            content: string,
            closeImageTag: string = '';
        switch (es.drawingMode) {
            case 'Line':
                break;
            case 'Polygon':
                html = `<img src="${iconUri || 'images/bom.png'}"></img>`;
                break;
            case 'Point':
                // TODO refactor to object
                var iconPlusBorderWidth, iconPlusBorderHeight;
                if (es.hasOwnProperty('strokeWidth') && es.strokeWidth > 0) {
                    iconPlusBorderWidth = es.iconWidth + (2 * es.strokeWidth);
                    iconPlusBorderHeight = es.iconHeight + (2 * es.strokeWidth);
                } else {
                    iconPlusBorderWidth = es.iconWidth;
                    iconPlusBorderHeight = es.iconHeight;
                }

                if (es.innerTextProperty != null && feature.properties.hasOwnProperty(es.innerTextProperty)) {
                    var textSize = es.innerTextSize || 12;
                    if (es.marker === 'pin') {
                        content = `<div class="pin-inner" style="font-size:${textSize}px;">${feature.properties[es.innerTextProperty]}</div>`;
                    } else {
                        content = `<span style="font-size:${textSize}px;vertical-align:-webkit-baseline-middle">${feature.properties[es.innerTextProperty]}</span>`;
                    }
                } else if (iconUri != null) {
                    // Must the iconUri be formatted?
                    if (iconUri != null && iconUri.indexOf('{') >= 0) iconUri = Helpers.convertStringFormat(feature, iconUri);
                    content = `<img src="${iconUri}" style="width:${es.iconWidth}px;height:${es.iconHeight}px;display:block;`;
                    if (es.rotate && es.rotate > 0) content += `;transform:rotate(${es.rotate}deg)`;
                    closeImageTag = '" />';
                }

                if (isNaN(es.fillOpacity)) es.fillOpacity = 1;

                var bc = chroma(es.fillColor).alpha(+es.fillOpacity).rgba();
                var backgroundColor = `rgba(${bc[0]},${bc[1]},${bc[2]},${bc[3]})`;

                switch (es.marker) {
                    case 'pin':
                        if (es.innerTextProperty) {
                            html = '<div class="pin" style="display:inline-block;vertical-align:bottom;text-align:center;'
                                + `background:${backgroundColor};`
                                + `width:${iconPlusBorderWidth}px;`
                                + `height:${iconPlusBorderHeight}px;`
                                + `opacity:${es.opacity || 1};`
                                + `">${content}</div>`;
                        } else {
                            html = '<div class="pin" style="display:inline-block;vertical-align:bottom;text-align:center;'
                                + `background:${backgroundColor};`
                                + `width:${iconPlusBorderWidth}px;`
                                + `height:${iconPlusBorderHeight}px;`
                                + `opacity:${es.opacity || 1};`
                                + '"></div>'
                                + content
                                + `position:absolute;margin:${es.strokeWidth}px" />`;
                        }
                        break;
                    case 'bubble':
                        html = '<div class="bubble" style="display:inline-block;vertical-align:bottom;text-align:center;'
                            + `background:${backgroundColor};`
                            + `width:${iconPlusBorderWidth}px;`
                            + `height:${iconPlusBorderHeight}px;`
                            + `opacity:${es.opacity || 1};`
                            + '"></div>'
                            + content + `position:absolute;margin:${es.strokeWidth}px" />`;
                        break;
                    default:
                        var sc = chroma(es.strokeColor).alpha(+es.strokeOpacity || 1).rgba();
                        var strokeColor = `rgba(${sc[0]},${sc[1]},${sc[2]},${sc[3]})`;

                        html = '<div style="display:inline-block;vertical-align:middle;text-align:center;'
                            + `background:${backgroundColor};`
                            + `width:${iconPlusBorderWidth}px;`
                            + `height:${iconPlusBorderHeight}px;`
                            + `border-radius:${es.cornerRadius}%;`
                            + 'border-style:solid;'
                            + `border-color:${strokeColor};`
                            + `border-width:${es.strokeWidth}px;`
                            + `opacity:${es.opacity || 1};`
                            + '">'
                            + content + closeImageTag
                            + '</div>';
                        break;
                }
        }
        var iconHtml = {
            html: html,
            iconPlusBorderWidth: iconPlusBorderWidth,
            iconPlusBorderHeight: iconPlusBorderHeight
        };
        return iconHtml;
    }
}
