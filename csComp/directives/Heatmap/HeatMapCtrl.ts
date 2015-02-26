module Heatmap {
    'use strict';

    import Feature       = csComp.Services.Feature;
    import IFeature      = csComp.Services.IFeature;
    import IFeatureType  = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;

    export interface IMcaScope extends ng.IScope {
        vm: HeatmapCtrl;
        ratingStates: any;
    }

    declare var String;//: csComp.StringExt.IStringExt;

    export class HeatmapCtrl {
        private static confirmationMsg1: string;
        private static confirmationMsg2: string;
        heatmap       : L.TileLayer.WebGLHeatMap;
        heatmapModel  : HeatmapModel;
        heatmapModels : HeatmapModel[] = [];
        expertMode                     = true;
  
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
          private $scope              : IMcaScope,
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
                          /*this.expertMode = $layerService.project != null
                              && $layerService.project.hasOwnProperty('userPrivileges')
                              && $layerService.project.userPrivileges.hasOwnProperty('mca')
                              && $layerService.project.userPrivileges.mca.hasOwnProperty('expertMode')
                              && $layerService.project.userPrivileges.mca.expertMode;*/
  
                         if (typeof $layerService.project.mcas === 'undefined' || $layerService.project.mcas == null)
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

        }

        removeHeatmap(heatmap: HeatmapModel) {
            if (!heatmap) return;
            var title = String.format(HeatmapCtrl.confirmationMsg1, heatmap.title);
            this.messageBusService.confirm(title, HeatmapCtrl.confirmationMsg2,(result) => {
                if (!result) return;
                this.$timeout(() => {
                    this.deleteHeatmap(heatmap);
                    if (this.heatmap) this.$mapService.map.removeLayer(this.heatmap);
                }, 0);
            });
            this.scopeApply();
        }

        private deleteHeatmap(heatmap: HeatmapModel) {
            if (!heatmap) return;
            var index = this.heatmapModels.indexOf(heatmap);
            if (index >= 0) this.heatmapModels.splice(index, 1);
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
                //console.log(JSON.stringify(mca, null, 2));
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
                return 'disabledMca';
            return hi.userWeight > 0 ? 'prefer' : 'avoid';
        }

        weightUpdated() {
            if (!this.heatmapModel) return;
            this.updateHeatmap();
        }

        /**
         * Update the available pre-set heatmaps.
         */
        private updateHeatmap() {
            this.heatmapModel.updateWeights();
            this.heatmapModel.calculate(this.$layerService, this.heatmap);
        }

        /**
        * Add a WebGL heatmap layer to the map.
        */
        private initializeHeatmap() {
            csComp.Utils.loadJsCssfile('js/cs/webgl-heatmap.min.js', csComp.FileType.Js, (event: Event) => {
                csComp.Utils.loadJsCssfile('js/cs/webgl-heatmap-leaflet.min.js', csComp.FileType.Js,(event: Event) => {
                    //custom size for this example, and autoresize because map style has a percentage width
                    this.heatmap = new L.TileLayer.WebGLHeatMap({ size: 50, autoresize: false });
                    this.$mapService.map.addLayer(this.heatmap);
                    //// dataPoints is an array of arrays: [[lat, lng, intensity]...]
                    //this.$mapService.map.setView(new L.LatLng(44.65, -63.57), 12);
                    //var dataPoints = [[44.6674, -63.5703, 37], [44.6826, -63.7552, 34], [44.6325, -63.5852, 41], [44.6467, -63.4696, 67], [44.6804, -63.487, 64], [44.6622, -63.5364, 40], [44.603, - 63.743, 52]];
                    //for (var i = 0, len = dataPoints.length; i < len; i++) {
                    //    var point = dataPoints[i];
                    //    this.heatmap.addDataPoint(point[0], point[1], point[2]);
                    //}
                });
            });
        }
    }
}
