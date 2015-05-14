var DataSource;
(function (DataSource_1) {
    var SensorSet = (function () {
        function SensorSet(id) {
            this.id = id;
            this.timestamps = [];
            this.values = [];
        }
        return SensorSet;
    })();
    DataSource_1.SensorSet = SensorSet;
    var DataSource = (function () {
        function DataSource() {
            this.sensors = {};
        }
        DataSource.LoadData = function (ds, callback) {
            if (ds.url != null) {
                $.getJSON(ds.url, function (temp) {
                    if (temp != null) {
                        ds.id = temp.id;
                        ds.sensors = temp.sensors;
                        ds.title = temp.title;
                        callback();
                    }
                });
            }
        };
        return DataSource;
    })();
    DataSource_1.DataSource = DataSource;
    var DataSourceService = (function () {
        function DataSourceService(Connection, layerId) {
            this.Connection = Connection;
            this.layerId = layerId;
            DataSourceService.result = new DataSource();
            DataSourceService.result.id = "datasource";
            DataSourceService.result.sensors["test"] = new SensorSet("test");
            DataSourceService.result.sensors["test2"] = new SensorSet("test2");
        }
        DataSourceService.prototype.GetLayer = function (req, res) {
        };
        DataSourceService.prototype.GetDataSource = function (req, res) {
            console.log('get DataSource');
            res.send(DataSourceService.result);
        };
        DataSourceService.prototype.updateSensorValue = function (ss, date, value) {
            ss.timestamps.push(date);
            ss.values.push(value);
            this.Connection.updateSensorValue(ss.id, date, value);
        };
        DataSourceService.prototype.Start = function () {
            var _this = this;
            setInterval(function () {
                for (var s in DataSourceService.result.sensors) {
                    var ds = DataSourceService.result.sensors[s];
                    _this.updateSensorValue(ds, new Date().getTime(), Math.random() * 100);
                    if (ds.values.length > 20) {
                        ds.timestamps.shift();
                        ds.values.shift();
                    }
                }
            }, 5000);
        };
        return DataSourceService;
    })();
    DataSource_1.DataSourceService = DataSourceService;
})(DataSource || (DataSource = {}));
module.exports = DataSource;
