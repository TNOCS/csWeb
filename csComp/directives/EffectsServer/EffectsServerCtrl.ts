module EffectsServer {
    export class EffectsServerModel implements csComp.Services.IActionService {
        private layerService: csComp.Services.LayerService
        id = "effectsserveractions";
        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) {
            console.log('effectsserver:feature selected');
        }
        addLayer(layer) {}
        removeLayer(layer) {}
        getLayerActions(layer) : IActionOption[] { return null; }

        getFeatureActions(feature) {
            var effectsServerOption = <IActionOption>{
                title: "Calculate Effects Model Here"
            }
            effectsServerOption.callback = this.showEffectsModel;
            return [effectsServerOption];
        }

        getFeatureHoverActions(feature) : IActionOption[] { return null; }

        deselectFeature(feature: IFeature) { }
        updateFeature(feature: IFeature) { }

        public showEffectsModel(feature: IFeature, layerService: csComp.Services.LayerService) {

            var effectsLayer = layerService.findLayer('effects');

            if (effectsLayer) {

                if (feature.geometry.type !== 'Point') {
                    console.log('Can only create effects layer from a Point');
                    return;
                }

                if (feature.layer.id === "Tankstations") {

                    var buildingLayer = layerService.findLayer('Gebouwen');
                    var urlParams = buildingLayer.url.split('/');
                    var locationIndex = -1;
                    urlParams.some((param, index) => {
                        if (param.substring(0, 12) === 'gemeentes_3d') {
                            locationIndex = index;
                            return true;
                        }
                        return false;
                    });

                    urlParams[locationIndex+1] = feature.properties["Gemeente"] + '.json';
                    buildingLayer.url = urlParams.join('/');

                    layerService.addLayer(buildingLayer);
                }

                if (!effectsLayer.enabled) {
                    var rpt = csComp.Helpers.createRightPanelTab("rightpanel", "effectsserver", {layer: effectsLayer, feature: feature}, "Effects Server Options");
                    layerService.$messageBusService.publish("rightpanel", "activate", rpt);
                } else {
                    if (effectsLayer.layerSource) effectsLayer.layerSource.refreshLayer(effectsLayer);
                }
            }
        }

        public init(layerService: csComp.Services.LayerService) {
            console.log('init EffectsServerActionService');
            this.layerService = layerService;
            this.layerService.$messageBusService.serverSubscribe("effectsserver", "msg", (title: string, mcb: csComp.Services.IMessageBusCallback) => {
                if (mcb["data"] === "restart") {
                    this.layerService.$messageBusService.notify("restarting server", "restarting", csComp.Services.NotifyLocation.TopRight);
                    location.reload();
                }
            });
        }
    }

    export interface IEffectsServerScope extends ng.IScope {
        vm: EffectsServerCtrl;
    }

    declare var turf;

    export class EffectsServerCtrl {
        private scope: IEffectsServerScope;
        public layer: csComp.Services.ProjectLayer;
        private models: { [key: string]: any };
        private current_model: string;
        private current_feature: IFeature;

        private transformations: { [key: string]: string};
        private current_transformation: string;

        private current_result_parameter: string;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$http',
            'mapService',
            'layerService',
            'messageBusService',
            'dashboardService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IEffectsServerScope,
            private $http: ng.IHttpService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $dashboardService: csComp.Services.DashboardService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            this.current_feature = $scope.$parent["data"]["feature"];
            this.layer = $scope.$parent["data"]["layer"];
            this.models = {};
            this.models["Neutral Gas Dispersion: Toxic dose"] = {};

            this.transformations = {};
            this.transformations['isolines'] = "Isolines Transformation";
            this.transformations['isosurface'] = "Isosurface Transformation";
            this.transformations['raw'] = "Raw Points";

            // this.getModelNames();
            
            this.getModelOptions();
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') { this.$scope.$apply(); }
        }

        // could be used in the future to get more model names from the server. At the moment not all models are supported (or interesting for that matter)
        private getModelNames()
        {
            $.getJSON(
                '/effects/models',
                (model_names) => {
                    model_names["Models"].forEach(model => {
                        this.models[model["Name"]] = model;
                    });
                }
            );
        }

        public updateOptions() {

        }

        private getModelOptions()
        {
            for (var key in this.models) {
                $.getJSON(
                    '/effects/model?name=' + key,
                    (model_parameters) => {
                        this.models[key] = model_parameters["Parameters"];
                    }
                );
            }
        }

        public refreshEffectsServer() {
            var calculation_request = {
                 "CalculationRequest": {
                     "ModelName": this.current_model,
                     "FeatureLocation": [this.current_feature.geometry.coordinates[0], this.current_feature.geometry.coordinates[1]],
                     "transformationType": this.current_transformation,
                     "resultParameter": this.current_result_parameter,
                     "Parameters": this.models[this.current_model]}
                 };
            console.log('sending request');
            console.log(calculation_request);
            $.post(
                '/effects/start',
                calculation_request,
                (data) => {
                    console.log('got response');
                    console.log(data);

                    this.layer.data = data;         
                    this.layer.group.filterResult = data.features;
                    this.layer.enabled = true;

                    this.$layerService.addLayer(this.layer);
                    
                    this.$layerService.visual.rightPanelVisible = true;
                }
            )

        }

    }
}
