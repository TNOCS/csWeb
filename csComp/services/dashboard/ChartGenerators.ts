module csComp.Services {

    export interface IChartGenerator {
        start(ctrl: ChartsWidget.ChartCtrl);
        stop();
    }



    export class propertySensordataGenerator implements IChartGenerator {

        private ctrl: ChartsWidget.ChartCtrl;
        private mb: MessageBusService;
        private options: any;

        constructor(
            private $layerService: Services.LayerService,
            private $dashboardService: Services.DashboardService
        ) {
            this.mb = this.$layerService.$messageBusService;
        }

        public start(ctrl: ChartsWidget.ChartCtrl) {
            this.ctrl = ctrl;
            this.options = ctrl.$scope.data.generator;
            ctrl.widget.enabled = false;
            $("#" + this.ctrl.widget.elementId + "-container").css("display","none");
            this.mb.subscribe('timeline',(action : string, range : any)=>{
               if (action === "timeSpanUpdated" && this.lastSelectedFeature) this.selectFeature(this.lastSelectedFeature);
            });

            this.mb.subscribe('feature', (action: string, feature: any) => {
                switch (action) {
                    case 'onFeatureSelect':
                        this.selectFeature(feature);
                        break;
                    default:
                        break;
                }
            });

            ctrl.initChart();
        }
        
        private lastSelectedFeature : Feature;

        private selectFeature(f: Feature) {
            if (!f.sensors) {
                $("#" + this.ctrl.widget.elementId + "-container").css("display","none");
                return;}
            if (!this.options.hasOwnProperty("featureType") || this.options["featureType"] === f.fType.name) {
                $("#" + this.ctrl.widget.elementId + "-container").css("display","block");
                this.lastSelectedFeature = f;
                var properties = [];
                if (this.options.hasOwnProperty("properties")) {
                    // set width/height using the widget width/height (must be set) 
                    var width = parseInt(this.ctrl.widget.width.toLowerCase().replace('px', '').replace('%', '')) - 50;
                    var height = parseInt(this.ctrl.widget.height.toLowerCase().replace('px', '').replace('%', '')) - 75;
                    // make sure we have an array of properties
                    if (this.options.properties instanceof Array) {
                        properties = this.options.properties;
                    }
                    else if (this.options.properties instanceof String) {
                        properties = [this.options.properties];
                    }
                    var values = [];
                    
                    properties.forEach((p: string) => {
                        if (f.sensors.hasOwnProperty(p)) {
                            var i =0;
                            f.layer.timestamps.forEach(t=>{
                                var s = f.sensors[p][i];
                                if (s===-1) s = null;
                                if (f.sensors[p].length>i) values.push({x : t, y : s, c : 0});
                               i+=1; 
                            });
                            
                            //   f.sensors[p].forEach()
                        }
                    })
                    
                    this.ctrl.widget.enabled = false;
                    
                    var spec = {
                        "width": width,
                        "height": height,
                        "padding": { "top": 10, "left": 30, "bottom": 30, "right": 10 },
                        "data": [
                            {
                                "values": values,
                                "name": "table"
                            },
                            {
                                "name": "stats",
                                "source": "table",
                                "transform": [
                                    {
                                        "type": "aggregate",
                                        "groupby": ["x"],
                                        "summarize": [{ "field": "y", "ops": ["sum"] }]
                                    }
                                ]
                            }
                        ],
                        "scales": [
                            {
                                "name": "x",
                                "type": "time",
                                "range": "width",
                                "points": true,
                                "domain": { "data": "table", "field": "x" },
                                "domainMin" : this.$layerService.project.timeLine.start,
                                "domainMax" : this.$layerService.project.timeLine.end
                            },
                            {
                                "name": "y",
                                "type": "linear",
                                "range": "height",
                                "nice": true,
                                "domain": { "data": "stats", "field": "sum_y" }
                            },
                            {
                                "name": "color",
                                "type": "ordinal",
                                "range": "category10",
                                "domain": { "data": "table", "field": "c" }
                            }
                        ],
                        "axes": [
                            { "type": "x", "scale": "x" },
                            { "type": "y", "scale": "y" }
                        ],
                        "marks": [
                            {
                                "type": "group",
                                "from": {
                                    "data": "table",
                                    "transform": [
                                        { "type": "stack", "groupby": ["x"], "sortby": ["c"], "field": "y" },
                                        { "type": "facet", "groupby": ["c"] }
                                    ]
                                },
                                "marks": [
                                    {
                                        "type": "area",
                                        "properties": {
                                            "enter": {
                                                "interpolate": { "value": "monotone" },
                                                "x": { "scale": "x", "field": "x" },
                                                "y": { "scale": "y", "field": "layout_start" },
                                                "y2": { "scale": "y", "field": "layout_end" },
                                                "fill": { "scale": "color", "field": "c" }
                                            },
                                            "update": {
                                                "fillOpacity": { "value": 1 }
                                            },
                                            "hover": {
                                                "fillOpacity": { "value": 0.5 }
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    };
                    //console.log(JSON.stringify(spec));
                    this.ctrl.$scope.data.spec = spec;
                    this.ctrl.updateChart();
                }
            }


        }

        public stop() {
            //alert('stop');
        }
    }
    
    export class layerPropertySensordataGenerator implements IChartGenerator {

        private ctrl: ChartsWidget.ChartCtrl;
        private mb: MessageBusService;
        private options: any;
        private layer : ProjectLayer;

        constructor(
            private $layerService: Services.LayerService,
            private $dashboardService: Services.DashboardService
        ) {
            this.mb = this.$layerService.$messageBusService;
        }

        public start(ctrl: ChartsWidget.ChartCtrl) {
            this.ctrl = ctrl;
            this.options = ctrl.$scope.data.generator;
            this.mb.subscribe('timeline',(action : string, range : any)=>{
               if (action === "timeSpanUpdated") this.selectLayer(this.layer);
            });

            this.mb.subscribe('layer', (action: string, layer: any) => {
                
                switch (action) {
                    case 'onFeatureSelect':
                        
                        break;
                    default:
                        this.selectLayer(layer);
                        break;
                }
            });

            ctrl.initChart();
        }
        
        private selectLayer(layer : ProjectLayer) {
            this.layer = layer;
            if (this.options.hasOwnProperty("layer")) {               
                var properties = [];
                if (this.options.hasOwnProperty("properties")) {
                    // set width/height using the widget width/height (must be set) 
                    var width = parseInt(this.ctrl.widget.width.toLowerCase().replace('px', '').replace('%', '')) - 50;
                    var height = parseInt(this.ctrl.widget.height.toLowerCase().replace('px', '').replace('%', '')) - 75;
                    // make sure we have an array of properties
                    if (this.options.properties instanceof Array) {
                        properties = this.options.properties;
                    }
                    else if (this.options.properties instanceof String) {
                        properties = [this.options.properties];
                    }
                    var values = [];
                    
                    properties.forEach((p: string) => {
                        
                        layer.data.features.forEach((f : IFeature)=>{
                        if (f.sensors && f.sensors.hasOwnProperty(p)) {
                            var i =0;
                            f.layer.timestamps.forEach(t=>{
                                var s = f.sensors[p][i];
                                if (s===-1) s = null;
                                if (f.sensors[p].length>i) values.push({x : t, y : s, c : 0});
                               i+=1; 
                            });
                            
                            //   f.sensors[p].forEach()
                        }    
                        });
                        
                    })
                    
                    var spec = {
                        "width": width,
                        "height": height,
                        "padding": { "top": 10, "left": 30, "bottom": 30, "right": 10 },
                        "data": [
                            {
                                "values": values,
                                "name": "table"
                            },
                            {
                                "name": "stats",
                                "source": "table",
                                "transform": [
                                    {
                                        "type": "aggregate",
                                        "groupby": ["x"],
                                        "summarize": [{ "field": "y", "ops": ["sum"] }]
                                    }
                                ]
                            }
                        ],
                        "scales": [
                            {
                                "name": "x",
                                "type": "time",
                                "range": "width",
                                "points": true,
                                "domain": { "data": "table", "field": "x" },
                                "domainMin" : this.$layerService.project.timeLine.start,
                                "domainMax" : this.$layerService.project.timeLine.end
                            },
                            {
                                "name": "y",
                                "type": "linear",
                                "range": "height",
                                "nice": true,
                                "domain": { "data": "stats", "field": "sum_y" }
                            },
                            {
                                "name": "color",
                                "type": "ordinal",
                                "range": "category10",
                                "domain": { "data": "table", "field": "c" }
                            }
                        ],
                        "axes": [
                            { "type": "x", "scale": "x" },
                            { "type": "y", "scale": "y" }
                        ],
                        "marks": [
                            {
                                "type": "group",
                                "from": {
                                    "data": "table",
                                    "transform": [
                                        { "type": "stack", "groupby": ["x"], "sortby": ["c"], "field": "y" },
                                        { "type": "facet", "groupby": ["c"] }
                                    ]
                                },
                                "marks": [
                                    {
                                        "type": "area",
                                        "properties": {
                                            "enter": {
                                                "interpolate": { "value": "monotone" },
                                                "x": { "scale": "x", "field": "x" },
                                                "y": { "scale": "y", "field": "layout_start" },
                                                "y2": { "scale": "y", "field": "layout_end" },
                                                "fill": { "scale": "color", "field": "c" }
                                            },
                                            "update": {
                                                "fillOpacity": { "value": 1 }
                                            },
                                            "hover": {
                                                "fillOpacity": { "value": 0.5 }
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    };
                    //console.log(JSON.stringify(spec));
                    this.ctrl.$scope.data.spec = spec;
                    this.ctrl.updateChart();
                }
            }


        }

        public stop() {
            //alert('stop');
        }
    }
}