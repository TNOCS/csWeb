module csComp.Services {
    export class WmsSource implements ILayerSource {
        title = 'wms';
        requiresLayer = false;
        delay: Function;
        //service : LayerService;
        constructor(public service: LayerService) {

        }

        public refreshLayer(layer: ProjectLayer) {
        }

        public layerMenuOptions(layer: ProjectLayer): [[string, Function]] {
            return null;
        }

        public getUrl(layer: ProjectLayer, date: Date): string {
            let url = layer.url;

            if (layer.timeDependent) {
                date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
                url = layer.url.replace(/time=?([^&]*)/g, 'time=' + moment(date).utc().format('YYYY-MM-DDTHH:mm:SS') + 'Z');

                //layer.url += '&time=' +
            };
            layer._gui['wmsurl'] = url;
            return url;
        }

        public addLayer(layer: ProjectLayer, callback: Function, data = null) {
            let url = this.getUrl(layer, this.service.project.timeLine.focusDate());
            if (layer.timeDependent) {
                this.delay = _.debounce(this.updateTime, 250, false);
                this.service.$messageBusService.subscribe('timeline', (a, date: Date) => {
                    if (a === 'focusChange') this.delay(layer, date);
                });
            }
            var wms: any = L.tileLayer.wms(layer.url, <L.WMSOptions>{
                layers: layer.wmsLayers,
                styles: 'default',
                opacity: layer.opacity / 100,
                format: 'image/png',
                transparent: true,
                attribution: layer.description,
                srs: 'EPSG:4326'
            });

            layer.renderType = 'wms';
            layer._gui['wms'] = wms;
            callback(layer);
        }

        public updateTime(layer: ProjectLayer, date: Date) {
            if (layer._gui.hasOwnProperty('wms')) {
                let wms = <L.TileLayer.WMS>layer._gui['wms'];
                let url = this.getUrl(layer, date);
                // if (url !== layer._gui['wmsurl']) {

                // }
                //this.refreshLayer(layer);
                //layer._gui['wmsleaflet'].redraw();
                layer._gui['wmsleaflet'].setUrl(url);
                // (<any>wms).update();
                console.log(url);
            }
        }



        removeLayer(layer: ProjectLayer) {

        }

    }

}
