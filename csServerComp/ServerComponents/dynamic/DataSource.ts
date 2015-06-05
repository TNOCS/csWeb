import express = require('express');
import http = require('http');
import ClientConnection = require("ClientConnection");
import DynamicProject = require("DynamicProject");

module DataSource {
    export class SensorSet {
        title: string;
        type: string;
        timestamps: number[] = [];
        values: any[] = [];
        activeValue: any;

        constructor(public id: string) {
        }
    }

    export class DataSource {
        id: string;
        url: string; 
        /** static, dynamic */
        type: string;
        title: string;
        sensors: { [key: string]: SensorSet } = {};

        public static LoadData(ds: DataSource, callback: Function) {
            if (ds.url != null) {
                $.getJSON(ds.url, (temp: DataSource) => {
                    if (temp != null) {
                        ds.id = temp.id;
                        ds.sensors = temp.sensors;
                        ds.title = temp.title;
                        callback();
                    }
                    //var projects = data;
                });
            }
        }
    }

    export class DataSourceService implements DynamicProject.IDynamicLayer {
        public static result: DataSource;

        constructor(public Connection: ClientConnection.ConnectionManager, public layerId: string) {
            DataSourceService.result = new DataSource();
            DataSourceService.result.id = "datasource";

            DataSourceService.result.sensors["test"] = new SensorSet("test");
            DataSourceService.result.sensors["test2"] = new SensorSet("test2");
        }

        public GetLayer(req: express.Request, res: express.Response) {
        }

        public GetDataSource(req: express.Request, res: express.Response) {
            console.log('get DataSource');
            res.send(DataSourceService.result);
        }

        public updateSensorValue(ss: SensorSet, date: number, value: number) {
            ss.timestamps.push(date);
            ss.values.push(value);
            this.Connection.updateSensorValue(ss.id, date, value);
        }

        public Start() {
            setInterval(() => {
                for (var s in DataSourceService.result.sensors) {
                    var ds = DataSourceService.result.sensors[s];
                    this.updateSensorValue(ds, new Date().getTime(), Math.random() * 100);

                    if (ds.values.length > 20) {
                        ds.timestamps.shift();
                        ds.values.shift();
                    }
                }
            }, 5000);
        }
    }
}
export = DataSource;
