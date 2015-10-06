module csComp.Services {
    'use strict';

    import IFeature = csComp.Services.IFeature;
    import IActionOption = csComp.Services.IActionOption;

    export class LayerActions implements csComp.Services.IActionService {
        public id: string = 'LayerActions';
        private layerService: csComp.Services.LayerService

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }

        getFeatureActions(feature: IFeature): IActionOption[] {
            if (feature.layer.isDynamic) {
                var setFilterActionOption = <IActionOption>{
                    title: "Edit"
                };
                setFilterActionOption.callback = this.setAsFilter;
                return [setFilterActionOption];
            }
            else { return []; }
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }

        deselectFeature(feature: IFeature) { }

        updateFeature(feuture: IFeature) { }

        private setAsFilter(feature: IFeature, layerService: csComp.Services.LayerService) {
            layerService.editFeature(feature);
        }


        public init(layerService: csComp.Services.LayerService) {
            console.log('init LayerActions');
            this.layerService = layerService;
        }

    }

}
