module CompareWidget {
    import IFeature = csComp.Services.IFeature;
    import IFeatureType = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;
    import IPropertyTypeData = csComp.Services.IPropertyTypeData;

    export interface ICompareWidgetScope extends ng.IScope {
        vm: CompareWidgetCtrl;
        showMenu: boolean;
        featureTypeTitle: string;
        title: string;
        icon: string;
        selectedFeatures: IFeature[];
        data: ICompareWidgetData;
    }

    export interface ICompareWidgetData {
        /* Show number properties only */
        numbersOnly: boolean;
    }

    export class CompareWidgetCtrl {
        private scope: ICompareWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        public layer: csComp.Services.ProjectLayer;
        private featureTitles: string[] = [];
        private propertyTitles: string[] = [];
        private tableEntries: Dictionary<string[]> = {};
        public mBusHandles: csComp.Services.MessageBusHandle[] = [];

        // $inject annotation.
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            '$location',
            '$timeout',
            '$sce',
            'mapService',
            'layerService',
            'messageBusService',
            '$translate'
        ];


        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: ICompareWidgetScope,
            private $location: ng.ILocationService,
            private $timeout: ng.ITimeoutService,
            private $sce: ng.ISCEService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $translate: ng.translate.ITranslateService
        ) {
            this.scope = $scope;
            $scope.vm = this;
            $scope.showMenu = false;
            $scope.selectedFeatures = [];

            var par = <any>$scope.$parent;
            this.widget = par.widget;
            $scope.data = <ICompareWidgetData>this.widget.data;
            if (!$scope.data) $scope.data = {numbersOnly: true};

            this.parentWidget = $('#' + `${this.widget.elementId}-parent`);
            this.parentWidget.hide();
            this.mBusHandles.push($messageBusService.subscribe('feature', (title, feature) => {
                switch (title) {
                    case 'onFeatureSelect':
                    case 'onFeatureDeselect':
                        this.updateTable();
                        break;
                }
            }));
        }

        public stop() {
            if (this.mBusHandles) {
                this.mBusHandles.forEach((mbh) => {
                    this.$messageBusService.unsubscribe(mbh);
                });
                this.mBusHandles.length = 0;
            }
        }

        private updateTable() {
            this.$scope.selectedFeatures = this.$layerService.getSelectedFeatures();
            if (!this.$scope.selectedFeatures || this.$scope.selectedFeatures.length < 2) {
                this.hideWidget();
                this.$scope.featureTypeTitle = '';
                return;
            }
            this.tableEntries = this.getAllTableEntries(this.$scope.selectedFeatures);
            this.featureTitles = this.getAllFeatureTitles(this.$scope.selectedFeatures);
            this.showWidget();
        }

        private hideWidget() {
            this.$timeout(() => {
                this.parentWidget.hide();
            }, 0);
        }

        private showWidget() {
            this.$timeout(() => {
                this.$layerService.visual.rightPanelVisible = false;
                this.parentWidget.show();
            }, 0);
        }

        private getAllFeatureTitles(fts: IFeature[]): string[] {
            if (!fts || fts.length < 1) return;
            var titles = [];
            fts.forEach((f) => {
                titles.push(csComp.Helpers.getFeatureTitle(f));
            });
            return titles;
        }

        /**
         * 
         * Return all table entries to list in the comparetable
         * 
         * @private
         * @param {IFeature[]} fts
         * @returns {{ [key: string]: string[] }}
         * 
         * @memberOf CompareWidgetCtrl
         */
        private getAllTableEntries(fts: IFeature[]): { [key: string]: string[] } {
            if (!fts || fts.length < 1) return;
            var entries: { [key: string]: string[] } = {};
            var keys = [];
            fts.forEach((f) => {
                keys = keys.concat(_.keys(f.properties));
            });
            keys = _.uniq(keys);
            var fType: IFeatureType = JSON.parse(JSON.stringify(this.$layerService.getFeatureType(fts[0])));
            this.$scope.featureTypeTitle = (fType.name) ? fType.name.toLowerCase() : 'items';
            fType.propertyTypeKeys = keys.join(';');
            var propTypes = csComp.Helpers.getPropertyTypes(fType, this.$layerService.propertyTypeData);
            if (this.$scope.data.numbersOnly) {
                propTypes = _.pick(propTypes, (prop: IPropertyType, key) => { return prop.type === 'number'; });
            }
            keys = keys.filter((key) => {return (_.some(propTypes, (prop, propKey) => {return prop.label === key; })); });
            entries = <any>_.object(keys, keys);
            entries = _.each(entries, (val, key, arr) => { arr[key] = []; });
            this.propertyTitles = _.pluck(propTypes, 'title');
            var propTypesDict = _.indexBy(propTypes, 'label');
            fts.forEach((f, fIndex) => {
                keys.forEach((key) => {
                    entries[key].push((f.properties[key]) ? csComp.Helpers.convertPropertyInfo(propTypesDict[key], f.properties[key]) : null);
                });
            });
            return entries;
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