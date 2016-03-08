module Idv {

    export interface ChartConfig {
        id?: string;
        enabled? : boolean;
        elementId?: string;
        containerId?: string;
        title?: string;
        bins? : number;
        type?: string;
        property: string;
        secondProperty? : string;
        dimension?: any;
        columns?:string[];
        group?: any;
        stat?: string;
        width?: number;
        height?: number;
        chart?: any;
        cap?: number;
        time? : string;
        ordering?: string;
    } 

    export interface ScanConfig {
        title? : string;
        containerId?: string;
        config?: string;
        data?: string;
        localStorage? : boolean;
        charts?: ChartConfig[];
    }

    declare var gridster;

    export class Idv {

        public static days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
        public config: ScanConfig;
        public ndx: CrossFilter.CrossFilter<any>;
        public gridster;
        public data : any;
        public state : string;
        public layerService : csComp.Services.LayerService;
        
        public storage : ng.localStorage.ILocalStorageService;
        

        public defaultWidth = 180;
        public DataLoaded: boolean;
        private scope: ng.IScope;

        public reduceAddAvg(attr) {
            return (p, v) => {
                ++p.count
                var t = parseFloat(v[attr]);
                if (t>p.max) p.max = t;
                p.sum += t;
                p.avg = p.sum / p.count;
                return p;
            };
        }
        public reduceRemoveAvg(attr) {
            return (p, v) => {
                --p.count
                p.sum -= parseFloat(v[attr]);
                p.avg = p.sum / p.count;
                return p;
            };
        }
        public reduceInitAvg() {
            return { count: 0, sum: 0, avg: 0, max : 0 };
        }
        
        public stop()
        {
            this.ndx = null;
            // this.config.charts.forEach(c=>{
            //     if (c.dimension) c.dimension.remove();
            //     if (c.group) c.group.remove();
                
               
            // });
            
        }
        
        public updateCharts() {
          
            if (this.gridster) {
                $(".gridster > ul").empty(); 
                this.gridster.destroy(); }
          

            $(".chart-title").css("visibility", "visible");


            function getTops(source_group, count) {
                return {
                    all: () => {
                        return source_group.top(count);
                    }
                };
            }

            var elastic = true;


 this.gridster = (<any>$(".gridster > ul")).gridster({
                widget_margins: [5, 5],
                widget_base_dimensions: [this.defaultWidth - 20, 250],
                min_cols: 6,
                resize: {
                    enabled: false
                },
                draggable: {
                    handle: 'header'
                }

            }).data('gridster');

            this.ndx = crossfilter(this.data);

            if (this.config.charts) {
                this.config.charts.forEach(c=> {
                    this.addChart(c)
                });
            }

            dc.renderAll();

           
            if (this.scope.$root.$$phase !== '$apply' && this.scope.$root.$$phase !== '$digest') { this.scope.$apply(); }


        }
        
        public enums : { [key : string] : string[]};
        
        public loadDataSource(done : Function)
        {
            
            done();
        }


        public initCharts(scope: ng.IScope, layerService: csComp.Services.LayerService, prepare, done) {
            this.layerService = layerService;
            this.scope = scope;
            var store = 'records3';
            this.state = "Laden configuratie";
            
            async.series([
                // get enums
                (cb) => {
                    if (typeof this.config.config !== 'undefined') {
                        
                        d3.json(this.config.config, (error, result) => {
                            if (!error) this.enums = result.Enums;
                            cb();
                        });
                    }
                    else {
                        cb();
                    }
                },
                // get data
                (cb) => {
                    this.state = "Laden data";
                    if (!window.indexedDB) {
                        window.alert("Deze browser is verouderd. Hierdoor zal de informatie trager laden");
                    }
                    else {
                        if (this.config.localStorage)
                        {
                        var request = window.indexedDB.open(this.config.data, 9);

                        request.onerror = (e=> {
                            
                            window.indexedDB.deleteDatabase(this.config.data);
                        });
                        request.onsuccess = (e=> {                            
                            var db = <IDBDatabase>(<any>event.target).result;                            
                            //if (!db.objectStoreNames.contains(store)) var objStore = db.createObjectStore(store, { autoIncrement : true });
                            if (db.objectStoreNames.contains(store)) {
                                
                                var experiments = [];
                                async.series(
                                    [(cb) => {
                                        db.transaction(store, 'readonly').objectStore(store).openCursor().onsuccess = (d) => {

                                            var r = <IDBCursorWithValue>(<IDBRequest>d.target).result;
                                            if (r) {
                                                var v = r.value;
                                                v.data.forEach(d=> experiments.push(d));
                                                //r.advance(1);                                        
                                                r.continue();
                                            }
                                            else {
                                                cb();
                                            }
                                        }},
                                            (cb) => {
                                                if (experiments.length > 0) {
                                                    this.parseData(experiments, prepare, done);
                                                    cb();
                                                }
                                                else {
                                                    this.state = "Verversen data";
                                                    d3.csv(this.config.data, (error, experiments) => {
                                                        this.state = "Opslaan data";
                                                        var s = db.transaction(store, "readwrite").objectStore(store);
                                                        var l = [];
                                                        var id = 0;
                                                        experiments.forEach(e=> {
                                                            l.push(e);
                                                            if (l.length > 100000) {
                                                                s.add({ id: id, data: l });
                                                                l = [];
                                                                id += 1;
                                                            }
                                                        });                                                        
                                                        this.parseData(experiments, prepare, done);
                                                        cb();
                                                    });
                                                }

                                            }]
                                    , (done) => {
                                        cb();
                                    });                                
                        }
                            else {
                            db.close();                            

                        }
                    });

            request.onupgradeneeded = (e=> {
                var db = <IDBDatabase>(<any>event.target).result;
                var objStore = db.createObjectStore(store, { keyPath: "id" });
            });
                        }
                        else{
                            d3.csv(this.config.data, (error, experiments) => {                                
                               this.parseData(experiments, prepare, done);
                               cb();                               
                            });
                        }
        }
    }], done=> {
        
    });

}
        
        public parseData(data, prepare, done) {
            this.state = "Verwerken data";            
            if (this.scope.$$phase !== '$apply' && this.scope.$$phase !== '$digest') { this.scope.$apply(); }    
                    
            this.data = data;
            this.DataLoaded = true;
            prepare(this.enums, data);

            this.updateCharts();
            done();
        }
        
        public reset(id)
        {            
            var cc = this.config.charts.filter(c=>{return c.elementId === id;});
            cc.forEach(c=>{
                c.chart.filterAll();                
              //c.dimension.filterAll();  
            })
            dc.renderAll();
        }


        public addChart(config: Idv.ChartConfig) {
            
            if (typeof config.enabled === 'undefined') config.enabled = true;
            
            if (!config.enabled) return;

            if (!config.id) config.id = csComp.Helpers.getGuid();
            if (!config.containerId) config.containerId = this.config.containerId;
            config.elementId = "ddchart-" + config.id;
            if (!config.title) config.title = config.property; 
            
            if (!config.type) config.type = "row";
            var w = this.layerService.$compile("<li><header class='chart-title'><div class='fa fa-times' style='float:right;cursor:pointer' ng-click='vm.scan.reset(\"" + config.elementId + "\")'></div>" + config.title + "</header><div id='" + config.elementId + "'></li>")(this.scope);
            this.gridster.add_widget(w,config.width,config.height); //"<li><header class='chart-title'><div class='fa fa-times' style='float:right' ng-click='vm.reset()'></div>" + config.title + "</header><div id='" + config.elementId + "'></li>",config.width,config.height);
            //$("#" + config.containerId).append(newChart);
            
         
            if (!config.stat) config.stat = "count";
            switch (config.stat) {
                case "average":
                    switch (config.type)
                    {
                        case "row":
                            config.dimension = this.ndx.dimension(function(d) { return d[config.property] });
                            config.group = config.dimension.group().reduce(this.reduceAddAvg(config.secondProperty), this.reduceRemoveAvg(config.secondProperty), this.reduceInitAvg);
                            break;
                        case "line":
                            config.dimension = this.ndx.dimension((d) =>{ return d[config.time] });
                            config.group = config.dimension.group().reduce(this.reduceAddAvg(config.property), this.reduceRemoveAvg(config.property), this.reduceInitAvg);
                        case "time":
                            config.dimension = this.ndx.dimension((d) =>{ return d[config.time] });
                            config.group = config.dimension.group().reduce(this.reduceAddAvg(config.property), this.reduceRemoveAvg(config.property), this.reduceInitAvg);
                            break;
                    }                    
                    break;
                case "scatter" :
                    config.dimension = this.ndx.dimension(function(d) {
                        var r =[+d[config.property],+d[config.secondProperty]]  
                        return r });
                    config.group = config.dimension.group();
                    break;
                case "time":
                    config.dimension = this.ndx.dimension((d) =>{ return d[config.time] });
                    break;  
                case "group":
                    if (!config.bins) config.bins = 20;
                    var n_bins = config.bins;
                    var xExtent = d3.extent(this.data, (d) => { return parseFloat(d[config.property]); });
                    var binWidth = (xExtent[1] - xExtent[0]) / n_bins;
                    config.dimension = this.ndx.dimension((d) => {
                        var c = Math.floor(parseFloat(d[config.property]) / binWidth) * binWidth; 
                        return c;    
                    }                         );
                    config.group = config.dimension.group().reduceCount();
                    break;                              
                case "count":
                    config.dimension = this.ndx.dimension(function(d) { return d[config.property] });
                    config.group = config.dimension.group().reduceCount();
                    break;
            }


            var width = config.width * this.defaultWidth;
            var height = config.height * 220;
            
            

            switch (config.type) {
                case "table":
                    config.chart = dc.dataTable("#" + config.elementId);
                    config.chart                     
                        .dimension(config.dimension) 
                    .group((d)=> {
                    //      var format = d3.format('02d');
                        var date = d[config.time];
                        return "hoi";
            }) 
        
        // (_optional_) max number of records to be shown, `default = 25`
        .size(18)
        // There are several ways to specify the columns; see the data-table documentation.
        // This code demonstrates generating the column header automatically based on the columns.
        .columns(config.columns)

        // (_optional_) sort using the given field, `default = function(d){return d;}`
        .sortBy(function (d) {
            return d[config.time];
        })
        // (_optional_) sort order, `default = d3.ascending`
        .order(d3.ascending);        
                    break;
                case "time":
                    config.chart = dc.lineChart("#" + config.elementId);
                    config.chart
                        .width(width)
                        .height(height)
                        .x(d3.time.scale().domain([new Date(2011, 0, 1), new Date(2016, 11, 31)]))
                        .elasticX(true)
                        .elasticY(true)
                        .mouseZoomable(true)
                        .renderHorizontalGridLines(true)
                        .brushOn(true)
                        .dimension(config.dimension)
                        .group(function (d) {
                          //var format = d3.format('02d');
                            return d[config.time];
                        })                        
                        .renderHorizontalGridLines(true)
                        .on('renderlet', function(chart) {
                            chart.selectAll('rect').on("click", function(d) {
                                // console.log("click!", d);
                            });
                        });
                    break;
                case "line":
                    config.chart = dc.lineChart("#" + config.elementId);
                    config.chart
                        .width(width)
                        .height(height)
                        .x(d3.scale.linear())
                        .elasticX(true)
                        .elasticY(true)                        
                        .renderHorizontalGridLines(true)
                        .dimension(config.dimension)
                        .group(config.group)
                        .mouseZoomable(true)
                        .on('renderlet', function(chart) {
                            chart.selectAll('rect').on("click", function(d) {
                                // console.log("click!", d);
                            });
                        });
                    break;
                 case "bar":
                    config.chart = dc.barChart("#" + config.elementId);
                    config.chart
                        .width(width)
                        .height(height)
                        .x(d3.scale.linear())
                        .elasticX(true)                                                                                                
                        .elasticY(true)  
                        .gap(1)                      
                        .renderHorizontalGridLines(true)
                        .dimension(config.dimension)
                        .group(config.group)

                    
                    break;
                    case "scatter":
                      config.chart = dc.scatterPlot("#" + config.elementId);
                      config.chart
                        .width(width)
                        .height(height)
                        .symbolSize(3)
                        .x(d3.scale.linear())
                        .y(d3.scale.linear())  
                        .elasticX(true)
                        .elasticY(true)                                                                                                
                        .dimension(config.dimension)
                        .group(config.group)

                    
                    break;
         
                case "row":
                    config.chart = dc.rowChart("#" + config.elementId);
                    config.chart
                        .width(width)
                        .height(height)
                        .gap(1)
                        .elasticX(true)
                        .dimension(config.dimension)
                        .group(config.group)

                    if (!config.ordering) config.ordering = "value";

                    switch (config.ordering) {

                        case "days":
                            config.chart.ordering(function(d) {
                                return Idv.days.indexOf(d.key);
                            });
                            break;
                        case "value":
                            config.chart.ordering(function(d) {
                                return -d.value;
                            });

                            break;
                    }
                    
                    

                    if (config.cap) config.chart.cap(config.cap);
                    break;
            }
            
            if (config.stat === "average")
                    {
                        config.chart.valueAccessor(function(d) {
                            return d.value.avg;
                        })
                    }


            console.log("Add chart " + config.title);
        }

    }

}