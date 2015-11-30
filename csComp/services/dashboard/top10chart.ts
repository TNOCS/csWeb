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
        private style : GroupStyle;
        private layer : ProjectLayer;


        public start(ctrl: ChartsWidget.ChartCtrl) {
            this.ctrl = ctrl;
            this.options = ctrl.$scope.data.generator;

            this.layerSub = this.mb.subscribe('layer', (title, layer) => {//, layer: csComp.Services.ProjectLayer) => {
                switch (title) {
                    case 'deactivate':
                    case 'activated':
                        this.layer = layer;
                        if (layer.id === this.options.layer) this.updateChart(this.layer);
                        break;
                }
            });

            this.styleSub = this.mb.subscribe('styles', (l, style: GroupStyle) => {
                if (l === 'updatedstyle') {
                    this.style = style;
                    this.updateChart(this.layer);
                }
            })




            ctrl.initChart();
        }

        private updateChart(layer: ProjectLayer) {
            
                        
            // set width/height using the widget width/height (must be set) 
            var width = parseInt(this.ctrl.widget.width.toLowerCase().replace('px', '').replace('%', '')) - 50;
            var height = parseInt(this.ctrl.widget.height.toLowerCase().replace('px', '').replace('%', '')) - 80;
            this.ctrl.$scope.data.lite = true;
            var values = [];
            layer.data.features.forEach((f: IFeature) => {
                var pr = { "value": f.properties[this.style.property], "name": f.properties["Naam"] };
                values.push(pr);

            });

            this.ctrl.$scope.data.spec = {
                "width" : width,
                "height" :height,
                "data": { "values": _.first(_.sortBy(values, (v)=>{ return -v.value}), 10) },
                "marktype": "bar",
                "sort": false,
                "encoding": {
                    "x": { "name": "value", "type": "Q" },
                    "y": { "name": "name", "type": "N", "sort": false }
                }
            }
            
            this.ctrl.$scope.data.title = this.style.title;


            this.ctrl.updateChart();
        }


        public stop() {
            this.mb.unsubscribe(this.layerSub);
            this.mb.unsubscribe(this.styleSub);

        }
    }
}
