require('rootpath')();
﻿import express = require('express');
import http = require('http');
import DynamicProject = require("ServerComponents/dynamic/datasource");
import ClientConnection = require("ServerComponents/dynamic/ClientConnection");

module FlightRadar {



    export class FlightRadar  {

        public static result;

        constructor (public Connection: ClientConnection.ConnectionManager, public layerId : string)
        {
        }

        public GetDataSource()
        {

        }

        private updateNameById(obj, id, value) {
            try {
                if (obj == null)
                    return;
                var done = false;
                obj.some( (o)=> {
                    if (o.properties != null && o.properties["id"] === id) {
                        o = value;
                        done = true;
                        //  console.log('updating feature');
                        return true;
                    } else {
                        return false;
                    }
                });
                if (!done) {
                    // console.log('adding feature');
                    obj.push(value);
                }
            } catch (e) {
                console.log('error');
            }
        }

        private CheckFeature(f) {
            this.updateNameById(FlightRadar.result.features, f["properties"]["id"], f);
            this.Connection.updateFeature(this.layerId, f);

        }

        public GetLayer(req: express.Request, res: express.Response) {
            if (FlightRadar.result != null) res.send(FlightRadar.result);

            //res.send("postgres layer");
        }

        public Start() {
            FlightRadar.result = {
                "_id": "",
                "type": "FeatureCollection",
                "features": []
            };
            this.GetFlightData();
            setInterval(()=> {
                this.GetFlightData();
            }, 20000);
        }

        public GetFlightData(): any {
          try
          {
            var options = {
                host: 'lhr.data.fr24.com',
                path: '/zones/fcgi/feed.js?bounds=55.67283539294783,51.552131597019454,-1.5024902343745907,17.149658203125&faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=900&gliders=1&stats=1&'
            };

            var r = "";
            http.request(options, (res)=> {
                res.setEncoding('utf8');
                res.on('data', (d)=> {
                    r += d;
                });
                res.on('end',() => {
                    if (!FlightRadar.result || !FlightRadar.result.features) return;
                    FlightRadar.result.features.forEach((f)=> {
                        f.properties["Active"] = "false";
                    });

                    var b = JSON.parse(r);
                    for (var screen in b) {
                        var s = b[screen];
                        if (s[0] != "" && s[1] != null && s[2] != null && s[0] != null) {
                            var sit = {
                                "type": "Feature",
                                "geometry": { "type": "Point", "coordinates": [s[2], s[1], s[4]] },
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
                            this.CheckFeature(sit);
                            //result.features.push(sit);
                            //CheckFeature(sit, db);

                        }
                    }
                    var active = FlightRadar.result;
                    var deleted = [];
                    active.features = active.features.filter((f) => {
                        if (f.properties["Active"] != "true") deleted.push(f);
                        return f.properties["Active"] == "true";
                    });
                    deleted.forEach((f) => {
                        this.Connection.deleteFeature(this.layerId, f);
                    });

                    // send all deletes

                    FlightRadar.result = active;

                    //console.log(FlightRadar.result.features.length);
                    // ID to avoid having duplicate _id keys (still need to know why this happens)
                    FlightRadar.result._id = "Flightradar_" + new Date().getTime();

                    return FlightRadar.result;
                    //insertIntoDB(result);

                });
            }).end();
          }
          catch (e)
          {
            return null;
          }

        }
    }
}

export = FlightRadar;
