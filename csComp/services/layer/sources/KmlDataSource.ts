module csComp.Services {
    declare var toGeoJSON;

    export class KmlDataSource extends csComp.Services.GeoJsonSource {
        title = "kml";

        constructor(public service: csComp.Services.LayerService, $http: ng.IHttpService) {
            super(service, $http);
        }

        private get(x, y) { return x.getElementsByTagName(y); }

        private attr(x, y) { return x.getAttribute(y); }

        public addLayer(layer: ProjectLayer, callback: (layer: ProjectLayer) => void) {
            this.layer = layer;
            layer.renderType = "geojson";
            // Open a layer URL
            layer.isLoading = true;
            // get data
            $.ajax(layer.url)
                .done((xml) => {
                    layer.count = 0;
                    layer.isLoading = false;
                    switch (layer.type.toLowerCase()) {
                        case "kml":
                            this.convertKmlToGeoJSON(layer, xml);
                            break;
                        case "gpx":
                            this.convertGpxToGeoJSON(layer, xml);
                            break;
                    }
                    callback(layer);
                })
                .fail((error) => {
                    layer.isLoading = false;
                    this.service.$messageBusService.notify('ERROR loading ' + layer.title, error);
                    this.service.$messageBusService.publish('layer', 'error', layer);
                    callback(layer);
                });
        }

        private convertGpxToGeoJSON(layer: csComp.Services.ProjectLayer, gpx) {
            var data: csComp.Services.IGeoJsonFile = toGeoJSON.gpx(gpx);
            this.initLayer(data, layer);
        }

        private convertKmlToGeoJSON(layer: csComp.Services.ProjectLayer, kml) {
            // Convert kml to geojson
            var data: csComp.Services.IGeoJsonFile = toGeoJSON.kml(kml);
            // Extract style information: first, get all styles
            var styleIndex = {},
                styles = this.get(kml, 'Style'),
                styleMaps = this.get(kml, 'StyleMap');
            for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + this.attr(styles[k], 'id')] = styles[k];
            }
            // Next, get all stylemaps (and link the normal version to its style)
            for (var k = 0; k < styleMaps.length; k++) {
                var styleMap = styleMaps[k];
                var pairs = this.get(styleMap, 'Pair');
                if (!pairs) continue;
                for (let i = 0; i < pairs.length; i++) {
                    let p = pairs[i];
                    var key = this.get(p, 'key');
                    if (!key || key.length === 0 || key[0].childNodes[0].nodeValue !== 'normal') continue;
                    var styleNames = this.get(p, 'styleUrl');
                    if (styleNames && styleNames.length > 0) {
                        let styleMapName = '#' + this.attr(styleMap, 'id');
                        let styleName = styleNames[0].childNodes[0].nodeValue;
                        styleIndex[styleMapName] = styleIndex[styleName];
                    }
                    break;
                }
            }
            // Create the style and add it to the service._featureTypes.
            data.features.forEach(f => {
                if (!f.properties.hasOwnProperty('styleUrl')) return;
                var styleUrl = f.properties['styleUrl'],
                    styleName = layer.typeUrl + styleUrl;
                // Strip the # from the style name and copy it to the featureTypeId
                f.properties['featureTypeId'] = styleUrl.substring(1);
                // Remove the styleUrl and styleHash
                delete f.properties['styleUrl'];
                delete f.properties['styleHash'];
                if (this.service._featureTypes.hasOwnProperty(styleName)) return;
                var style = styleIndex[styleUrl];
                this.service._featureTypes[styleName] = <IFeatureType>{
                    name: styleName,
                    showAllProperties: false,
                    style: {
                        fillColor: this.getFillColor(style),
                        strokeColor: this.getLineColor(style),
                        strokeWidth: this.getLineWidth(style),
                        stroke: true,
                        iconUri: this.getIcon(layer, style)
                    }
                };
                //console.log(toGeoJSON.xml2str(styleIndex[f.properties['featureTypeId']]));
            });
            this.initLayer(data, layer);
        }

        private getIcon(layer: csComp.Services.ProjectLayer, style) {
            try {
                var url: string = style.getElementsByTagName('href')[0].childNodes[0].nodeValue;
                return (url.match(/^http/i))
                    ? url
                    : layer.url.substr(0, layer.url.lastIndexOf('/')+1) + url;
            }
            catch(error) {
                return '';
            }
        }

        private getLineColor(style) {
            try {
                return '#' + style
                .getElementsByTagName('LineStyle')[0]
                .getElementsByTagName('color')[0]
                .childNodes[0].nodeValue;
            }
            catch(error) {
                return '#000000';
            }
        }

        private getLineWidth(style) {
            try {
                return +style
                .getElementsByTagName('LineStyle')[0]
                .getElementsByTagName('width')[0]
                .childNodes[0].nodeValue;
            }
            catch(error) {
                return 1;
            }
        }

        private getFillColor(style) {
            try {
                return '#' + style
                .getElementsByTagName('PolyStyle')[0]
                .getElementsByTagName('color')[0]
                .childNodes[0].nodeValue;
            }
            catch(error) {
                return '#ff0000';
            }
        }
    }
}
