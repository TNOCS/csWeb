/* Terminator.js -- Overlay day/night region on a Leaflet map
 * Source: https://github.com/joergdietrich/Leaflet.Terminator/blob/master/L.Terminator.js
 * See also: http://joergdietrich.github.io/Leaflet.Terminator/
 http://www.lizard-tail.com/isana/lab/astro_calc/terminator.html,
 http://stackoverflow.com/questions/7100718/calculating-an-overlay-of-day-night-for-google-maps,
 https://github.com/rossengeorgiev/nite-overlay,
 http://mathematica.stackexchange.com/questions/3326/composition-how-to-make-a-day-and-night-world-map
*/

(<any>L).Terminator = <any>L.Polygon.extend(<any>{
    options: {
        color: '#00',
        opacity: 0.5,
        fillColor: '#00',
        fillOpacity: 0.5,
        resolution: 2,
        showNight: true
    },

    initialize: function(options) {
        this.version = '0.1.0';
        this._R2D = 180 / Math.PI;
        this._D2R = Math.PI / 180;
        L.Util.setOptions(this, options);
        var latLng = this._compute(this.options.showNight, this.options.time || null)
        this.setLatLngs(latLng);
    },

    setTime: function(date) {
        this.options.time = date;
        var latLng = this._compute(this.options.showNight, date || null)
        this.setLatLngs(latLng);
    },

    _sunEclipticPosition: function(julianDay) {
        /* Compute the position of the Sun in ecliptic coordinates at
           julianDay.  Following
           http://en.wikipedia.org/wiki/Position_of_the_Sun */
        // Days since start of J2000.0
        var n = julianDay - 2451545.0;
        // mean longitude of the Sun
        var L = 280.460 + 0.9856474 * n;
        L %= 360;
        // mean anomaly of the Sun
        var g = 357.528 + 0.9856003 * n;
        g %= 360;
        // ecliptic longitude of Sun
        var lambda = L + 1.915 * Math.sin(g * this._D2R) +
            0.02 * Math.sin(2 * g * this._D2R);
        // distance from Sun in AU
        var R = 1.00014 - 0.01671 * Math.cos(g * this._D2R) -
            0.0014 * Math.cos(2 * g * this._D2R);
        return { "lambda": lambda, "R": R };
    },

    _eclipticObliquity: function(julianDay) {
        // Following the short term expression in
        // http://en.wikipedia.org/wiki/Axial_tilt#Obliquity_of_the_ecliptic_.28Earth.27s_axial_tilt.29
        var n = julianDay - 2451545.0;
        // Julian centuries since J2000.0
        var T = n / 36525;
        var epsilon = 23.43929111 -
            T * (46.836769 / 3600
                - T * (0.0001831 / 3600
                    + T * (0.00200340 / 3600
                        - T * (0.576e-6 / 3600
                            - T * 4.34e-8 / 3600))));
        return epsilon;
    },

    _sunEquatorialPosition: function(sunEclLng, eclObliq) {
        /* Compute the Sun's equatorial position from its ecliptic
         * position. Inputs are expected in degrees. Outputs are in
         * degrees as well. */
        var alpha = Math.atan(Math.cos(eclObliq * this._D2R)
            * Math.tan(sunEclLng * this._D2R)) * this._R2D;
        var delta = Math.asin(Math.sin(eclObliq * this._D2R)
            * Math.sin(sunEclLng * this._D2R)) * this._R2D;

        var lQuadrant = Math.floor(sunEclLng / 90) * 90;
        var raQuadrant = Math.floor(alpha / 90) * 90;
        alpha = alpha + (lQuadrant - raQuadrant);

        return { "alpha": alpha, "delta": delta };
    },

    _hourAngle: function(lng, sunPos, gst) {
        /* Compute the hour angle of the sun for a longitude on
         * Earth. Return the hour angle in degrees. */
        var lst = gst + lng / 15;
        return lst * 15 - sunPos.alpha;
    },

    _latitude: function(ha, sunPos) {
        /* For a given hour angle and sun position, compute the
         * latitude of the terminator in degrees. */
        var lat = Math.atan(-Math.cos(ha * this._D2R) /
            Math.tan(sunPos.delta * this._D2R)) * this._R2D;
        return lat;
    },

    _compute: function(showNight: boolean, time) {
        if (time == null)
            var today = new Date();
        else
            var today = new Date(time);
        var julianDay = today.getJulian();
        var gst = today.getGMST();
        var latLng = [];
        var ha, lat;

        var sunEclPos = this._sunEclipticPosition(julianDay);
        var eclObliq = this._eclipticObliquity(julianDay);
        var sunEqPos = this._sunEquatorialPosition(sunEclPos.lambda, eclObliq);
        for (var i = 0; i <= 720 * this.options.resolution; i++) {
            var lng = -360 + i / this.options.resolution;
            ha = this._hourAngle(lng, sunEqPos, gst);
            lat = this._latitude(ha, sunEqPos);
            latLng[i + 1] = [lat, lng];
        }
        if (showNight) {
            if (sunEqPos.delta < 0) {
                latLng[0] = [90, -360];
                latLng[latLng.length] = [90, 360];
            } else {
                latLng[0] = [-90, -360];
                latLng[latLng.length] = [-90, 360];
            }
        } else {
            if (sunEqPos.delta < 0) {
                latLng[0] = [-90, -360];
                latLng[latLng.length] = [-90, 360];
            } else {
                latLng[0] = [90, -360];
                latLng[latLng.length] = [90, 360];
            }
        }
        return latLng;
    }
});


