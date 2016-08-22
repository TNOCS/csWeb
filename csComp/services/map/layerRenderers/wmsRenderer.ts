module csComp.Services {
    export class WmsRenderer {

        static getUrl(layer: ProjectLayer, date: Date): string {
            let url = layer.url;
            if (layer.timeDependent) {
                date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
                layer.url += '&time=' + moment(date).format('YYYY-MM-DDTHH:mm:SS') + 'Z';
            };
            layer._gui['wmsurl'] = url;
            return url;
        }

        static render(service: LayerService, layer: ProjectLayer) {
            let url = WmsRenderer.getUrl(layer,service.project.timeLine.focusDate());
            var wms: any = L.tileLayer.wms(layer.url, <any>{
                layers: layer.wmsLayers,
                opacity: layer.opacity / 100,
                format: 'image/png',
                transparent: true,
                attribution: layer.description,
                tiled: true
            });
            layer.mapLayer = new L.LayerGroup<L.ILayer>();
            service.map.map.addLayer(layer.mapLayer);
            layer.mapLayer.addLayer(wms);
            layer._gui['wmsleaflet'] = wms;
            wms.on('loading', (event) => {
                layer.isLoading = true;
                service.$rootScope.$apply();
                if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            });
            wms.on('load', (event) => {
                layer.isLoading = false;
                if (service.$rootScope.$$phase != '$apply' && service.$rootScope.$$phase != '$digest') { service.$rootScope.$apply(); }
            });

            if (!layer.group.owsgeojson) {
                var gs = new GroupStyle(service.$translate);
                gs.id = Helpers.getGuid();
                gs.title = layer.title;
                gs.meta = null;
                gs.visualAspect = 'fillColor';
                gs.availableAspects = [];
                gs.enabled = true;
                gs.group = layer.group;
                gs.property = '';
                gs.canSelectColor = false;
                gs.colors = ['#00fbff', '#0400ff'];
                gs.activeLegend = <Legend>{
                    legendKind: 'image',
                    description: gs.title,
                    visualAspect: 'fillColor',
                    imageUrl: layer.url + '?service=wms&request=GetLegendGraphic&version=1.1.1&layer=' + layer.wmsLayers + '&styles=&format=image/png',
                    legendEntries: []
                };
                service.saveStyle(layer.group, gs);
            }
            layer.isLoading = true;
        }
    }
}
