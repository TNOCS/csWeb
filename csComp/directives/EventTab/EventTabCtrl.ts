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
        private debounceSendItems: Function;
        private tlItems: any[]; // Timeline items
        private newItems: any[]; // Timeline items that are not sent yet
        private tlGroups: any[]; // Timeline groups

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
                showFeatureTags: true,
                id: 'eventtab',
                filters: columnFilter,
                roles: [],
                fields: { 'title': 'Name', 'updated': 'updated', 'prio': 'prio', 'description': 'description' },
                propertyTags: ['layerTitle', 'state'],
                timeReference: 'timeline',
                orderBy: 'Updated',
                actions: null,
                canShare: false
            };
            this.kanban = {
                featureTypesToAdd: [],
                columns: [column],
                canAdd: false
            };

            // Don't flood the messagebus, but cache all items and send them together after a second
            this.debounceSendItems = _.debounce(this.sendTimelineItems, 1000);
            this.tlItems = [];
            this.newItems = [];
            this.tlGroups = [];

            this.$messageBusService.subscribe('eventtab', (topic, value) => {
                if (!value || !topic) return;
                switch (topic) {
                    case 'updated':
                        this.addEvent(value);
                        break;
                    case 'added':
                        this.addEvent(value);
                        break;
                    case 'reset':
                        this.reset();
                        break;
                    case 'zoomto':
                        this.zoomTo(value);
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
        }

        public reset() {
            this.tlItems = [];
            this.newItems = [];
            this.tlGroups = [];
            this.sendTimelineItems();
            this.sendTimelineGroups();
            this.layer.data.features = [];
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

        /** 
         * Add a card-item to the event list. Provide a feature, and optionally some property-keys of data you want to display.
         */
        private addEvent(data: { feature: IFeature, config: { titleKey: string, descriptionKey: string, dateKey: string } }) {
            var f = data.feature;
            var config = data.config;
            var titleKey = (!config.titleKey) ? 'Name' : config.titleKey;
            var descriptionKey = (!config.descriptionKey) ? 'state' : config.descriptionKey;
            var dateKey = (!config.dateKey) ? 'timeline' : config.dateKey;

            //Create event feature
            var newF = new csComp.Services.Feature();
            newF.layer = this.layer;
            newF.geometry = f.geometry;
            newF.fType = f.fType;
            newF.effectiveStyle = f.effectiveStyle;
            newF.type = f.type;
            newF.id = csComp.Helpers.getGuid();
            newF._gui = f._gui;
            newF.properties = f.properties;

            // Try to find propertytype for description label
            var pts = csComp.Helpers.getPropertyTypes(f.fType, {});
            var descrText;
            pts.some((p) => {
                if (p.hasOwnProperty && p.hasOwnProperty('label') && p.label === descriptionKey && p.hasOwnProperty('options')) {
                    descrText = p.options[newF.properties[descriptionKey]];
                    return true;
                }
                return false;
            });

            // Set the item date
            if (dateKey === 'timeline') {
                newF.properties['date'] = new Date(this.$layerService.project.timeLine.focus);
                newF.properties['updated'] = new Date(this.$layerService.project.timeLine.focus);
            } else {
                newF.properties['date'] = new Date(newF.properties[dateKey]);
                newF.properties['updated'] = new Date(newF.properties[dateKey]);
            }

            newF.properties['layerTitle'] = (f.layer) ? f.layer.id : '';
            if (!newF.properties.hasOwnProperty('tags')) newF.properties['tags'] = [];
            this.kanban.columns[0].propertyTags.forEach((tag) => {
                if (newF.properties.hasOwnProperty(tag)) {
                    pts.some((p) => {
                        if (p.hasOwnProperty && p.hasOwnProperty('label') && p.label === descriptionKey) {
                            newF.properties['tags'].push(csComp.Helpers.convertPropertyInfo(p, newF.properties[tag]));
                            return true;
                        }
                        return false;
                    });
                }
            });
            newF.properties['description'] = (descrText ? descrText : newF.properties[descriptionKey]);
            newF.layerId = 'eventlayerid';
            this.addTimelineItem(newF);
            this.layer.data.features.push(newF);
        }

        private addTimelineItem(f: IFeature) {
            var timelineItem = {
                start: f.properties['updated'],
                content: f.properties['Name'],
                id: f.id,
                group: f.fType.name
            };
            // Check if group exists on timeline, otherwise create it
            if (!this.tlGroups.some((g) => { return timelineItem.group === g.title; })) {
                var timelineGroup = {
                    content: f.fType.name,
                    id: f.fType.name,
                    title: f.fType.name
                };
                this.tlGroups.push(timelineGroup);
                this.sendTimelineGroups();
            }
            this.newItems.push(timelineItem);
            this.debounceSendItems();
        }

        private mergeItems() {
            //Sort items per group
            var changedGroups = {};
            this.newItems.forEach((i) => {
                if (changedGroups.hasOwnProperty(i.group)) {
                    changedGroups[i.group].push(i);
                } else {
                    changedGroups[i.group] = [i];
                }
            });
            Object.keys(changedGroups).forEach((key) => {
                if (changedGroups[key].length === 1) {
                    // If there is 1 item, send the raw item
                    this.tlItems.push(changedGroups[key][0]);
                } else if (changedGroups[key].length > 1) {
                    // else merge items
                    var mergedItem = changedGroups[key][0];
                    mergedItem['content'] = changedGroups[key].length.toString() + ' ' + changedGroups[key][0].group + ' updates';
                    this.tlItems.push(mergedItem);
                }
            });
            this.newItems = [];
        }

        private sendTimelineItems() {
            this.mergeItems();
            this.$messageBusService.publish('timeline', 'setItems', this.tlItems);
        }

        private sendTimelineGroups() {
            this.$messageBusService.publish('timeline', 'setGroups', this.tlGroups);
        }

        private zoomTo(data: any) {
            if (!data.hasOwnProperty('id')) return;
            var foundFeature;
            this.layer.data.features.some((f) => {
                if (f.id === data.id) {
                    foundFeature = f;
                    return true;
                }
                return false;
            });
            if (foundFeature) {
                this.$mapService.zoomTo(foundFeature, this.$mapService.map.getZoom());
            }
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
