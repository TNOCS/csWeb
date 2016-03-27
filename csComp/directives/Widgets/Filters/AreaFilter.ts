module AreaFilter {

    import IFeature = csComp.Services.IFeature;
    import IActionOption = csComp.Services.IActionOption;

    export class AreaFilterModel implements csComp.Services.IActionService {
        public id: string = 'AreaFilterModel';
        private layerService: csComp.Services.LayerService;

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }

        addLayer(layer : csComp.Services.IProjectLayer) {}
        removeLayer(layer : csComp.Services.IProjectLayer) {}
        
        getLayerActions(layer : csComp.Services.IProjectLayer)
        {
            return null;
        }

        getFeatureActions(feature: IFeature): IActionOption[] {
            if (!feature.geometry.type) return;
            switch (feature.geometry.type) {
                case 'MultiPolygon':
                case 'Polygon':
                    var setFilterActionOption = <IActionOption>{
                        title: 'Set as area filter'
                    };
                    setFilterActionOption.callback = this.setAsFilter;
                    var resetFilterActionOption = <IActionOption>{
                        title: 'Reset area filter'
                    };
                    resetFilterActionOption.callback = this.resetFilter;
                    return [setFilterActionOption, resetFilterActionOption];
                default:
                    console.log('Feature type name: ' + feature.featureTypeName);
                    return;
            }
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }

        deselectFeature(feature: IFeature) { }

        updateFeature(feuture: IFeature) { }

        private setAsFilter(feature: IFeature, layerService: csComp.Services.LayerService) {
            if (!feature.geometry.type) return;
            switch (feature.geometry.type) {
                case 'MultiPolygon':
                case 'Polygon':
                    layerService.setFeatureAreaFilter(feature);
                    break;
            }
        }

        private resetFilter(feature: IFeature, layerService: csComp.Services.LayerService) {
            if (!feature.geometry.type) return;
            switch (feature.geometry.type) {
                case 'MultiPolygon':
                case 'Polygon':
                    layerService.resetFeatureAreaFilter();
                    break;
            }
        }

        public init(layerService: csComp.Services.LayerService) {
            console.log('init AreaFilterActionService');
            this.layerService = layerService;
        }

    }

}
