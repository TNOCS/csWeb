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
            'messageBusService'
        ];

        constructor(private messageBusService: MessageBusService) {}

        /** Initialize the default actions */
        init(layerService: LayerService) {
            this.layerService = layerService;

            // NOTE all action titles must be in lowercase
            this.actions['select feature'] = () => {
                var rpt = csComp.Helpers.createRightPanelTab('featureprops', 'featureprops', null, 'Selected feature', '{{"FEATURE_INFO" | translate}}', 'info', false, true);
                this.messageBusService.publish('rightpanel', 'activate', rpt);
            };

            this.actions['select agenda'] = () => {
                var rpt = csComp.Helpers.createRightPanelTab('agenda', 'agenda', null, 'Selected agenda', '{{"AGENDA_INFO" | translate}}', 'info', false, true);
                this.messageBusService.publish('rightpanel', 'activate', rpt);
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
                var group = this.layerService.findGroupById(options.groupId);
                if (typeof group === 'undefined') return;
                var propType = this.layerService.findPropertyTypeById(options.propertyId);
                if (typeof propType === 'undefined') return;
                this.layerService.setGroupStyle(group, propType);
            };

            this.actions['activate baselayer'] = options => {
                console.log('Activate baselayer action called');
                var layer: BaseLayer = this.layerService.$mapService.getBaselayer(options.layerId);
                this.layerService.activeMapRenderer.changeBaseLayer(layer);
                this.layerService.$mapService.changeBaseLayer(options.layerId);
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