module csComp.Services {
    'use strict'

    export interface INightDayDataSourceParameters extends IProperty {
        /**
         * Show the night (default) or day area.
         */
        showNight: boolean;
        /** Title to show in the tooltip of the day area (default="Day")*/
        dayName: string;
        /** Title to show in the tooltip of the night area (default="Night")*/
        nightName: string;
        /**
         * Set a property value for the area (default: intensity = 0)
         */
        value: number;
    }

    export class NightDayDataSource extends csComp.Services.GeoJsonSource {
        title = "Day Night regions on the Earth";

        constructor(public service: csComp.Services.LayerService, $http: ng.IHttpService, $storage: ng.localStorage.ILocalStorageService) {
            super(service, $http, $storage);
        }

        public addLayer(layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void) {
            this.layer = layer;
            layer.isLoading = true;
            layer.count = 0;

            var defaultValue = 0;

            // Check if an url to a file containing the intensity value is specified. If so, set it as defaultValue.
            if (layer.url) {
                this.$http.get(layer.url)
                    .then((res: {data: any}) => {
                        let data = res.data;
                        defaultValue = parseFloat(data.toString());
                        this.continueInit(defaultValue, layer, callback);
                    })
                    .catch(() => {
                        console.log('Error reading day/night intensity file');
                        this.continueInit(defaultValue, layer, callback);
                    });
            } else {
                this.continueInit(defaultValue, layer, callback);
            }
        }

        private continueInit(defaultValue: number, layer: csComp.Services.ProjectLayer, callback: (layer: csComp.Services.ProjectLayer) => void) {
            var showNight = true;
            var nightName = 'Night';
            var dayName = 'Day';

            if (typeof layer.dataSourceParameters !== 'undefined') {
                var gridParams = <INightDayDataSourceParameters>layer.dataSourceParameters;
                if (typeof gridParams.showNight !== 'undefined') showNight = gridParams.showNight;
                if (typeof gridParams.nightName !== 'undefined') nightName = gridParams.nightName;
                if (typeof gridParams.dayName !== 'undefined') dayName = gridParams.dayName;
                if (typeof gridParams.value !== 'undefined') defaultValue = gridParams.value;
            }
            var terminator = new (<any>L).Terminator({ "showNight": showNight });
            var geojson = terminator.toGeoJSON();
            if (showNight) {
                geojson.properties["Name"] = nightName;
                geojson.properties["night_intensity"] = defaultValue;
            } else {
                geojson.properties["Name"] = dayName;
                geojson.properties["day_intensity"] = defaultValue;
            }

            var features: csComp.Helpers.IGeoFeature[] = [];
            features.push({
                type: "Feature",
                geometry: geojson.geometry,
                properties: geojson.properties
            });
            layer.data = csComp.Helpers.GeoExtensions.createFeatureCollection(features);

            if (layer.data.geometries && !layer.data.features) {
                layer.data.features = layer.data.geometries;
            }
            layer.data.features.forEach((f: IFeature) => {
                this.service.initFeature(f, layer, false, false);
            });

            layer.isLoading = false;
            callback(layer);
        }
    }
}
