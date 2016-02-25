module ChartsWidget {
    export class ChartData {
        title: string;
        /**
         * Content to display: you can either provide it directly, or specify a URL, in which case it will replace the content.
         */
        content: string;
        key: string;
        lite: boolean;
        spec: any;
        _spec: any;
        generator: any;
        _id: string;
        _view: any;
    }

    declare var vg;
    declare var vl;

    export interface IChartScope extends ng.IScope {
        vm: ChartCtrl;

        data: ChartData;
        spec: string;
    }

    export class ChartCtrl {
        private scope: IChartScope;
        public widget: csComp.Services.BaseWidget;
        private parentWidget: JQuery;
        private generator: csComp.Services.IChartGenerator;

        private defaultSpec = {
            'width': 300,
            'height': 200,
            'padding': { 'top': 10, 'left': 30, 'bottom': 30, 'right': 10 },
            'data': [
                {
                    'name': 'table',
                    'values': [
                        { 'x': 1, 'y': 28 }, { 'x': 2, 'y': 55 },
                        { 'x': 3, 'y': 43 }, { 'x': 4, 'y': 91 },
                        { 'x': 5, 'y': 81 }, { 'x': 6, 'y': 53 },
                        { 'x': 7, 'y': 19 }, { 'x': 8, 'y': 87 },
                        { 'x': 9, 'y': 52 }, { 'x': 10, 'y': 48 },
                        { 'x': 11, 'y': 24 }, { 'x': 12, 'y': 49 },
                        { 'x': 13, 'y': 87 }, { 'x': 14, 'y': 66 },
                        { 'x': 15, 'y': 17 }, { 'x': 16, 'y': 27 },
                        { 'x': 17, 'y': 68 }, { 'x': 18, 'y': 16 },
                        { 'x': 19, 'y': 49 }, { 'x': 20, 'y': 15 }
                    ]
                }
            ],
            'scales': [
                {
                    'name': 'x',
                    'type': 'ordinal',
                    'range': 'width',
                    'domain': { 'data': 'table', 'field': 'x' }
                },
                {
                    'name': 'y',
                    'type': 'linear',
                    'range': 'height',
                    'domain': { 'data': 'table', 'field': 'y' },
                    'nice': true
                }
            ],
            'axes': [
                { 'type': 'x', 'scale': 'x' },
                { 'type': 'y', 'scale': 'y' }
            ],
            'marks': [
                {
                    'type': 'rect',
                    'from': { 'data': 'table' },
                    'properties': {
                        'enter': {
                            'x': { 'scale': 'x', 'field': 'x' },
                            'width': { 'scale': 'x', 'band': true, 'offset': -1 },
                            'y': { 'scale': 'y', 'field': 'y' },
                            'y2': { 'scale': 'y', 'value': 0 }
                        },
                        'update': {
                            'fill': { 'value': 'steelblue' }
                        },
                        'hover': {
                            'fill': { 'value': 'red' }
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
            'mapService',
            'dashboardService'
        ];

        constructor(
            public $scope: IChartScope,
            private $timeout: ng.ITimeoutService,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService,
            private $dashboardService: csComp.Services.DashboardService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <ChartData>this.widget.data;
            $scope.data._id = this.widget.id;
            $('#' + this.widget.elementId).on('remove', () => {
                if (this.generator) this.generator.stop();
            });
            //$scope.$on('destroy', () => {
        }

        private keyHandle;

        public initChart() {

            try {

                var d = this.$scope.data;
                var vgspec = d.spec || d._spec || {};

                if (d.lite) vgspec = vl.compile(d.spec);
                //parse(vgspec);
                if (vgspec)

                    var res = vg.embed('#vis' + d._id, vgspec, (view, vega_spec) => {
                        d._view = view;
                        //$('.vega-actions').css("display","none");
                        // Callback receiving the View instance and parsed Vega spec...
                        // The View resides under the '#vis' element
                    });
            } catch (e) {

            }
        }

        public updateChart() {
            try {
                var d = this.$scope.data;
                var vgspec = d.spec;
                if (d.lite) vgspec = vl.compile(d.spec);
                //if (d._view) d._view.update();
                vg.parse.spec(vgspec, (chart) => { chart({ el: "#vis" + this.$scope.data._id }).update(); });
            }
            catch (e) {

            }

        }

        public startChart() {
            var d = this.$scope.data;
            
            console.log(d);

            // if a chart generator is specified, find it and start it
            if (d.generator) {
                if (d.generator.type && this.$dashboardService.chartGenerators.hasOwnProperty(d.generator.type)) {
                    this.generator = <csComp.Services.IChartGenerator>this.$dashboardService.chartGenerators[d.generator.type]();
                    this.generator.start(this);
                    return;
                }
            } else {
                // if no generator is specified, use the spec from data
                if (!d.spec) d.spec = this.defaultSpec;
                this.initChart();

                // check if a key is defined, a key can be used to listen to new data or complete vega specifications
                if (d.key) {
                    this.keyHandle = this.$layerService.$messageBusService.serverSubscribe(d.key, 'key', (topic: string, msg: csComp.Services.ClientMessage) => {
                        switch (msg.action) {
                            case 'key':
                                if (msg.data.item.hasOwnProperty('values')) {
                                    d.spec.data = msg.data.item.values;
                                } else if (msg.data.item.hasOwnProperty('data')) {
                                    d.spec = msg.data.item;
                                }
                                this.initChart();
                                break;
                        }
                    });
                }
                //vgspec = d.spec;
                //if (d.lite) vgspec = vl.compile(d.spec);
                //vg.parse.spec(vgspec, (chart) => { chart({ el: '#vis' + d._id }).update(); });
                //d._view.update();
                //break;
                //     }
                // });
            }
        }
    }
}