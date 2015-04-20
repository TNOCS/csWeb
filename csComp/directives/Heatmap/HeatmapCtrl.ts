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
        moveListenerInitialized: boolean = false;
        projLayer = new csComp.Services.ProjectLayer();

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
          private $localStorageService: angular.local.storage.ILocalStorageService<any>,
          private $layerService       : csComp.Services.LayerService,
          private $mapService         : csComp.Services.MapService,
          private messageBusService   : csComp.Services.MessageBusService
        ) {
          $scope.vm = this;

          messageBusService.subscribe('layer',(title, layer) => {//, layer: csComp.Services.ProjectLayer) => {
              switch (title) {
                  case 'deactivate':
                      /* For an explanation to the removing of layers, see the bottom of this file */
                      if (layer.type && layer.type === "Heatmap" && layer.id === this.projLayer.id && layer != this.projLayer) {
                          this.$layerService.removeLayer(this.projLayer);
                          delete (this.heatmapModel);
                          this.initializeHeatmap();
                      }
                      break;
                  case 'activated':
                      if (layer.type && layer.type === "Heatmap") this.updateAvailableHeatmaps();
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
            if (!this.heatmapModel) {
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
            } else {
                for (var index = 0; index < this.heatmapModels.length; index++) {
                    if (this.heatmapModel.id == this.heatmapModels[index].id) {
                        this.heatmapModels.splice(index, 1);
                        break;
                    }
                }
                this.heatmapModels.push(this.heatmapModel);
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
            /* Add active feature layer reference to the referencelist (TODO: find reference layer through enabled features) */
            this.heatmapModel.heatmapSettings.referenceList = [];
            this.heatmapModel.heatmapItems.forEach((hi) => {
                if (hi.isSelected) {
                    this.$layerService.project.groups.forEach((group) => {
                        if (group.title == "Features") {
                            group.layers.forEach((l) => {
                                if (l.enabled) {
                                    this.heatmapModel.heatmapSettings.addReference(l.reference);
                                }
                            });
                        }
                    });
                }
            });

            /* Print the heatmap settings to the console in json format */
            console.log("\n-----------------\n" + "Exported heatmap starts here: \n");
            console.log(heatmap.serialize());
            console.log("\n-----------------\n" + "Exported heatmap ends here. \n");
            this.messageBusService.notify('Heatmap exported successfully', 'Your heatmap was exported to the console successfully.', csComp.Services.NotifyLocation.TopLeft);
        }

        removeHeatmap(heatmap: HeatmapModel) {
            if (!heatmap) return;
            var title = String.format(HeatmapCtrl.confirmationMsg1, heatmap.title);
            this.messageBusService.confirm(title, HeatmapCtrl.confirmationMsg2,(result) => {
                if (!result) return;
                this.$timeout(() => {
                    this.deleteHeatmap(heatmap);
                    this.updateAvailableHeatmaps();
                    //if (this.heatmap) this.updateHeatmap();
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
            // If the current heatmaplayer was a projectlayer, disable that one too
            if (this.$layerService.project.groups) {
                this.$layerService.project.groups.forEach((group) => {
                    group.layers.forEach((layer) => {
                        if (layer.type === "Heatmap" && layer.id === this.projLayer.id) {
                            this.$layerService.removeLayer(layer);
                        }
                    });
                });
            }

            delete (this.heatmapModel);
            delete (this.projLayer);
            this.projLayer = new csComp.Services.ProjectLayer();
            this.initializeHeatmap();
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
                    console.log('Modal dismissed at: ' + new Date());
                    delete (this.heatmapModel);
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
            //this.heatmapModel.updateWeights();
            this.updateHeatmap();
        }

        resolutionUpdated() {
            if (!this.heatmapModel) return;
            this.updateHeatmap();
        }

        /**
         * Update the available pre-set heatmaps.
         */
        private updateHeatmap() {
            if (this.heatmapModel) {
                // If the current heatmapmodel comes from a projectlayer, disable that layer
                if (this.$layerService.project.groups) {
                    this.$layerService.project.groups.forEach((group) => {
                        group.layers.forEach((layer) => {
                            if (layer.type === "Heatmap" && layer.id === this.heatmapModel.id && layer.mapLayer) {
                                this.$layerService.map.map.removeLayer(layer.mapLayer);
                                layer.enabled = true;
                            }
                        });
                    });
                }
                this.projLayer.heatmapItems = this.heatmapModel.heatmapItems;
                this.projLayer.heatmapSettings = this.heatmapModel.heatmapSettings;
                this.projLayer.id = this.heatmapModel.id;
                var currentZoom = this.$mapService.getMap().getZoom();
                if (currentZoom < this.heatmapModel.heatmapSettings.minZoom || currentZoom > this.heatmapModel.heatmapSettings.maxZoom) {
                    console.log("Heatmap is not supported for the current zoom level.");
                    this.$layerService.loadRequiredLayers(this.projLayer); // Make sure to load the required layers even if heatmap is not yet being drawn
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
            this.projLayer.data = JSON;
            this.projLayer.id = "";

            if (!this.moveListenerInitialized) {
                this.$layerService.map.map.addEventListener('moveend',(event) => {
                    this.updateHeatmap();
                });
                this.moveListenerInitialized = true;
            }
        }
    }
}

/* Heatmap layers:
 * ---------------
 * Two layers are used for the heatmaps, which are both very similar but different in an important way. The difference
 * lies in the fact that one layer comes directly from the project.json file. This layer is parsed and added to the layerservice
 * directly when it is enabled in the 'Layers' panel. The second layer is 'this.projLayer', which looks almost identical to
 * the parsed projectLayer, but it is generated programmatically. When a new heatmap is created, or a predefined heatmap is edited,
 * this.projLayer will be added to the layerservice. Very importantly, the MoveListener is connected to this.projLayer. That means
 * that every time the map is moved, 'this.projLayer' will contain the current heatmap, even when it was added from project.json.
 * Therefore, when one layer is being disabled, it needs to be checked whether the other layer is present in the layerservice,
 * and if so, it should be removed too.
 */
