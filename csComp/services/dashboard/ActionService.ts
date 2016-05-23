module csComp.Services {

    export interface IButtonActionOptions {
        layerId?: string;
        groupId?: string;
        propertyId?: string;
        [key: string]: any;
    }

    export interface IButtonAction {
        /** Specifies button actions */
        [action: string]: (options: IButtonActionOptions) => void;
    }

    /**
     * The action service can be used to execute certain actions, e.g. when clicking a feature.
     * It comes with some predefined actions, and can be enhanced with other actions from your application.
     */
    export class ActionService {
        /** The layerService cannot be injected, as this would cause a circular dependency with the LayerService itself. */
        private layerService: LayerService;
        private actions: IButtonAction = {};

        public static $inject = [
            'messageBusService',
            '$timeout'
        ];

        constructor(private messageBusService: MessageBusService, private $timeout: ng.ITimeoutService) {}

        /** Initialize the default actions */
        init(layerService: LayerService) {
            this.layerService = layerService;

            // NOTE all action titles must be in lowercase
            this.actions['select feature'] = () => {
                var rpt = csComp.Helpers.createRightPanelTab('featureprops', 'featureprops', null, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'info', false, true);
                this.messageBusService.publish('rightpanel', 'activate', rpt);
                this.layerService.visual.rightPanelVisible = true;
            };

            this.actions['select agenda'] = () => {
                var rpt = csComp.Helpers.createRightPanelTab('agenda', 'agenda', null, 'Selected agenda', '{{"AGENDA_INFO" | translate}}', 'info', false, true);
                this.messageBusService.publish('rightpanel', 'activate', rpt);
            };
            
            this.actions['show style tab'] = () => {
                this.layerService.visual.leftPanelVisible = true;
                $('#style-tab').click();
            };
            
            this.actions['show filter tab'] = () => {
                this.layerService.visual.leftPanelVisible = true;
                $('#filter-tab').click();
            };

            this.actions['activate timerange'] = () => {
                console.log('Activate timerange action called');
                this.layerService.project.timeLine.start = new Date().getTime() - 1000 * 60 * 60 * 2;
                this.layerService.project.timeLine.end = new Date().getTime() + 1000 * 60 * 60 * 2;
                this.layerService.project.timeLine.focus = new Date().getTime();
            };

            this.actions['activate layer'] = options => {
                console.log('Activate layer action called');
                var pl = this.layerService.findLayer(options.layerId);
                if (typeof pl === 'undefined') return;
                this.layerService.toggleLayer(pl);
            };

            this.actions['activate style'] = options => {
                console.log('Activate style action called');
                if (options.layerId) {
                    var pl = this.layerService.findLayer(options.layerId);
                    if (typeof pl !== 'undefined') {
                        // If the layer is not loaded, activate style after loading.
                        if (!pl.enabled) {
                            this.layerService.toggleLayer(pl, () => {
                                this.$timeout(() => {
                                    this.activateStyle(options.groupId, options.propertyId);
                                }, 50);
                            });
                            return;
                            // If the layer is being loaded, activate style after activation message.
                        } else if (pl.isLoading) {
                            var handle = this.messageBusService.subscribe('layer', (a, l) => {
                                if (a === 'activated' && l.id === options.layerId) {
                                    this.$timeout(() => {
                                        this.activateStyle(options.groupId, options.propertyId);
                                    }, 50);
                                    this.messageBusService.unsubscribe(handle);
                                }
                            });
                            return;
                        }
                    }
                }
                this.activateStyle(options.groupId, options.propertyId);
            };

            this.actions['activate baselayer'] = options => {
                console.log('Activate baselayer action called');
                var layer: BaseLayer = this.layerService.$mapService.getBaselayer(options.layerId);
                this.layerService.activeMapRenderer.changeBaseLayer(layer);
                this.layerService.$mapService.changeBaseLayer(options.layerId);
            };

            this.actions['zoom map'] = options => {
                console.log('Zoom map action called');
                if (!options['zoomLevel']) return;
                this.$timeout(() => {
                    this.layerService.map.getMap().setZoom(+options['zoomLevel']);
                }, 0);
            };

            this.actions['center on map'] = options => {
                console.log('Center map action called');
                // Move map such that selected feature in the center of the map
                this.layerService.centerFeatureOnMap(this.layerService.selectedFeatures);
            };
            
            this.actions['reload project'] = options => {
                console.log('Reload project action called');
                this.layerService.openProject(this.layerService.projectUrl);
                this.layerService.checkViewBounds();
            };
        }

        /** Call an action by name (lowercase), optionally providing it with additional parameters like group, layer or property id. */
        public execute(actionTitle: string, options?: IButtonActionOptions) {
            let action = actionTitle.toLowerCase();
            if (!this.actions.hasOwnProperty(action)) {
                console.log(`Warning: action ${actionTitle} is not defined!`);
                return;
            }
            this.actions[action](options);
        }

        /** Add your own action to the list of all actions. */
        public addAction(actionTitle: string, func: (options: IButtonActionOptions) => void) {
            if (this.actions.hasOwnProperty(actionTitle)) {
                console.log(`Warning: action ${actionTitle} is already defined!`);
                return;
            }
            this.actions[actionTitle.toLowerCase()] = func;
        }

        /** Return a copy of all the actions. */
        public getActions() {
            var copy: IButtonAction;
            ng.copy(this.actions, copy);
            return copy;
        }

        public activateStyle(groupId: string, propId: string) {
            var group = this.layerService.findGroupById(groupId);
            if (typeof group === 'undefined') return;
            var propType = this.layerService.findPropertyTypeById(propId);
            if (typeof propType === 'undefined') return;
            this.layerService.setGroupStyle(group, propType);
        }
    }

    /**
      * Register service
      */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    myModule.service('actionService', csComp.Services.ActionService);
}
