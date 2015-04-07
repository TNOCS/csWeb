module Heatmap {
    'use strict';

    import Feature       = csComp.Services.Feature;
    import IFeature      = csComp.Services.IFeature;
    import IFeatureType  = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;

    export interface IHeatmapScope extends ng.IScope {
        vm: HeatmapCtrl;
        ratingStates: any;
        projLayer: csComp.Services.ProjectLayer;
    }

    declare var String;//: csComp.StringExt.IStringExt;

    export class HeatmapCtrl {
        private static confirmationMsg1: string;
        private static confirmationMsg2: string;
        heatmap        : L.GeoJSON = L.geoJson([]);
        heatmapModel   : HeatmapModel;
        heatmapModels  : HeatmapModel[] = [];
        heatmapSettings: IHeatmapSettings;
        expertMode     : boolean = true;
        projLayer = new csComp.Services.ProjectLayer();

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
                //this.updateAvailableHeatmaps();
                //this.updateHeatmap();
                break;
              }
          });

          messageBusService.subscribe('project',(title) => {//, layer: csComp.Services.ProjectLayer) => {
              switch (title) {
                  case 'loaded':
                      this.expertMode = $layerService.project != null
                      && $layerService.project.hasOwnProperty('userPrivileges')
                      && $layerService.project.userPrivileges.hasOwnProperty('heatmap')
                      && $layerService.project.userPrivileges.heatmap.hasOwnProperty('expertMode')
                      && $layerService.project.userPrivileges.heatmap.expertMode;

                      this.updateAvailableHeatmaps();

                      this.initializeHeatmap();
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
        }

        updateAvailableHeatmaps() {
            this.heatmapModels = [];
            if (this.$layerService.project.groups) {
                this.$layerService.project.groups.forEach((group) => {
                    group.layers.forEach((layer) => {
                        if (layer.type === "Heatmap") {
                            var hm = new HeatmapModel(layer.title);
                            hm.deserialize(layer);
                            this.heatmapModels.push(hm);
                            if (layer.enabled) this.heatmapModel = hm;
                        }
                    });
                });
            }
        }

        createHeatmap() {
            this.heatmapModel = new HeatmapModel('Heatmap');
            if (this.projLayer.data) this.$layerService.removeLayer(this.projLayer); 
            //Create projectlayer for the heatmap
            this.projLayer.type = "Heatmap";
            this.projLayer.layerRenderer = "heatmap";
            this.projLayer.enabled = true;
            this.projLayer.group = new csComp.Services.ProjectGroup();
            this.projLayer.group.oneLayerActive = true;
            this.projLayer.group.layers = [];
            this.projLayer.group.filters = [];
            this.projLayer.group.styles = [];
            this.projLayer.group.markers = [];
            this.projLayer.heatmapSettings = new HeatmapSettings();
            this.projLayer.heatmapItems = [];
            this.projLayer.id = csComp.Helpers.getGuid();
            this.heatmap = L.geoJson([]);
            this.showHeatmapEditor(this.heatmapModel);
            //this.$layerService.addLayer(this.projLayer);
        }

        editHeatmap(heatmap: HeatmapModel) {
            this.showHeatmapEditor(heatmap);
        }

        exportHeatmap(heatmap: HeatmapModel) {
            console.log("\n-----------------\n" + "Exported heatmap starts here: \n");
            console.log(heatmap.serialize());
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
            this.$layerService.removeLayer(this.projLayer);
            delete (this.heatmapModel);
            this.initializeHeatmap();
            this.updateAvailableHeatmaps();
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
            this.heatmapModel.updateWeights();
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
                this.projLayer.heatmapItems = this.heatmapModel.heatmapItems;
                this.projLayer.heatmapSettings = this.heatmapModel.heatmapSettings;
                this.projLayer.id = this.heatmapModel.id;
                var currentZoom = this.$mapService.getMap().getZoom();
                if (currentZoom < this.heatmapModel.heatmapSettings.minZoom || currentZoom > this.heatmapModel.heatmapSettings.maxZoom) {
                    console.log("Heatmap is not supported for the current zoom level.");
                    return;
                } else {
                    //this.heatmapModel.updateWeights();
                    //this.heatmapModel.calculate(this.$layerService, this.$mapService, this.heatmap);
                    //this.projLayer.data = this.heatmap.toGeoJSON();
                    //(<any>(this.projLayer.data)).features.forEach((f) => {
                    //    this.$layerService.initFeature(f, this.projLayer);
                    //});

                    //// Set default style for the heatmap:
                    //if ((<any>(this.projLayer.data)).features[0]) {
                    //    var calloutProp = new FeatureProps.CallOutProperty("intensity", "0", "intensity", true, true,(<any>(this.projLayer.data)).features[0], false);
                    //    var propinfo = new csComp.Services.PropertyInfo();
                    //    // Tweak the group style info to keep constant min/max color values on panning and zooming.
                    //    propinfo.count = (<any>(this.projLayer.data)).features.length;
                    //    propinfo.max = 1;
                    //    propinfo.min = -1;
                    //    propinfo.sdMax = propinfo.max;
                    //    propinfo.sdMin = propinfo.min;
                    //    propinfo.mean = 0;
                    //    propinfo.varience = 0.67;
                    //    propinfo.sd = Math.sqrt(propinfo.varience);
                    //    this.$layerService.setStyle(calloutProp, false, propinfo); // Set the style
                    // }  
                }
                this.$layerService.removeLayer(this.projLayer);
                this.$layerService.addLayer(this.projLayer);
            }
        }

        ///**
        //* Add a heatmap layer to the map.
        //*/
        private initializeHeatmap() {
            this.projLayer.type = "Heatmap";
            this.projLayer.layerRenderer = "heatmap";
            this.projLayer.enabled = false;
            this.projLayer.group = new csComp.Services.ProjectGroup();
            this.projLayer.group.oneLayerActive = true;
            this.projLayer.group.layers = [];
            this.projLayer.group.filters = [];
            this.projLayer.group.styles = [];
            this.projLayer.group.markers = [];
            this.projLayer.mapLayer = new L.LayerGroup();
            this.projLayer.heatmapSettings = new HeatmapSettings();
            this.projLayer.heatmapItems = [];
            this.projLayer.id = "";


            this.$layerService.map.map.addEventListener('moveend',(event) => {
                this.updateHeatmap();
            });
            //this.heatmap = L.geoJson([]);//, {
            //    style: function (feature) { 
            //        if (feature.properties.intensity <= 0) {
            //            var hexString = Heatmap.HeatmapCtrl.intensityToHex(feature.properties.intensity);
            //            return { color: "#FF"+hexString+hexString };
            //        } else if (feature.properties.intensity > 0) {
            //            var hexString = Heatmap.HeatmapCtrl.intensityToHex(feature.properties.intensity);
            //            return { color: "#" + hexString + hexString + "FF"};
            //        } else {
            //            return { color: "#000000" };
            //        }
            //}
            //});

            //this.projLayer.data = this.heatmap.toGeoJSON();
            //(<any>(this.projLayer.data)).features.forEach((f) => {
            //    this.$layerService.initFeature(f, this.projLayer);
            //});

            //// Set default style for the heatmap:
            //if ((<any>(this.projLayer.data)).features[0]) {
            //    var calloutProp = new FeatureProps.CallOutProperty("intensity", "0", "intensity", true, true,(<any>(this.projLayer.data)).features[0], false);
            //    var propinfo = new csComp.Services.PropertyInfo();
            //    // Tweak the group style info to keep constant min/max color values on panning and zooming.
            //    propinfo.count = (<any>(this.projLayer.data)).features.length;
            //    propinfo.max = 1;
            //    propinfo.min = -1;
            //    propinfo.sdMax = propinfo.max;
            //    propinfo.sdMin = propinfo.min;
            //    propinfo.mean = 0;
            //    propinfo.varience = 0.67;
            //    propinfo.sd = Math.sqrt(propinfo.varience);
            //    this.$layerService.setStyle(calloutProp, false, propinfo); // Set the style
            //}
            //this.$layerService.addLayer(this.projLayer);
            //this.$mapService.map.setView(new L.LatLng(52.1095, 4.3275), 14);
        }

        //public static intensityToHex(intensity: number): string {
        //    var decreaseOverlap = 20;
        //    intensity = Math.floor(Math.abs(intensity) * 255);
        //    if (intensity < 0) {
        //        intensity = 0;
        //    } else if (intensity > 255 - decreaseOverlap) {
        //        intensity = 255 - decreaseOverlap;
        //    }
        //    var hexString: string = (255 - decreaseOverlap - intensity).toString(16);
        //    if (hexString.length == 1) {
        //        hexString = "0" + hexString;
        //    }
        //    return hexString;
        //}

        ///**
        // * Create a dummy heatmap
        // */
        //private createDummyHeatmap() {
        //}
    }
}
