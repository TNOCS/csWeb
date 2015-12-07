module csComp.Services {
    export class top10Generator implements IChartGenerator {

        private ctrl: ChartsWidget.ChartCtrl;
        private mb: MessageBusService;
        private options: any;

        constructor(
            private $layerService: Services.LayerService,
            private $dashboardService: Services.DashboardService
        ) {
            this.mb = this.$layerService.$messageBusService;
        }

        private layerSub;
        private styleSub;
        private style: GroupStyle;
        private layer: ProjectLayer;

        public start(ctrl: ChartsWidget.ChartCtrl) {


            this.ctrl = ctrl;
            this.options = ctrl.$scope.data.generator;

            ctrl.initChart();

            this.layerSub = this.mb.subscribe('layer', (title, layer) => {//, layer: csComp.Services.ProjectLayer) => {
                switch (title) {
                    case 'deactivated':
                        if (this.styleSub) this.mb.unsubscribe(this.styleSub);
                        break;
                    case 'activated':
                        this.layer = layer;
                        this.style = null;

                        if (!this.options.layer || layer.id === this.options.layer) {
                            this.styleSub = this.mb.subscribe('styles', (l, style: GroupStyle) => {
                                if (l === 'updatedstyle') {
                                    this.style = style;
                                    this.updateChart(this.layer);
                                }
                            })
                            //this.updateChart(this.layer);
                        }
                        break;
                }
            });



        }

        private updateChart(layer: ProjectLayer) {
            if (!layer || !layer.data || !this.style) return;                                 
            // set width/height using the widget width/height (must be set) 
            var width = parseInt(this.ctrl.widget.width.toLowerCase().replace('px', '').replace('%', '')) - 50;
            var height = parseInt(this.ctrl.widget.height.toLowerCase().replace('px', '').replace('%', '')) - 80;
            this.ctrl.$scope.data.lite = false;
            var values = [];

            layer.data.features.forEach((f: IFeature) => {
                if (f.properties.hasOwnProperty(this.style.property) && f.properties.hasOwnProperty(f.fType.style.nameLabel)) {
                    var pr = { "value": f.properties[this.style.property],"name": " " + f.properties[f.fType.style.nameLabel].toString() };
                    values.push(pr);
                }
            });

            this.ctrl.$scope.data.spec =
            {

                "width": width,
                "height": height,

                "padding": "auto",
                "data": [
                    {
                        "name": "source",
                        "values": _.first(_.sortBy(values, (v) => { return -v.value }), 10),
                        "format": { "type": "json", "parse": { "value": "number" } },
                        "transform": [{ "type": "filter", "test": "datum.value!==null" }]
                    },
                    {
                        "name": "layout",
                        "source": "source",
                        "transform": [
                            {
                                "type": "aggregate",
                                "summarize": [{ "field": "name", "ops": ["distinct"] }]
                            },
                            {
                                "type": "formula",
                                "field": "cellHeight",
                                "expr": "(datum.distinct_name + 1) * 21"
                            }
                        ]
                    }
                ],
                "marks": [
                    {
                        "name": "root",
                        "type": "group",
                        "from": { "data": "layout" },
                        "properties": {
                            "update": {
                                "width": { "value": 200 },
                                "height": { "field": "cellHeight" }
                            }
                        },
                        "marks": [
                            {
                                "type": "rect",
                                "properties": {
                                    "update": {
                                        "x": { "scale": "x", "field": "value" },
                                        "x2": { "value": 0 },
                                        "yc": { "scale": "y", "field": "name" },
                                        "height": { "value": 21, "offset": -1 },
                                        "fill": { "value": "#4682b4" }
                                    }
                                },
                                "from": { "data": "source" }
                            }
                        ],
                        "scales": [
                            {
                                "name": "x",
                                "type": "linear",
                                "domain": { "data": "source", "field": "value", "sort": true },
                                
                                "rangeMin": 0,
                                "rangeMax": 200,
                                "round": true,
                                "clamp": true,
                                "nice": true
                            },
                            {
                                "name": "y",
                                "type": "ordinal",
                                "domain": { "data": "source", "field": "name" },
                                "rangeMin": 0,
                                "rangeMax": { "data": "layout", "field": "cellHeight" },
                                "round": true,
                                "clamp": true,
                                "bandWidth": 21,
                                "padding": 1,
                                "points": true
                            }
                        ],
                        "axes": [
                            {
                                "type": "x",
                                "scale": "x",
                                "format": "s",
                                "grid": true,
                                "layer": "back",
                                "ticks": 5,
                                "title": "value"
                            },
                            {
                                "type": "y",
                                "scale": "y",
                                "grid": false,
                                "title": "name",
                                "properties": {
                                    "labels": {
                                        "text": { "template": "{{ datum.data | truncate:25}}" }
                                    }
                                }
                            }
                        ]
                    }
                ]
            };

            this.ctrl.$scope.data.title = this.style.title;
           // console.log(JSON.stringify(this.ctrl.$scope.data.spec));
                        
            // this.ctrl.updateChart();
            this.ctrl.initChart();
        }


        public stop() {
            this.mb.unsubscribe(this.layerSub);
            this.mb.unsubscribe(this.styleSub);

        }
    }
}
