module csComp.Services {
    
    

    export class SensorSet {
        id: string;
        title: string;
        type: string;
        timestamps: number[];
        values: any[];
        activeValue: any; 
    }

    export class DataSource {
        id: string;
        url: string;
        title: string;
        sensors: { (key: string): SensorSet };        

        public static LoadData(ds: DataSource, callback: Function) {
            if (ds.url != null) {
                $.getJSON(ds.url,(temp: DataSource) => {
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
} 