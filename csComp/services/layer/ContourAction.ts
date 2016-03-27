module ContourAction {

    import IFeature = csComp.Services.IFeature;
    import IActionOption = csComp.Services.IActionOption;

    export class ContourActionModel implements csComp.Services.IActionService {
        public id: string = 'ContourActionModel';
        private layerService: csComp.Services.LayerService

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }
        addLayer(layer : csComp.Services.IProjectLayer) {}
        removeLayer(layer : csComp.Services.IProjectLayer) {}

        getFeatureActions(feature: IFeature): IActionOption[] {
            return [];
        }
        
        getLayerActions(layer : csComp.Services.IProjectLayer)
        {
            return null;
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            if (!feature) return [];
            var showContourOption = <IActionOption>{
                title: 'show'
            };
            showContourOption.callback = this.showContour;
            var hideContourOption = <IActionOption>{
                title: 'hide'
            };
            hideContourOption.callback = this.hideContour;
            return [showContourOption, hideContourOption];
        }

        deselectFeature(feature: IFeature) { }

        updateFeature(feuture: IFeature) { }

        private showContour(feature: IFeature, layerService: csComp.Services.LayerService) {
            if (layerService.currentContour) layerService.map.map.removeLayer(layerService.currentContour); //remove old contour first
            var fType = layerService.getFeatureType(feature);
            if (fType && fType.hasOwnProperty('contourProperty') && feature.properties.hasOwnProperty(fType['contourProperty'])) {
                var contourProp = feature.properties[fType.contourProperty];
                var geoContour: L.GeoJSON = typeof contourProp === 'object'
                    ? contourProp
                    : JSON.parse(contourProp);
                layerService.currentContour = L.geoJson(geoContour);
                layerService.currentContour.addTo(layerService.map.map);
            }
        }

        private hideContour(feature: IFeature, layerService: csComp.Services.LayerService) {
            if (layerService.currentContour) layerService.map.map.removeLayer(layerService.currentContour); //remove contour
        }

        public init(layerService: csComp.Services.LayerService) {
            console.log('init ContourActionService');
        }
    }
}
