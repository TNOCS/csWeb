module Heatmap {
    'use strict';

    import Feature       = csComp.Services.Feature;
    import IFeature      = csComp.Services.IFeature;
    import IFeatureType  = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;

    export interface IHeatmapScope extends ng.IScope {
        vm: HeatmapCtrl;
        ratingStates: any;
    }

    declare var String;//: csComp.StringExt.IStringExt;

    export class HeatmapCtrl {
        private static confirmationMsg1: string;
        private static confirmationMsg2: string;
        heatmap       : L.GeoJSON;
        heatmapModel  : HeatmapModel;
        heatmapModels : HeatmapModel[] = [];
        expertMode    : boolean = true;

        public static MAX_HEATMAP_CELLS = 2500;

        selectedFeature: IFeature;
        properties     : FeatureProps.CallOutProperty[];
        showFeature    : boolean;
        showChart      : boolean;
        featureIcon    : string;

        static $inject = [
          '$scope',
          '$modal',
          '$translate',
          '$timeout',
          'localStorageService',
          'layerService',
          'mapService',
          'messageBusService'
        ];

        constructor(
          private $scope              : IHeatmapScope,
          private $modal              : any,
          private $translate          : ng.translate.ITranslateService,
          private $timeout            : ng.ITimeoutService,
          private $localStorageService: ng.localStorage.ILocalStorageService,
          private $layerService       : csComp.Services.LayerService,
          private $mapService         : csComp.Services.MapService,
          private messageBusService   : csComp.Services.MessageBusService
        ) {
          $scope.vm = this;

          messageBusService.subscribe('layer', (title) => {//, layer: csComp.Services.ProjectLayer) => {
            switch (title) {
              case 'deactivate':
              case 'activated':
                /*this.updateAvailableMcas();
                this.calculateMca();*/
                break;
              }
          });

          messageBusService.subscribe('project', (title) => {//, layer: csComp.Services.ProjectLayer) => {
                  switch (title) {
                      case 'loaded':
                          //this.expertMode = $layerService.project != null
                          //    && $layerService.project.hasOwnProperty('userPrivileges')
                          //    && $layerService.project.userPrivileges.hasOwnProperty('heatmap')
                          //    && $layerService.project.userPrivileges.heatmap.hasOwnProperty('expertMode')
                          //    && $layerService.project.userPrivileges.heatmap.expertMode;

                         //if (typeof $layerService.project.mcas === 'undefined' || $layerService.project.mcas == null)
                              //$layerService.project.mcas = [];
                          /*var mcas = this.$localStorageService.get(McaCtrl.mcas);*/
                          /*if (typeof mcas === 'undefined' || mcas === null) return;*/
                          /*mcas.forEach((mca) => {
                              $layerService.project.mcas.push(new Models.Mca().deserialize(mca));
                          });*/
                          //this.createDummyMca();
                          break;
                  }
              });

              /*messageBusService.subscribe('feature', this.featureMessageReceived);*/

              $translate('HEATMAP.DELETE_MSG').then(translation => {
                  HeatmapCtrl.confirmationMsg1 = translation;
              });
              $translate('HEATMAP.DELETE_MSG2').then(translation => {
                  HeatmapCtrl.confirmationMsg2 = translation;
              });

              this.initializeHeatmap();
          }

        createHeatmap() {
            var heatmap = new HeatmapModel('Heatmap');
            this.showHeatmapEditor(heatmap);
        }

        editHeatmap(heatmap: HeatmapModel) {
            this.showHeatmapEditor(heatmap);
        }

        removeHeatmap(heatmap: HeatmapModel) {
            if (!heatmap) return;
            var title = String.format(HeatmapCtrl.confirmationMsg1, heatmap.title);
            this.messageBusService.confirm(title, HeatmapCtrl.confirmationMsg2,(result) => {
                if (!result) return;
                this.$timeout(() => {
                    this.deleteHeatmap(heatmap);
                    if (this.heatmap) this.updateHeatmap();
                    //if (this.heatmap) this.$mapService.map.removeLayer(this.heatmap);
                }, 0);
            });
            this.scopeApply();
        }

        private deleteHeatmap(heatmap: HeatmapModel) {
            if (!heatmap) return;
            var index = this.heatmapModels.indexOf(heatmap);
            if (index >= 0) this.heatmapModels.splice(index, 1);
            this.$mapService.map.removeLayer(this.heatmap);
            //var mcaIndex = this.getMcaIndex(mca);
            //if (mcaIndex < 0) return;
            //var mcas = this.$layerService.project.mcas;
            //if (mcaIndex >= 0)
            //    mcas.splice(mcaIndex, 1);
            //this.removeMcaFromLocalStorage(mca);
            //this.updateAvailableMcas();
        }

        /**
         * Show the heat map editor in a modal.
         */
        private showHeatmapEditor(heatmap: HeatmapModel): void {
            var modalInstance = this.$modal.open({
                templateUrl: 'heatmapEditorView.html',
                controller: HeatmapEditorCtrl,
                resolve: {
                    heatmap: () => heatmap
                }
            });
            modalInstance.result.then((heatmap: HeatmapModel) => {
                this.heatmapModel = heatmap;
                var i = this.heatmapModels.indexOf(heatmap);
                if (i >= 0) this.heatmapModels.splice(i, 1);
                this.heatmapModels.push(heatmap);
                this.updateHeatmap();
                console.log('Updated heatmap');
            }, () => {
                //console.log('Modal dismissed at: ' + new Date());
            });
        }

        private scopeApply() {
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        }

        getVotingClass(hi: IHeatmapItem) {
            if (hi == null || this.heatmapModel == null || hi.userWeight === 0 || hi.userWeight < -5 || hi.userWeight > 5)
                return 'disabledHeatmap';
            return hi.userWeight > 0 ? 'prefer' : 'avoid';
        }

        weightUpdated() {
            if (!this.heatmapModel) return;
            this.updateHeatmap();
        }

        intensityScaleUpdated() {
            if (!this.heatmapModel) return;
            this.heatmapModel.updateIntensityScale();
            this.updateHeatmap();
        }


        /**
         * Update the available pre-set heatmaps.
         */
        private updateHeatmap() {
            if (this.heatmapModel) {
                var currentZoom = this.$mapService.getMap().getZoom();
                if (currentZoom >= this.heatmapModel.scaleMinValue && currentZoom <= this.heatmapModel.scaleMaxValue) {
                    this.heatmapModel.updateWeights();
                    this.heatmapModel.calculate(this.$layerService, this.$mapService, this.heatmap);
                    //this.createDummyHeatmap();
                } else {
                    console.log("Heatmap is not supported for the current zoom level.");
                }
            }
        }

        ///**
        //* Add a heatmap layer to the map.
        //*/
        private initializeHeatmap() {
            this.heatmap = L.geoJson([], {
                style: function (feature) { 
                    if (feature.properties.intensity <= 0) {
                        var hexString = Heatmap.HeatmapCtrl.intensityToHex(feature.properties.intensity);
                        return { color: "#FF"+hexString+hexString };
                    } else if (feature.properties.intensity > 0) {
                        var hexString = Heatmap.HeatmapCtrl.intensityToHex(feature.properties.intensity);
                        return { color: "#" + hexString + hexString + "FF"};
                    } else {
                        return { color: "#000000" };
                    }
                    //if (feature.properties.intensity < -0.10) {
                    //    return { color: "#ff0000" };
                    //} else if (feature.properties.intensity < 0.10) {
                    //    return { color: "#ffffff" };
                    //} else {
                    //    return { color: "#0000ff" };
                    //}
                }
            });
            this.$mapService.map.setView(new L.LatLng(52.1095, 4.3275), 14);
            this.$mapService.map.addLayer(this.heatmap);
            //TODO: remove when deleting heatmap layer
            this.$mapService.getMap().on('moveend',  () => { this.updateHeatmap() });
        }

        public static intensityToHex(intensity: number): string {
            var decreaseOverlap = 20;
            intensity = Math.floor(Math.abs(intensity) * 255);
            if (intensity < 0) {
                intensity = 0;
            } else if (intensity > 255 - decreaseOverlap) {
                intensity = 255 - decreaseOverlap;
            }
            var hexString: string = (255 - decreaseOverlap - intensity).toString(16);
            if (hexString.length == 1) {
                hexString = "0" + hexString;
            }
            return hexString;
        }

        ///**
        // * Create a dummy heatmap
        // */
        //private createDummyHeatmap() {
        //}
    }
}
