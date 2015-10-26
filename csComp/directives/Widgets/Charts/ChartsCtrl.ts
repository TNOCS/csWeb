module ChartsWidget {
    export class ChartData {
        title: string;
        /**
         * Content to display: you can either provide it directly, or specify a URL, in which case it will replace the content.
         */
        content: string;
        key: string;
        spec: any;
        _id: string;
        _view: any;
    }

    declare var vg;

    export interface IChartScope extends ng.IScope {
        vm: ChartCtrl;
        data: ChartData;
        spec: string;
    }

    export class ChartCtrl {
        private scope: IChartScope;
        public widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private defaultSpec = {
            "width": 300,
            "height": 200,
            "padding": { "top": 10, "left": 30, "bottom": 30, "right": 10 },
            "data": [
                {
                    "name": "table",
                    "values": [
                        { "x": 1, "y": 28 }, { "x": 2, "y": 55 },
                        { "x": 3, "y": 43 }, { "x": 4, "y": 91 },
                        { "x": 5, "y": 81 }, { "x": 6, "y": 53 },
                        { "x": 7, "y": 19 }, { "x": 8, "y": 87 },
                        { "x": 9, "y": 52 }, { "x": 10, "y": 48 },
                        { "x": 11, "y": 24 }, { "x": 12, "y": 49 },
                        { "x": 13, "y": 87 }, { "x": 14, "y": 66 },
                        { "x": 15, "y": 17 }, { "x": 16, "y": 27 },
                        { "x": 17, "y": 68 }, { "x": 18, "y": 16 },
                        { "x": 19, "y": 49 }, { "x": 20, "y": 15 }
                    ]
                }
            ],
            "scales": [
                {
                    "name": "x",
                    "type": "ordinal",
                    "range": "width",
                    "domain": { "data": "table", "field": "x" }
                },
                {
                    "name": "y",
                    "type": "linear",
                    "range": "height",
                    "domain": { "data": "table", "field": "y" },
                    "nice": true
                }
            ],
            "axes": [
                { "type": "x", "scale": "x" },
                { "type": "y", "scale": "y" }
            ],
            "marks": [
                {
                    "type": "rect",
                    "from": { "data": "table" },
                    "properties": {
                        "enter": {
                            "x": { "scale": "x", "field": "x" },
                            "width": { "scale": "x", "band": true, "offset": -1 },
                            "y": { "scale": "y", "field": "y" },
                            "y2": { "scale": "y", "value": 0 }
                        },
                        "update": {
                            "fill": { "value": "steelblue" }
                        },
                        "hover": {
                            "fill": { "value": "red" }
                        }
                    }
                }
            ]
        };

        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IChartScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
            ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <ChartData>this.widget.data;
            $scope.data._id = this.widget.id;
        }

        private keyHandle;

        public startChart() {
            var d = this.$scope.data;
            if (!d.spec) d.spec = this.defaultSpec;
            var res = vg.embed('#vis' + d._id, d.spec, (view, vega_spec) => {
                d._view = view;

                // Callback receiving the View instance and parsed Vega spec...
                // The View resides under the '#vis' element
            });

            if (d.key) {
                this.keyHandle = this.$layerService.$messageBusService.serverSubscribe(d.key, "key", (topic: string, msg: csComp.Services.ClientMessage) => {
                    switch (msg.action) {
                        case "key":
                        if (msg.data.item && Object.prototype.toString.call(msg.data.item) === '[object Array]' ) {
                            d.spec.data = msg.data.item;
                        } else {
                            d.spec.data = [msg.data.item];
                        }
                        vg.parse.spec(this.$scope.data.spec, (chart) => { chart({ el: "#vis" + d._id }).update(); });
                        d._view.update();
                        break;
                    }
                });
            }
        }
    }
}
