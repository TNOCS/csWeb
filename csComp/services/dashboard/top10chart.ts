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
            this.ctrl.$scope.data.lite = true;
            var values = [];

            layer.data.features.forEach((f: IFeature) => {
                if (f.properties.hasOwnProperty(this.style.property) && f.properties.hasOwnProperty(f.fType.style.nameLabel)) {
                    var pr = { "value": f.properties[this.style.property], "name": f.properties[f.fType.style.nameLabel] };
                    values.push(pr);
                }
            });

            this.ctrl.$scope.data.spec = {
                "width": width,
                "height": height,
                "data": { "values": _.first(_.sortBy(values, (v) => { return -v.value }), 10) },
                "marktype": "bar",
                "sort": false,
                "encoding": {
                    "x": { "name": "value", "type": "Q" },
                    "y": { "name": "name", "type": "N", "sort": false }
                }
            }

            this.ctrl.$scope.data.title = this.style.title;
            
            //this.ctrl.updateChart();
            this.ctrl.initChart();
        }


        public stop() {
            this.mb.unsubscribe(this.layerSub);
            this.mb.unsubscribe(this.styleSub);

        }
    }
}
