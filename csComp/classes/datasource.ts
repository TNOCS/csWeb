module csComp.Services {

    export class SensorSet {
        id: string;
        title: string;
        type: string;
        propertyTypeKey : string;
        timestamps: number[];
        values: any[];
        activeValue: any;

        public addValue(date : number, value : number)
        {
          this.timestamps.push(date);
          this.values.push(value);
          this.activeValue = value;
        }
    }

    export class DataSource {
        id: string;
        url: string;
        /** static, dynamic */
        type : string;
        title: string;
        sensors: { (key: string): SensorSet };

        static merge_sensor(s1 : SensorSet,s2 : SensorSet) : SensorSet {
          var obj3 : SensorSet = new SensorSet();
          for (var attrname in s1) { obj3[attrname] = s1[attrname]; }
          for (var attrname in s2) { obj3[attrname] = s2[attrname]; }
          return obj3;
        }

        /**
         * Load JSON data.
         * @type {DataSource}
         *
         * @param ds {DataSource}
         * @param callback {Function}
         */
        public static LoadData(ds: DataSource, callback: Function) {
            if (ds.url != null) {
                $.getJSON(ds.url,(temp: DataSource) => {
                    if (temp != null) {
                        ds.id      = temp.id;
                        for (var s in temp.sensors) { if (temp.sensors.hasOwnProperty(s)) ds.sensors[s] = this.merge_sensor(ds.sensors[s],temp.sensors[s]); }                        
                        ds.title   = temp.title;
                        callback();
                    }
                });
            }
        }
    }
}
