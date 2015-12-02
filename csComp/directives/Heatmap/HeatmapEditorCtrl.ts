module Heatmap {
    'use strict';

    import IFeature     = csComp.Services.IFeature;
    import IFeatureType = csComp.Services.IFeatureType;
    import IGeoJsonFile = csComp.Services.IGeoJsonFile;

    export interface IHeatmapEditorScope extends ng.IScope {
        vm: HeatmapEditorCtrl;
    }

    export class HeatmapEditorCtrl {
        /**
         * A virtual geojson file that represents all useable data for creating a heatmap.
         * @type {IGeoJsonFile}
         */
        dataset             : IGeoJsonFile;
        scoringFunctions    : ScoringFunction[] = [];

        showItem            : number;
        idealDistance       : number;
        distanceMaxValue    : number;
        lostInterestDistance: number;

        static $inject = [
            '$scope',
            '$modalInstance',
            'layerService',
            '$translate',
            'messageBusService',
            'heatmap'
        ];

        constructor(
            private $scope           : IHeatmapEditorScope,
            private $modalInstance   : any,
            private $layerService    : csComp.Services.LayerService,
            private $translate       : ng.translate.ITranslateService,
            private messageBusService: csComp.Services.MessageBusService,
            public heatmap?          : HeatmapModel
            ) {
            $scope.vm = this;

            this.scoringFunctions.push(new ScoringFunction(ScoringFunctionType.LinearAscendingDescending));
            $translate('HEATMAP.LINEAR_ASC_DESC').then(translation => {
                this.scoringFunctions[0].title = translation;
            });

            this.dataset = csComp.Helpers.loadMapLayers($layerService);
            if (!heatmap) heatmap = new HeatmapModel('Heatmap');

            for (var k in this.dataset.featureTypes) {
                if (this.dataset.featureTypes.hasOwnProperty(k)) {
                    var ft = this.dataset.featureTypes[k];
                    heatmap.addHeatmapItem(new HeatmapItem(ft.name, ft));
                    var propertyTypeData: csComp.Services.IPropertyType[];
                    if (!ft._propertyTypeData) continue;
                    ft._propertyTypeData.forEach((pt) => {
                        if (pt.type == 'options') {
                            var i = 0;
                            pt.options.forEach((o) => {
                                var hi = new HeatmapItem(o, ft);
                                hi.propertyLabel = pt.label;
                                hi.propertyTitle = pt.title;
                                hi.optionIndex   = i++;
                                heatmap.addHeatmapItem(hi);
                            });
                        }
                    });
                }
            }
        }

        save() {
            this.$modalInstance.close(this.heatmap);
        }

        cancel() {
            this.$modalInstance.dismiss('cancel');
        }

        toggleItemDetails(index: number) {
            this.showItem = this.showItem == index ? -1 : index;
            console.log("Toggle item");
        }
    }
}
