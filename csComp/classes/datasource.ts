module csComp.Services {

    export interface ISensorLinkResult {
        features : string[];
        timestamps: number[];
        kpis :{[sensor : string ] : number[]}; 
        data: {[sensor : string ] : number[][]};
        properties: string[];
        timeAggregation: string;
    }

    export class SensorSet {
        id: string;
        title: string;
        type: string;
        propertyTypeKey: string;
        propertyType: IPropertyType;
        timestamps: number[];
        values: any[];
        activeValue: any;
        max: number = 100;
        min: number = 0;

        public activeValueText(): string {
            return Helpers.convertPropertyInfo(this.propertyType, this.activeValue);
        }

        public addValue(date: number, value: any) {
            this.timestamps.push(date);
            this.values.push(value);
            this.activeValue = value;
        }

        /**
         * Serialize the project to a JSON string.
         */
        public serialize(): string {
            return JSON.stringify(SensorSet.serializeableData(this), (key: string, value: any) => {
                // Skip serializing certain keys
                return value;
            }, 2);
        }

        /**
         * Returns an object which contains all the data that must be serialized.
         */
        public static serializeableData(d: SensorSet): Object {
            return {
                id: d.id,
                title: d.title,
                type: d.type,
                propertyTypeKey: d.propertyTypeKey
            }
        }
    }

    export class DataSource {
        id: string;
        url: string;
        /** static, dynamic */
        type: string;
        title: string;
        sensors: { [key: string]: SensorSet } = {};

        static merge_sensor(s1: SensorSet, s2: SensorSet): SensorSet {
            var obj3: SensorSet = new SensorSet();
            for (var attrname in s1) { obj3[attrname] = s1[attrname]; }
            for (var attrname in s2) { obj3[attrname] = s2[attrname]; }
            return obj3;
        }

        /**
         * Returns an object which contains all the data that must be serialized.
         */
        public static serializeableData(d: DataSource): Object {
            var res = {
                id: d.id,
                url: d.url,
                type: d.type,
                title: d.title,
                sensors: {}
                //sensors: csComp.Helpers.serialize<DataSource>(d.sensors, SensorSet.serializeableData)
            }
            //for (var ss in d.sensors) res.sensors[ss] = d.sensors[ss].serialize();
            return res;
        }

        /**
         * Load JSON data.
         * @type {DataSource}
         *
         * @param $http {ng.IHttpService}
         * @param ds {DataSource}
         * @param callback {Function}
         */
        public static LoadData($http: ng.IHttpService, ds: DataSource, callback: Function) {
            if (ds.url != null) {
                $http.get(ds.url)
                    .then((res: {data: DataSource}) => {
                        let temp = res.data;
                        if (temp != null) {
                            ds.id = temp.id;
                            if (!ds.hasOwnProperty('sensors')) {
                                ds.sensors = temp.sensors;
                            } else {
                                for (var s in temp.sensors) {
                                    if (temp.sensors.hasOwnProperty(s)) {
                                        ds.sensors[s] = this.merge_sensor(ds.sensors[s], temp.sensors[s]);
                                    }
                                }
                            }
                            ds.title = temp.title;
                            callback();
                        }
                    })
                    .catch(() => { console.log('Error on Data source -- do something ?'); });
            }
        }
    }
}
