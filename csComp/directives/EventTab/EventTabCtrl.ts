module EventTab {
    import IFeature = csComp.Services.IFeature;
    import IFeatureType = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;
    import IPropertyTypeData = csComp.Services.IPropertyTypeData;

    export interface IEventTabScope extends ng.IScope {
        vm: EventTabCtrl;
        showMenu: boolean;
        title: string;
        icon: string;
    }

    export class EventTabCtrl {
        private scope: IEventTabScope;
        public kanban: KanbanColumn.KanbanConfig;
        public layer: csComp.Services.ProjectLayer;

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$location',
            '$sce',
            'mapService',
            'layerService',
            'messageBusService',
            '$translate'
        ];


        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IEventTabScope,
            private $location: ng.ILocationService,
            private $sce: ng.ISCEService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $translate: ng.translate.ITranslateService
        ) {
            this.scope = $scope;
            $scope.vm = this;
            $scope.showMenu = false;

            var columnFilter: KanbanColumn.ColumnFilter = {
                layerId: 'eventlayerid',
                prio: 1,
                roles: [],
                tags: []
            };
            var column: KanbanColumn.Column = {
                title: 'Log',
                id: 'eventtab',
                filters: columnFilter,
                roles: [],
                fields: {'title':'Name', 'updated':'updated', 'prio':'prio'},
                propertyTags: ['layerTitle', 'state'],
                timeReference: 'timeline',
                orderBy: 'New',
                actions: null,
                canShare: false
            };
            this.kanban = {
                featureTypesToAdd: [],
                columns: [column],
                canAdd: false
            };

            this.$messageBusService.subscribe('eventtab', (topic, value) => {
                if (!value || !topic) return;
                switch (topic) {
                    case 'updated':
                        this.addEvent(value);
                        break;
                    case 'added':
                        this.addEvent(value);
                        break;
                    default:
                        console.log('EventTab: Event type not found');
                }
            });

            this.init();
        }

        /**
         * Initialize an eventTab. Create a layer that contains all messages (features)
         */
        private init() {
            var l = new csComp.Services.ProjectLayer();
            l.url = '';
            l.id = 'eventlayerid';
            l.title = 'EventLayer';
            l.enabled = false;
            l.type = 'geojson';
            l.data = {};
            l.data.features = [];
            l.isDynamic = false;
            this.layer = l;
            // this.$layerService.addLayer(this.eventLayer);
        }

        private addUpdateEvent(f: IFeature) {
            var foundFeature;
            this.layer.data.features.some((sf) => {
                if (sf.id === f.id) {
                    foundFeature = sf;
                    return true;
                }
                return false;
            });
            foundFeature.properties['updated'] = new Date();
        }

        private addEvent(f: IFeature) {
            var newF = new csComp.Services.Feature();
            newF.layer = this.layer;
            newF.geometry = f.geometry;
            newF.fType = f.fType;
            newF.effectiveStyle = f.effectiveStyle;
            newF.type = f.type;
            newF.id = csComp.Helpers.getGuid();
            newF._gui = f._gui;
            newF.properties = f.properties;
            newF.properties['date'] = new Date(this.$layerService.project.timeLine.focus);
            newF.properties['updated'] = new Date(this.$layerService.project.timeLine.focus);
            newF.properties['layerTitle'] = f.layer.id;
            if (!newF.properties.hasOwnProperty('tags')) newF.properties['tags'] = [];
            this.kanban.columns[0].propertyTags.forEach((tag)=> {
                if (newF.properties.hasOwnProperty(tag)) newF.properties['tags'].push(newF.properties[tag]);
            });
            newF.properties['description'] = newF.properties['Name'] + ' is in state: ' + newF.properties['state'];
            newF.layerId = 'eventlayerid';
            this.layer.data.features.push(newF);
        }

        /**
         * Callback function
         * @see {http://stackoverflow.com/questions/12756423/is-there-an-alias-for-this-in-typescript}
         * @see {http://stackoverflow.com/questions/20627138/typescript-this-scoping-issue-when-called-in-jquery-callback}
         * @todo {notice the strange syntax using a fat arrow =>, which is to preserve the this reference in a callback!}
         */
        private sidebarMessageReceived = (title: string): void => {
            switch (title) {
                case 'toggle':
                    this.$scope.showMenu = !this.$scope.showMenu;
                    break;
                case 'show':
                    this.$scope.showMenu = true;
                    break;
                case 'hide':
                    this.$scope.showMenu = false;
                    break;
                default:
                    break;
            }
            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        };
    }
}
