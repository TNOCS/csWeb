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

        private selectFeature(f: Feature) {
            if (!this.options.hasOwnProperty("featureType") || this.options["featureType"] === f.fType.name) {
                var properties = [];
                if (this.options.hasOwnProperty("properties"))
                {
                    // set width/height using the widget width/height (must be set) 
                    var width = parseInt(this.ctrl.widget.width.toLowerCase().replace('px','').replace('%',''))-50;
                    var height = parseInt(this.ctrl.widget.height.toLowerCase().replace('px','').replace('%',''))-50;
                    // make sure we have an array of properties
                    if (this.options.properties instanceof Array)
                    {
                        properties = this.options.properties;
                    }                    
                    else if (this.options.properties instanceof String)
                    {
                        properties = [this.options.properties];
                    }
                    var values = [];
                    properties.forEach((p : string)=>{
                        if (f.sensors.hasOwnProperty(p))
                        {
                         //   f.sensors[p].forEach()
                        }
                    })
                } //f.properties.hasOwnProperty(this.options.property)) {
                    
                    this.ctrl.$scope.data.spec = {
                        "width": width,
                        "height": height,
                        "padding": { "top": 10, "left": 30, "bottom": 30, "right": 10 },
                        "data": [
                            {
                                "name": "table",
                                "values": [
                                    { "x": 0, "y": 28, "c": 0 }, { "x": 0, "y": 55, "c": 1 },
                                    { "x": 1, "y": 43, "c": 0 }, { "x": 1, "y": 91, "c": 1 },
                                    { "x": 2, "y": 81, "c": 0 }, { "x": 2, "y": 53, "c": 1 },
                                    { "x": 3, "y": 19, "c": 0 }, { "x": 3, "y": 87, "c": 1 },
                                    { "x": 4, "y": 52, "c": 0 }, { "x": 4, "y": 48, "c": 1 },
                                    { "x": 5, "y": 24, "c": 0 }, { "x": 5, "y": 49, "c": 1 },
                                    { "x": 6, "y": 87, "c": 0 }, { "x": 6, "y": 66, "c": 1 },
                                    { "x": 7, "y": 17, "c": 0 }, { "x": 7, "y": 27, "c": 1 },
                                    { "x": 8, "y": 68, "c": 0 }, { "x": 8, "y": 16, "c": 1 },
                                    { "x": 9, "y": 49, "c": 0 }, { "x": 9, "y": 15, "c": 1 }
                                ]
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
                                "type": "ordinal",
                                "range": "width",
                                "points": true,
                                "domain": { "data": "table", "field": "x" }
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
                    this.ctrl.updateChart();

                }
            

        }

        public stop() {
            alert('stop');
        }
    }
}