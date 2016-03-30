module Idv {

    export interface ChartConfig {
        id?: string;
        enabled? : boolean;
        elementId?: string;
        containerId?: string;
        title?: string;
        bins? : number;
        type?: string;
        property?: string;
        properties? : string[];
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
        propertyTitle? : string;
        secondPropertyTitle? : string;
        record? : string;
        layer? : string;
        featureProperty? : string;
        featureTargetProperty? : string;
        filtered? : Function;
        _view : any;
        xaxis? : string;
        yaxis? : string;
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
        declare var vg;


    export class Idv {

        public static days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
        public static months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
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
        
            public reduceAddSum(properties : string[]) {
            return (p, v) => {
                ++p.count
                properties.forEach(pr=>{
                    var t = parseFloat(v[pr]);
                    if (t>p.max) p.max = t;
                    p[pr] += t;
                })                
                return p;
            };
        }
        public reduceRemoveSum(properties : string[]) {
            return (p, v) => {
                --p.count
                properties.forEach(pr=>{
                    var t = parseFloat(v[pr]);
                    if (t>p.max) p.max = t;
                    p[pr] -= t;
                })                
                //p.avg = p.sum / p.count;
                return p;
            };
        }
        public reduceInitSum(properties : string[]) {
            var r = {};
            properties.forEach(pr=>{
                r[pr] = 0;
            });
            return r;            
        }

        
   
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
                $("#" + this.config.containerId).empty(); 
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
 

            this.gridster = (<any>$("#" + this.config.containerId)).gridster({
                widget_margins: [5, 5],
                widget_base_dimensions: [this.defaultWidth - 20, 125],
                min_cols: 6,
                resize: {
                    enabled: false
                },
                autogrow_cols: true,
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
            
            this.triggerFilter(this.config.charts[0]);

           
            if (this.scope.$root.$$phase !== '$apply' && this.scope.$root.$$phase !== '$digest') { this.scope.$apply(); }


        }
        
        public enums : { [key : string] : string[]};
        
        public loadDataSource(done : Function)
        {
            
            done();
        }
        
        private resize()
        {
            $("#g-parent").css("height",$(window).height() - 100);   
              $("#g-parent").css("width",$(window).width() - 100);
        }


        public initCharts(scope: ng.IScope, layerService: csComp.Services.LayerService, prepare, done) {
            this.layerService = layerService;
            this.scope = scope;
            var store = 'records3';
            this.state = "Laden configuratie";
            
         
            
          $(window).resize(()=> {
              this.resize();
 });
            
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
            var cc = _.findWhere(this.config.charts, { id : id });
            if (!_.isUndefined(cc)) 
            {
                cc.chart.filterAll();                
                dc.renderAll();
            }
        }
        
        public resetAll()
        {
            this.config.charts.forEach(c=>{
                if (!_.isUndefined(c.chart)) c.chart.filterAll();
            });
            dc.renderAll();
        }
        
        public hasFilter(id) :  boolean
        {
            return true;
        }
        
        private addSearchWidget(config:Idv.ChartConfig)
        {
            this.createGridsterItem(config);
            config.dimension = this.ndx.dimension(d => {
                if (d.hasOwnProperty(config.property)) {
                    return d[config.property];
                } else return null;});
                
                var searchHtml = "<input class='searchbutton' id='#" + config.id + "'></input><div id='data-count'><span class='filter-count'></span> geselecteerd van de <span class='total-count'></span> " + config.record + "</div>";                
                 $("#" + config.elementId).html(searchHtml);
                 
                 
                    $(".searchbutton").keyup(e=>{
                        var id = e.target.id.replace('#','');
                        var filterString = (<any>e.target).value;
                        if (_.isUndefined(filterString)) return;
                        
                        var chart = <ChartConfig>_.findWhere(this.config.charts, { id : id});
                        if (!_.isUndefined(chart))
                        {
                             chart.dimension.filterFunction((d: string) => {
                                if (d != null && typeof d.toLowerCase === 'function') return (d.toLowerCase().indexOf(filterString.toLowerCase()) > -1);
                                    return false;
                                });
                                chart.dimension.top(Infinity);
                                dc.redrawAll();                            
                        }                  
                        this.triggerFilter(config);     
                           
                });
                var all = this.ndx.groupAll();
                (<any>dc).dataCount("#data-count").dimension(this.ndx).group(all); // set group to ndx.groupAll()  
        }
        
        public addSumCompare(config : Idv.ChartConfig)
        {
            this.createGridsterItem(config);
            
            var updateChart = (values : number[])=>{
                try {

                var vgspec = {
                    'width': 200,
                    'height': 200,
                    'data': [
                        {
                        'name': 'table',
                        'values': values,
                        'transform': [{'type': 'pie','field': 'value'}]
                        }
                    ],
                    'scales': [
                        {
                        'name': 'r',
                        'type': 'sqrt',
                        'domain': {'data': 'table','field': 'value'},
                        'range': [20,100]
                        } ,
                         {
      "name": "color",
      "type": "ordinal",
      "domain": {"data": "table", "field": "position"},
      "range": "category20"
    }
                    ],
                    'marks': [
                        {
                        'type': 'arc',
                        'from': {'data': 'table'},
                        'properties': {
                            'enter': {
                            'x': {'field': {'group': 'width'},'mult': 0.5},
                            'y': {'field': {'group': 'height'},'mult': 0.5},
                            'startAngle': {'field': 'layout_start'},
                            'endAngle': {'field': 'layout_end'},
                            'innerRadius': {'value': 20},
                            'outerRadius': {'scale': 'r','field': 'value'},
                            'stroke': {'value': '#fff'}
                            },
                            'update': {'fill': {"scale": "color", "field": "position"}},
                            'hover': {'fill': {'value': 'pink'}}
                        }
                        },
                        {
                        'type': 'text',
                        'from': {'data': 'table'},
                        'properties': {
                            'enter': {
                            'x': {'field': {'group': 'width'},'mult': 0.5},
                            'y': {'field': {'group': 'height'},'mult': 0.5},
                            'radius': {'scale': 'r','field': 'value','offset': 8},
                            'theta': {'field': 'layout_mid'},
                            'fill': {'value': '#000'},
                            'align': {'value': 'center'},
                            'baseline': {'value': 'middle'},
                            'text': {'field': 'title'}
                            }
                        }
                        },
                        {
                        'type': 'text',
                        'from': {'data': 'table'},
                        'properties': {
                            'enter': {
                            'x': {'field': {'group': 'width'},'mult': 0.5},
                            'y': {'field': {'group': 'height'},'mult': 0.5,'offset':-10},                            
                            'radius': {'scale': 'r','field': 'value','offset': 8},
                            'theta': {'field': 'layout_mid'},
                            'fill': {'value': '#000'},
                            'align': {'value': 'center'},
                            'baseline': {'value': 'middle'},
                            'text': {'field': 'value'}
                            }
                        }
                        }
                    ]
                };
                
                //parse(vgspec);
                if (vgspec)

                    var res = vg.embed("#" + config.elementId, vgspec, (view, vega_spec) => {
                        config._view = view;
                        $("#" + config.elementId).css("margin-left","30px");
                        //$('.vega-actions').css("display","none");
                        // Callback receiving the View instance and parsed Vega spec...
                        // The View resides under the '#vis' element
                    });
            } catch (e) {

            }
            }
             
            updateChart([]);
             
                                
            config.filtered = (result)=>{
                var res = { };
                config.properties.forEach(p=>res[p] = 0);
                result.forEach(i=>{
                   config.properties.forEach(p=>{ if (i.hasOwnProperty(p)) res[p] += Math.round(+i[p]) });                   
                }); 
                var values = [];
                var pos = 0;
                for (var i in res) {
                    if (res[i]>0) values.push({ title : i, value : res[i], position : pos});
                    pos+=1;
                }
                updateChart(values); 
            };
        }
        
        public addLayerLink(config : Idv.ChartConfig)
        {
            config.dimension = this.ndx.dimension((d)=> { return d[config.property] });
            config.group = config.dimension.group().reduceCount();
                    
            config.filtered = (result)=>{   
                if (!_.isUndefined(config.layer))
                {
                    var l = this.layerService.findLayer(config.layer);
                    if (!_.isUndefined(l) && l.enabled)
                    {
                        var mapping = {};
                        l.data.features.forEach(f=>{
                            if (f.properties.hasOwnProperty(config.featureProperty)) mapping[f.properties[config.featureProperty]] = f;
                            delete f.properties[config.featureTargetProperty]; 
                        }); 
                                        
                    
                        var res = config.group.all();
                        res.forEach(r=>{
                            if (mapping.hasOwnProperty(r.key))
                            {
                                var f = mapping[r.key];
                                f.properties[config.featureTargetProperty] = r.value;                                
                            }                         
                        });
                        this.layerService.updateLayerFeatures(l);
                        l.group.styles.forEach(s=>{
                            this.layerService.removeStyle(s);
                        })
                        this.layerService.setStyleForProperty(l,config.featureTargetProperty);
                    }
                }                              
                console.log('do filter with result');
            };
        }
        
        private addChartItem(config : Idv.ChartConfig)
        {
            this.createGridsterItem(config);
            if (!config.stat) config.stat = "count";
            switch (config.stat) {
                case "sum" :
                 config.dimension = this.ndx.dimension((d)=> { return d[config.property] });
                 config.group = config.dimension.group().reduceSum((d)=> {                     
                     return {totaal_mensen_auto : +d[config.property] };
                    });
                    switch (config.type)
                    {
                        case "pie": 
                            config.dimension = this.ndx.dimension(function(d) { return d; });
                            config.group = config.dimension.group().reduce(this.reduceAddSum(config.properties), this.reduceRemoveSum(config.properties), this.reduceInitSum(config.properties));
                            break;                        
                    } 
                    break;
                case "average":
                    switch (config.type)
                    {
                        case "row":
                            config.dimension = this.ndx.dimension(function(d) { return d[config.property] });
                            config.group = config.dimension.group().reduce(this.reduceAddAvg(config.secondProperty), this.reduceRemoveAvg(config.secondProperty), this.reduceInitAvg);
                            break;
                        case "line":
                        case "bar":
                            config.dimension = this.ndx.dimension((d) =>{ return d[config.time] });
                            config.group = config.dimension.group().reduce(this.reduceAddAvg(config.property), this.reduceRemoveAvg(config.property), this.reduceInitAvg);
                        case "time":
                            config.dimension = this.ndx.dimension((d) =>{ return d[config.time] });
                            config.group = config.dimension.group().reduce(this.reduceAddAvg(config.property), this.reduceRemoveAvg(config.property), this.reduceInitAvg);
                            break;
                    }                    
                    break;
                case "pie" :
                    config.dimension = config.dimension;
                    config.group = config.group; 
                    break;
                case "scatter" :
                    config.dimension = this.ndx.dimension((d)=> {
                        var r =+d[config.property]  
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
                    config.dimension = this.ndx.dimension((d)=> { return d[config.property] });
                    config.group = config.dimension.group().reduceCount();
                    break;
            }


            var width = (config.width * this.defaultWidth)-25;
            var height = (config.height * 125)-25;
            
            

            switch (config.type) {
                
                case "table":
                    var c = [];
                    config.columns.forEach((ci : any)=>{
                        c.push({ label : ci.title, format : (d)=> {
                            if (ci.hasOwnProperty("type") && ci["type"] === "number") return d3.round(d[ci.property],1);                                 
                            return d[ci.property] }
                        });
                    })
                    config.chart = dc.dataTable("#" + config.elementId);
                    config.chart  
                        .width(width)
                        .height(height)                   
                        .dimension(config.dimension) 
                        .group((d)=> {                    
                            var date = d[config.time];
                            return "";
                        })         
                        .columns(c)
                        .sortBy((d)=> {
                            return -d.Bezoekers;
                         })
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
                        .renderHorizontalGridLines(false)
                        .dimension(config.dimension)
                        .group(config.group)
                        .mouseZoomable(true)
                        .on('renderlet', function(chart) {
                            chart.selectAll('rect').on("click", function(d) {
                                
                                // console.log("click!", d);
                            });
                        });
                    break;
                case "pie":
                    config.chart = dc.pieChart("#" + config.elementId);
                    config.chart
                        .width(width)
                        .height(height)
                        .slicesCap(10)
                        .innerRadius(10)
                        .dimension(config.dimension)
                        .group(config.group)                                                
                    break;
                 case "bar":
                    config.chart = dc.barChart("#" + config.elementId);
                    config.chart
                        .width(width)
                        .height(height)
                        .x(d3.scale.linear())      
                        .centerBar(true)
                        .xUnits(function(){return 20;})                                          
                        .elasticX(true)                                                                                                
                        .elasticY(true)                                                                  
                        .renderHorizontalGridLines(true)
                        .dimension(config.dimension)
                        .group(config.group)                    
                        break;
                   case "stackedbar":
                    config.chart = dc.barChart("#" + config.elementId);
                    config.chart
                        .width(width)
                        .height(height)
                        .x(d3.scale.linear())      
                        .centerBar(false)
                        .xUnits(function(){return 20;})                                          
                        .elasticX(true)                                                                                                
                        .elasticY(true)                                                                  
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
                        .xAxis().ticks(4)

                    if (!config.ordering) config.ordering = "value";

                    switch (config.ordering) {

                        case "days":
                            config.chart.ordering(function(d) {
                                return Idv.days.indexOf(d.key);
                            });
                            break;
                            case "months":
                            config.chart.ordering(function(d) {
                                return Idv.months.indexOf(d.key);
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
            
            if (!_.isUndefined(config.xaxis)) { config.chart.xAxisLabel(config.xaxis);  }
            if (!_.isUndefined(config.yaxis)) { config.chart.yAxisLabel(config.yaxis);  }
            
            config.chart.on("filtered", (chart, filter)=>{
                    this.triggerFilter(config);     
            })
            
            if (config.stat === "average")
                    {
                        config.chart.valueAccessor(function(d) {
                            return d.value.avg;
                        })
                    }


            console.log("Add chart " + config.title);
        }
        
        private triggerFilter(config)
        {             
                var res = config.dimension.top(Infinity);
                 this.config.charts.forEach(c=> {
                     if (!_.isUndefined(c.filtered) && _.isFunction(c.filtered)){
                         c.filtered(res);
                     } 
                    //this.addChart(c)
                });        
        }        
                
        private createGridsterItem(config: Idv.ChartConfig)
        {
            var html = "<li style='padding:4px'><header class='chart-title'><div class='fa fa-ellipsis-v dropdown-toggle' data-toggle='dropdown'  style='float:right;cursor:pointer' type='button'></div>";
            html+="<ul class='dropdown-menu pull-right'><li class='dropdown-item'><a ng-click=\"resetFilter('" + config.id + "')\"'>reset filter</a></li><li class='dropdown-item'><a ng-click=\"resetAll()\">reset all filters</a></li><li class='dropdown-item'><a ng-click=\"disableFilter('" + config.id + "')\">disable filter</a></li>"; 
            html+="</ul>" + config.title + "</header><div id='" + config.elementId + "' ></li>";   
            (<any>this.scope).resetFilter = (id)=>{
                this.reset(id);                                
            }
            (<any>this.scope).resetAll = ()=>{
                this.resetAll();                                
            }
            (<any>this.scope).disableFilter = (id)=>{
                var c = _.findWhere(this.config.charts, { id : id});
                if (!_.isUndefined(c))
                {
                    c.enabled = false;
                    this.updateCharts();                    
                }                
            }
            var w = this.layerService.$compile(html)(this.scope);
            this.gridster.add_widget(w,config.width,config.height); //"<li><header class='chart-title'><div class='fa fa-times' style='float:right' ng-click='vm.reset()'></div>" + config.title + "</header><div id='" + config.elementId + "'></li>",config.width,config.height);
        }

        
        public addChart(config: Idv.ChartConfig) {
            
            if (typeof config.enabled === 'undefined') config.enabled = true;
            
            if (!config.enabled) return;

            if (!config.id) config.id = csComp.Helpers.getGuid();
            if (!config.containerId) config.containerId = this.config.containerId;
            config.elementId = "ddchart-" + config.id;
            if (!config.title) config.title = config.property;             
            if (!config.type) config.type = "row";
            
            switch (config.type)
            {
                case "search":
                    this.addSearchWidget(config);
                    break;
                case "layer":
                    this.addLayerLink(config);
                    break;
                case "sumcompare":
                    this.addSumCompare(config);
                    break;
                    
                default:
                    this.addChartItem(config);
                break;
            }            
        }

    }

}