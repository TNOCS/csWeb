module csComp.Services {

    export class SensorSet {
        id: string;
        title: string;
        type: string;
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
                        ds.sensors = temp.sensors;
                        ds.title   = temp.title;
                        callback();
                    }
                });
            }
        }
    }
}
