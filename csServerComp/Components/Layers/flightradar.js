var http = require('http');
var FlightRadar;
(function (FlightRadar_1) {
    var FlightRadar = (function () {
        function FlightRadar(Connection, layerId) {
            this.Connection = Connection;
            this.layerId = layerId;
        }
        FlightRadar.prototype.GetDataSource = function () {
        };
        FlightRadar.prototype.updateNameById = function (obj, id, value) {
            try {
                if (obj == null)
                    return;
                var done = false;
                obj.some(function (o) {
                    if (o.properties != null && o.properties["id"] === id) {
                        o = value;
                        done = true;
                        return true;
                    }
                    else {
                        return false;
                    }
                });
                if (!done) {
                    obj.push(value);
                }
            }
            catch (e) {
                console.log('error');
            }
        };
        FlightRadar.prototype.CheckFeature = function (f) {
            this.updateNameById(FlightRadar.result.features, f["properties"]["id"], f);
            this.Connection.updateFeature(this.layerId, f);
        };
        FlightRadar.prototype.GetLayer = function (req, res) {
            if (FlightRadar.result != null)
                res.send(FlightRadar.result);
        };
        FlightRadar.prototype.Start = function () {
            var _this = this;
            FlightRadar.result = {
                "_id": "",
                "type": "FeatureCollection",
                "features": []
            };
            this.GetFlightData();
            setInterval(function () {
                _this.GetFlightData();
            }, 20000);
        };
        FlightRadar.prototype.GetFlightData = function () {
            var _this = this;
            try {
                var options = {
                    host: 'lhr.data.fr24.com',
                    path: '/zones/fcgi/feed.js?bounds=55.67283539294783,51.552131597019454,-1.5024902343745907,17.149658203125&faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=900&gliders=1&stats=1&'
                };
                var r = "";
                http.request(options, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (d) {
                        r += d;
                    });
                    res.on('end', function () {
                        if (!FlightRadar.result || !FlightRadar.result.features)
                            return;
                        FlightRadar.result.features.forEach(function (f) {
                            f.properties["Active"] = "false";
                        });
                        var b = JSON.parse(r);
                        for (var screen in b) {
                            var s = b[screen];
                            if (s[0] != "" && s[1] != null && s[2] != null && s[0] != null) {
                                var sit = {
                                    "type": "Feature",
                                    "geometry": { "type": "Point", "coordinates": [s[2], s[1]] },
                                    "properties": {
                                        "id": s[0],
                                        "FeatureTypeId": "plane",
                                        "Altitude": s[4],
                                        "Track": s[3],
                                        "Speed": s[5],
                                        "Squawk": s[6],
                                        "PlaneType": s[8],
                                        "Active": "true",
                                        "Time": new Date().getTime()
                                    }
                                };
                                _this.CheckFeature(sit);
                            }
                        }
                        var active = FlightRadar.result;
                        var deleted = [];
                        active.features = active.features.filter(function (f) {
                            if (f.properties["Active"] != "true")
                                deleted.push(f);
                            return f.properties["Active"] == "true";
                        });
                        deleted.forEach(function (f) {
                            _this.Connection.deleteFeature(_this.layerId, f);
                        });
                        FlightRadar.result = active;
                        FlightRadar.result._id = "Flightradar_" + new Date().getTime();
                        return FlightRadar.result;
                    });
                }).end();
            }
            catch (e) {
                return null;
            }
        };
        return FlightRadar;
    })();
    FlightRadar_1.FlightRadar = FlightRadar;
})(FlightRadar || (FlightRadar = {}));
module.exports = FlightRadar;
