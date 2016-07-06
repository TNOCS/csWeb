module csComp.Services {

    export interface IChartGenerator {
        start(ctrl: ChartsWidget.ChartCtrl);
        stop();
    }

    export class PropertyBarChartGenerator implements IChartGenerator {

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
            $("#" + this.ctrl.widget.elementId + "-container").css("display", "none");


            this.mb.subscribe('feature', (action: string, feature: any) => {
                if (this.options.hasOwnProperty('trigger') && this.options['trigger'].toLowerCase() === 'hover' && action === 'onFeatureHover') this.selectFeature(feature);
                if (this.options.hasOwnProperty('trigger') && this.options['trigger'].toLowerCase() === 'click' && action === 'onFeatureSelect') this.selectFeature(feature);
            });

            ctrl.initChart();
        }

        private lastSelectedFeature: Feature;

        private selectFeature(f: Feature) {

            if (!this.options.hasOwnProperty("featureType") || this.options["featureType"] === f.fType.name) {
                $("#" + this.ctrl.widget.elementId + "-container").css("display", "block");
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
                    var timestamps = [];

                    properties.forEach(p => {
                        if (f.properties.hasOwnProperty(p)) {
                            values.push({ category: p, position: 0, value: f.properties[p] });
                        }
                    })



                    this.ctrl.widget.enabled = false;

                    var spec = {
                        "width": width,
                        "height": height,
                        "padding": { "top": 10, "left": 30, "bottom": 30, "right": 10 },
                        "data": [
                            {
                                "name": "table",
                                "values": values
                            }
                        ],
                        "scales": [
                            {
                                "name": "cat",
                                "type": "ordinal",
                                "domain": {
                                    "data": "table",
                                    "field": "category"
                                },
                                "range": "height",
                                "padding": 0.2
                            },
                            {
                                "name": "val",
                                "type": "linear",
                                "domain": {
                                    "data": "table",
                                    "field": "value"
                                },
                                "range": "width",
                                "round": true,
                                "nice": true
                            },
                            {
                                "name": "color",
                                "type": "ordinal",
                                "domain": {
                                    "data": "table",
                                    "field": "position"
                                },
                                "range": "category20"
                            }
                        ],
                        "axes": [
                            {
                                "type": "y",
                                "scale": "cat",
                                "tickSize": 0,
                                "tickPadding": 8
                            }
                        ],
                        "marks": [
                            {
                                "type": "group",
                                "from": {
                                    "data": "table",
                                    "transform": [
                                        {
                                            "type": "facet",
                                            "groupby": [
                                                "category"
                                            ]
                                        }
                                    ]
                                },
                                "properties": {
                                    "enter": {
                                        "y": {
                                            "scale": "cat",
                                            "field": "key"
                                        },
                                        "height": {
                                            "scale": "cat",
                                            "band": true
                                        }
                                    }
                                },
                                "scales": [
                                    {
                                        "name": "pos",
                                        "type": "ordinal",
                                        "range": "height",
                                        "domain": {
                                            "field": "position"
                                        }
                                    }
                                ],
                                "marks": [
                                    {
                                        "name": "bars",
                                        "type": "rect",
                                        "properties": {
                                            "enter": {
                                                "y": {
                                                    "scale": "pos",
                                                    "field": "position"
                                                },
                                                "height": {
                                                    "scale": "pos",
                                                    "band": true
                                                },
                                                "x": {
                                                    "scale": "val",
                                                    "field": "value"
                                                },
                                                "x2": {
                                                    "scale": "val",
                                                    "value": 0
                                                },
                                                "fill": {
                                                    "scale": "color",
                                                    "field": "position"
                                                }
                                            }
                                        }
                                    },
                                    {
                                        "type": "text",
                                        "from": {
                                            "mark": "bars"
                                        },
                                        "properties": {
                                            "enter": {
                                                "x": {
                                                    "field": "x2",
                                                    "offset": -15
                                                },
                                                "y": {
                                                    "field": "y"
                                                },
                                                "dy": {
                                                    "field": "height",
                                                    "mult": 0.5
                                                },
                                                "fill": {
                                                    "value": "white"
                                                },
                                                "align": {
                                                    "value": "right"
                                                },
                                                "baseline": {
                                                    "value": "middle"
                                                },
                                                "text": {
                                                    "field": "datum.value"
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }

                    //console.log(JSON.stringify(spec));
                    this.ctrl.$scope.data._spec = spec;
                    this.ctrl.updateChart();
                }
            }


        }

        public stop() {
            //alert('stop');
        }
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
            $("#" + this.ctrl.widget.elementId + "-container").css("display", "none");
            this.mb.subscribe('timeline', (action: string, range: any) => {
                if (action === "sensorLinkUpdated" && this.lastSelectedFeature) this.selectFeature(this.lastSelectedFeature);
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

            if (this.$layerService.lastSelectedFeature) this.selectFeature(<Feature>this.$layerService.lastSelectedFeature);

            ctrl.initChart();
        }

        private lastSelectedFeature: Feature;

        private selectFeature(f: Feature) {
            if (!f.sensors) {
                $("#" + this.ctrl.widget.elementId + "-container").css("display", "none");
                return;
            }
            if (!this.options.hasOwnProperty("featureType") || this.options["featureType"] === f.fType.name) {
                $("#" + this.ctrl.widget.elementId + "-container").css("display", "block");
                this.lastSelectedFeature = f;
                var properties = [];
                if (this.options.hasOwnProperty("properties")) {
                    // set width/height using the widget width/height (must be set)
                    var width = parseInt(this.ctrl.widget._width.toLowerCase().replace('px', '').replace('%', '')) - 50;
                    var height = parseInt(this.ctrl.widget._height.toLowerCase().replace('px', '').replace('%', '')) - 75;
                    // make sure we have an array of properties
                    if (this.options.properties instanceof Array) {
                        properties = this.options.properties;
                    }
                    else if (this.options.properties instanceof String) {
                        properties = [this.options.properties];
                    }
                    var values = [];
                    var timestamps = [];
                    this.ctrl.$scope.data._csv = "";

                    properties.forEach((p: any) => {
                        var title, source;
                        if (typeof p === 'string')
                        {
                            title = source = p;
                        }
                        else
                        {
                            title = p.label;
                            source = p.source;
                        }
                        if (f.sensors.hasOwnProperty(source)) {
                            var i = 0;
                            if (f.timestamps) {
                                f.timestamps.forEach(t => {
                                    timestamps = f.timestamps;
                                    var s = f.sensors[source][i];
                                    if (s === -1) s = null;
                                    if (f.sensors[source].length > i) {
                                        values.push({ x: t, y: s, c: title });
                                        this.ctrl.$scope.data._csv += new Date(t).toLocaleString() + ',' + s + '\n';
                                    }
                                    i += 1;
                                });
                            }
                            else if (f.layer.timestamps) {
                                f.layer.timestamps.forEach(t => {
                                    timestamps = f.layer.timestamps;
                                    var s = f.sensors[source][i];
                                    if (s === -1) s = null;
                                    if (f.sensors[source].length > i) {
                                        values.push({ x: t, y: s, c: title });
                                        this.ctrl.$scope.data._csv += new Date(t).toLocaleString() + ',' + s + '\n';
                                    }
                                    i += 1;
                                });
                            }

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
                                "domainMin": timestamps[0],
                                "domainMax": timestamps[timestamps.length - 1]
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
                            { "type": "x", "scale": "x", "ticks": 4 },
                            { "type": "y", "scale": "y","ticks": 4 }
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
                                        "type": "line",
                                        "properties": {
                                            "enter": {
                                                "interpolate": { "value": "monotone" },
                                                "x": { "scale": "x", "field": "x" },
                                                "y": { "scale": "y", "field": "y" },
                                                "stroke": { "scale": "color", "field": "c" },
                                                "strokeWidth": { "value": 2 }
                                            },
                                            "update": {
                                                "strokeOpacity": { "value": 1 }
                                            },
                                            "hover": {
                                                "strokeOpacity": { "value": 0.5 }
                                            }
                                        }
                                    }
                                ],
                                "legends": [
                                    {
                                        "fill": "color",
                                        "offset": 0
                                    }
                                ]
                            }
                        ]
                    };
                    //console.log(JSON.stringify(spec));
                    this.ctrl.$scope.data._spec = spec;
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
        private layer: ProjectLayer;

        constructor(
            private $layerService: Services.LayerService,
            private $dashboardService: Services.DashboardService
        ) {
            this.mb = this.$layerService.$messageBusService;
        }

        public start(ctrl: ChartsWidget.ChartCtrl) {
            this.ctrl = ctrl;
            this.options = ctrl.$scope.data.generator;
            this.mb.subscribe('timeline', (action: string, range: any) => {
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

        private selectLayer(layer: ProjectLayer) {
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
                    var mintime;
                    var maxtime;

                    properties.forEach((p: any) => {
                        var title, source;
                        if (typeof p === 'string')
                        {
                            title = source = p;
                        }
                        else
                        {
                            title = p.label;
                            source = p.source;
                        }
                        layer.data.features.forEach((f: IFeature) => {
                            if (f.sensors && f.sensors.hasOwnProperty(p)) {
                                var i = 0;
                                f.layer.timestamps.forEach(t => {
                                    if (typeof mintime === 'undefined' || mintime > t) mintime = t;
                                    if (typeof mintime === 'undefined' || maxtime < t) maxtime = t;
                                    var s = f.sensors[source][i];
                                    if (s === -1) s = null;
                                    if (f.sensors[source].length > i) values.push({ x: t, y: s, c: title });
                                    i += 1;
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
                                "domainMin": mintime,
                                "domainMax": maxtime
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
                            { "type": "x", "scale": "x", "ticks": 4 },
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
                    this.ctrl.$scope.data._spec = spec;
                    this.ctrl.updateChart();
                }
            }


        }

        public stop() {
            //alert('stop');
        }
    }

    export class layerKpiGenerator implements IChartGenerator {

        private ctrl: ChartsWidget.ChartCtrl;
        private mb: MessageBusService;
        private options: any;
        private layer: ProjectLayer;

        constructor(
            private $layerService: Services.LayerService,
            private $dashboardService: Services.DashboardService
        ) {
            this.mb = this.$layerService.$messageBusService;
        }

        public start(ctrl: ChartsWidget.ChartCtrl) {
            this.ctrl = ctrl;
            this.options = ctrl.$scope.data.generator;
            this.mb.subscribe('timeline', (action: string, range: any) => {
                if (action === "sensorLinkUpdated") this.selectLayer(this.layer);
            });

            this.mb.subscribe('layer', (action: string, layer: ProjectLayer) => {
                switch (action) {
                    case 'activated':
                        this.selectLayer(layer);
                        break;
                }
            });

            if (this.options.hasOwnProperty('layer'))
            {
                let l = this.$layerService.findLayer(this.options['layer']);
                this.selectLayer(l);
            }

            ctrl.initChart();

        }

        private selectLayer(layer: ProjectLayer) {
            this.layer = layer;
            if (!layer) return;
            this.ctrl.$scope.data._csv = "";
            if (!_.isArray(layer.kpiTimestamps)) return;
            if (this.options.hasOwnProperty("layer") && this.options["layer"] === layer.id) {
                var sensors = [];
                if (this.options.hasOwnProperty("sensors")) {
                    // set width/height using the widget width/height (must be set)
                    var width = parseInt(this.ctrl.widget._width.toLowerCase().replace('px', '').replace('%', '')) - 50;
                    var height = parseInt(this.ctrl.widget._height.toLowerCase().replace('px', '').replace('%', '')) - 75;
                    // make sure we have an array of properties
                    if (this.options.sensors instanceof Array) {
                        sensors = this.options.sensors;
                    }
                    else if (this.options.sensors instanceof String) {
                        sensors = [this.options.sensors];
                    }
                    var values = [];
                    if (!sensors) return;
                    var cv = -1;
                    sensors.forEach((p: any) => {
                        var title, source;
                        if (typeof p === 'string')
                        {
                            title = source = p;
                        }
                        else
                        {
                            title = p.label;
                            source = p.source;
                        }
                        var csvRow = "";
                        cv += 1;
                        if (layer.sensors && layer.sensors.hasOwnProperty(source)) {
                            var i = 0;
                            layer.kpiTimestamps.forEach(t => {
                                var s = layer.sensors[source][i];
                                if (s === -1) s = null;
                                if (layer.sensors[source].length > i) {
                                    values.push({ x: t, y: s, c: title });
                                    csvRow += new Date(t).toLocaleString() + ',' + s + '\n';
                                }
                                i += 1;
                            });
                            this.ctrl.$scope.data._csv += csvRow + '\n';
                            //   f.sensors[p].forEach()
                        }


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
                                "format": "dd-MM-YY",
                                "nice" : true,

                                "domain": { "data": "table", "field": "x" },
                                "domainMin": layer.kpiTimestamps[0],
                                "domainMax": layer.kpiTimestamps[layer.kpiTimestamps.length - 1]
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
                            { "type": "x", "scale": "x", "ticks": 4 },
                            { "type": "y", "scale": "y","ticks": 4 }
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
                                        "type": "line",
                                        "properties": {
                                            "enter": {
                                                "interpolate": { "value": "monotone" },
                                                "x": { "scale": "x", "field": "x" },
                                                "y": { "scale": "y", "field": "y" },
                                                "stroke": { "scale": "color", "field": "c" },
                                                "strokeWidth": { "value": 2 }
                                            },
                                            "update": {
                                                "fillOpacity": { "value": 1 }
                                            },
                                            "hover": {
                                                "fillOpacity": { "value": 0.5 }
                                            }
                                        }
                                    }
                                ],
                                "legends": [
                                    {
                                        "fill": "color",
                                        "offset": 0

                                    }
                                ]
                            }
                        ]
                    };
                    this.ctrl.$scope.data._spec = spec;
                    this.ctrl.updateChart();
                }
            }


        }

        public stop() {
            //alert('stop');
        }
    }
}
