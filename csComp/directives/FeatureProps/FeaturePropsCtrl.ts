module FeatureProps {
    import IFeature = csComp.Services.IFeature;
    import IFeatureType = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;
    import IPropertyTypeData = csComp.Services.IPropertyTypeData;

    declare var vg;

    class FeaturePropsOptions implements L.SidebarOptions {
        public position: string;
        public closeButton: boolean;
        public autoPan: boolean;

        constructor(position: string) {
            this.position = position;
            this.closeButton = true;
            this.autoPan = true;
        }
    }

    export interface IFeaturePropsScope extends ng.IScope {
        vm: FeaturePropsCtrl;
        showMenu: boolean;
        feature: IFeature;
        callOut: CallOut;
        tabs: JQuery;
        tabScrollDelta: number;
        featureTabActivated(sectionTitle: string, section: CallOutSection);
        autocollapse(init: boolean): void;
    }

    export interface ICorrelationResult {
        property: string;
        value: Object;
    }

    export interface ICallOutProperty {
        _id: string;
        key: string;
        value: string;
        property: string;
        canFilter: boolean;
        canStyle: boolean;
        canShowStats: boolean;
        feature: IFeature;
        description?: string;
        propertyType?: IPropertyType;
        isFilter: boolean;
        showMore: boolean;
        showChart: boolean;
        stats: any;
        bins: any;
        cors: { [prop: string]: ICorrelationResult };
    }

    export class CallOutProperty implements ICallOutProperty {
        public stats: any;
        public bins: any;
        public _id: string;
        public showMore: boolean;
        public showChart: boolean;
        public cors: { [prop: string]: ICorrelationResult };
        constructor(
            public key: string,
            public value: string,
            public property: string,
            public canFilter: boolean,
            public canStyle: boolean,
            public canShowStats: boolean,
            public feature: IFeature,
            public isFilter: boolean,
            public isSensor: boolean,

            public description?: string,
            public propertyType?: IPropertyType,
            public timestamps?: number[],
            public sensor?: number[],
            public isDraft?: boolean) { this.cors = {}; this._id = csComp.Helpers.getGuid(); }

    }

    export interface ICallOutSection {
        propertyTypes: { [label: string]: IPropertyType }; // Probably not needed
        properties: Array<ICallOutProperty>;
        sectionIcon: string;
        addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, canShowStats: boolean, feature: IFeature,
            isFilter: boolean, description?: string, propertyType?: IPropertyType, isDraft?: boolean): void;
        hasProperties(): boolean;
    }

    export class CallOutSection implements ICallOutSection {
        propertyTypes: { [label: string]: IPropertyType };
        properties: Array<ICallOutProperty>;
        sectionIcon: string;

        constructor(sectionIcon?: string) {
            this.propertyTypes = {};
            this.properties = [];
            this.sectionIcon = sectionIcon;
        }

        showSectionIcon(): boolean { return !csComp.StringExt.isNullOrEmpty(this.sectionIcon); }

        addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, canShowStats: boolean, feature: IFeature,
            isFilter: boolean, description?: string, propertyType?: IPropertyType, isDraft?: boolean): void {
            var isSensor = feature.sensors && feature.sensors.hasOwnProperty(property);
            if (isSensor) {
                this.properties.push(new CallOutProperty(key, value, property, canFilter, canStyle, canShowStats, feature, isFilter, isSensor, description
                    ? description
                    : null, propertyType, feature.timestamps, feature.sensors[property], isDraft));
            } else {
                this.properties.push(new CallOutProperty(key, value, property, canFilter, canStyle, canShowStats, feature, isFilter, isSensor, description
                    ? description
                    : null, propertyType, null, null, isDraft));
            }
        }

        hasProperties(): boolean {
            return this.properties != null && this.properties.length > 0;
        }
    }

    declare var String;

    export class CallOut {
        public title: string;
        public icon: string;
        public sections: { [title: string]: ICallOutSection; };
        public sectionKeys: string[];
        public hasInfoSection: boolean;

        constructor(
            private type: IFeatureType,
            private feature: IFeature,
            private propertyTypeData: IPropertyTypeData,
            private layerservice: csComp.Services.LayerService,
            private mapservice: csComp.Services.MapService) {
            this.sections = {};
            this.sectionKeys = [];
            this.hasInfoSection = false;
            //if (type == null) this.createDefaultType();
            this.setTitle();
            this.setIcon(feature);

            var infoCallOutSection = new CallOutSection('fa-info');
            //var searchCallOutSection = new CallOutSection('fa-filter');
            var linkCallOutSection = new CallOutSection('fa-link');

            var displayValue: string;
            if (type != null) {

                var missing;
                //var propertyTypes = csComp.Helpers.getPropertyTypes(type, propertyTypeData);
                //if (propertyTypes.length === 0) { for (var pt in layerservice.propertyTypeData) propertyTypes.push(layerservice.propertyTypeData[pt]); };
                // if (type.showAllProperties || this.mapservice.isAdminExpert) {
                //     missing = csComp.Helpers.getMissingPropertyTypes(feature);
                //     // missing.forEach((pt: csComp.Services.IPropertyType) => {
                //     //     if (!propertyTypes.some(((p: csComp.Services.IPropertyType) => p.label === pt.label))) {
                //     //         propertyTypes.push(pt);
                //     //     }
                //     // });
                // }

                // if feature type has propertyTypeKeys defined use these to show the order of the properties
                if (feature.fType.propertyTypeKeys) {
                    feature.fType._propertyTypeData.forEach((mi: IPropertyType) => {
                        if (feature.properties.hasOwnProperty(mi.label) || mi.type === 'relation') {
                            if (mi.visibleInCallOut) this.addProperty(mi, feature, infoCallOutSection, linkCallOutSection);
                        }
                    });
                    if (feature.fType.showAllProperties || this.mapservice.isAdminExpert) {
                        for (var key in feature.properties) {
                            var mi = csComp.Helpers.getPropertyType(feature, key);
                            this.addProperty(mi, feature, infoCallOutSection, linkCallOutSection, true);
                        }
                    }
                } else { // if not go through all properties and find a propertyType
                    for (var key in feature.properties) {
                        var mi = layerservice.getPropertyType(feature, key);

                        if (mi) {
                            this.addProperty(mi, feature, infoCallOutSection, linkCallOutSection);
                        } else if (feature.fType.showAllProperties || this.mapservice.isAdminExpert) {
                            var prop = csComp.Helpers.getPropertyType(feature, key);
                            this.addProperty(prop, feature, infoCallOutSection, linkCallOutSection, true);
                        }
                    }
                }
            }
            if (infoCallOutSection.properties.length > 0) {
                this.hasInfoSection = true;
                this.sections['Aaa Info'] = infoCallOutSection; // The AAA is added as the sections are sorted alphabetically (not anymore in angular 1.4!!!)
                this.sectionKeys.push('Aaa Info');
            } else {
                this.hasInfoSection = false;
            }
            if (linkCallOutSection.properties.length > 0) { this.sections['linkedfeatures'] = linkCallOutSection; this.sectionKeys.push('linkedfeatures'); }
            //if (searchCallOutSection.properties.length > 0) {this.sections['zzz Search'] = searchCallOutSection; this.sectionKeys.push('zzz Search');}
            this.sectionKeys = this.sectionKeys.sort();
        }

        private addProperty(mi: IPropertyType, feature: IFeature, infoCallOutSection: CallOutSection, linkCallOutSection: CallOutSection, isDraft = false) {
            var callOutSection = this.getOrCreateCallOutSection(mi.section) || infoCallOutSection;
            if (callOutSection.propertyTypes.hasOwnProperty(mi.label)) return; // Prevent duplicate properties in the same  section
            callOutSection.propertyTypes[mi.label] = mi;
            var text = feature.properties[mi.label];
            if (mi.type === 'relation' && mi.visibleInCallOut && feature._gui && feature._gui['relations']) {
                if (feature._gui['relations'].hasOwnProperty(mi.label)) {
                    var results = feature._gui['relations'][mi.label];
                    var fPropType = <IPropertyType>{ type: 'feature', label: 'relatedfeature' };
                    results.forEach((res: IFeature) => {
                        fPropType.title = mi.title;
                        linkCallOutSection.addProperty(res.id, csComp.Helpers.getFeatureTitle(res), fPropType.label, false, false, false, res, false, mi.description, fPropType);
                    });
                }
            }
            var displayValue = csComp.Helpers.convertPropertyInfo(mi, text);
            // Skip empty, non-editable values
            if (!mi.canEdit && csComp.StringExt.isNullOrEmpty(displayValue)) return;

            var canFilter = (mi.type === 'number' || mi.type === 'text' || mi.type === 'options' || mi.type === 'date' || mi.type === 'boolean');
            if (mi.filterType) canFilter = mi.filterType.toLowerCase() !== 'none';
            var canStyle = (mi.type === 'number' || mi.type === 'options' || mi.type === 'color');
            if (mi.styleType) canStyle = mi.styleType.toLowerCase() !== 'none';
            var canShowStats = (typeof mi.canShowStats === 'undefined') || mi.canShowStats;
            if (mi.visibleInCallOut) {
                callOutSection.addProperty(mi.title, displayValue, mi.label, canFilter, canStyle, canShowStats, feature, false, mi.description, mi, isDraft);
            }

            //searchCallOutSection.addProperty(mi.title, displayValue, mi.label, canFilter, canStyle, feature, false, mi.description);
        }



        public sectionCount(): number {
            return this.sectionKeys.length;
        }

        public firstSection(): ICallOutSection {
            var first = this.sections[this.sectionKeys[0]];
            return first;
        }

        public lastSection(): ICallOutSection {
            var last = this.sections[this.sectionKeys[this.sectionKeys.length - 1]];
            return last;
        }

        private getOrCreateCallOutSection(sectionTitle: string): ICallOutSection {
            if (!sectionTitle) {
                return null;
            }
            if (sectionTitle in this.sections)
                return this.sections[sectionTitle];
            this.sections[sectionTitle] = new CallOutSection();
            this.sectionKeys.push(sectionTitle);
            return this.sections[sectionTitle];
        }

        /**
         * Set the title of the callout to the title of the feature.
         */
        private setTitle() {
            this.title = csComp.Helpers.featureTitle(this.type, this.feature);
        }

        private setIcon(feature: csComp.Services.IFeature) {
            this.icon = (this.type == null || this.type.style == null || !this.type.style.hasOwnProperty('iconUri') || this.type.style.iconUri.toLowerCase().indexOf('_media') >= 0)
                ? ''
                : this.type.style.iconUri.indexOf('{') >= 0
                    ? csComp.Helpers.convertStringFormat(feature, this.type.style.iconUri)
                    : this.type.style.iconUri;
        }
    }

    export class FeaturePropsCtrl {
        private scope: IFeaturePropsScope;
        public lastSelectedProperty: IPropertyType;
        private defaultDropdownTitle: string;

        // list of active stats/charts properties, used when switching between features to keep active stats open
        private showMore = [];
        private showChart = [];

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
            '$translate',
            '$compile'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IFeaturePropsScope,
            private $location: ng.ILocationService,
            private $sce: ng.ISCEService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $translate: ng.translate.ITranslateService,
            private $compile: ng.ICompileService
        ) {
            this.setDropdownTitle();
            //this.$layerService.addLayer();
            this.scope = $scope;
            $scope.vm = this;
            $scope.showMenu = false;

            $scope.featureTabActivated = function (sectionTitle: string, section: CallOutSection) {
                $messageBusService.publish('FeatureTab', 'activated', { sectionTitle: sectionTitle, section: section });
            };

            //$messageBusService.subscribe('sidebar', this.sidebarMessageReceived);
            console.log('init featurepropsctrl');
            $messageBusService.subscribe('feature', this.featureMessageReceived);

            var widthOfList = function () {
                var itemsWidth = 0;
                $('#featureTabs>li').each(function () {
                    var itemWidth = $(this).outerWidth();

                    itemsWidth += itemWidth;
                });
                return itemsWidth;
            };

            $scope.autocollapse = function (initializeTabPosition = false) {
                var tabs = $('#featureTabs');

                if (tabs.outerWidth() < widthOfList() || parseFloat(tabs.css('margin-left')) < 0) {
                    $('#leftArr').show();
                    $('#rightArr').show();
                    if (initializeTabPosition) {
                        tabs.animate({ 'margin-left': '20px' }, 'slow');
                    }
                } else {
                    $('#leftArr').hide();
                    $('#rightArr').hide();
                    if (initializeTabPosition) {
                        tabs.animate({ 'margin-left': '0px' }, 'slow');
                    }
                }
            };

            $scope.autocollapse(true); // when document first loads
            $scope.tabs = $('#featureTabs');
            $scope.tabScrollDelta = $scope.tabs.outerWidth();

            this.displayFeature(this.$layerService.lastSelectedFeature);
            this.$scope.feature = this.$layerService.lastSelectedFeature;

            this.$messageBusService.subscribe('timeline', (action, value) => {
                if (action === 'updateFeatures' && this.$scope.callOut) {
                    this.updateAllStatsDelay();
                }
            });
        }

        updateAllStatsDelay = _.debounce(this.updateAllStats, 500);
        updateStatsDelay = (prop) => { _.debounce(this.getPropStats, 500, true); };

        private updateAllStats() {
            if (!this.$scope.callOut) return;
            for (var s in this.$scope.callOut.sections) {
                var section = this.$scope.callOut.sections[s];
                section.properties.forEach(prop => {
                    if (prop.showMore) {
                        this.updateStatsDelay(prop);
                    }
                });
            }
        }

        public saveFeatureType() {
            var resource = this.$layerService.findResourceByFeature(this.$scope.feature);
            if (resource) { this.$layerService.saveResource(resource); }
        }



        public savePropertyType(item: CallOutProperty) {
            var propType = item.propertyType;
            console.log('saving property');
            console.log(propType);
            var resource = this.$layerService.findResourceByFeature(this.$scope.feature);
            if (item.isDraft) {
                var key = csComp.Helpers.getPropertyKey(item.feature.fType.propertyTypeKeys, item.property);
                resource.propertyTypeData[key] = propType;
                item.feature.fType.propertyTypeKeys += ';' + key;
                item.isDraft = false;
                this.$layerService.propertyTypeData[key] = propType;
                //alert('saving draft');
            }

            this.$layerService.saveResource(resource);
            this.displayFeature(this.$scope.feature);
        }

        public selectProperty(prop: IPropertyType, $event: ng.IAngularEvent) {
            this.lastSelectedProperty = prop;
            $event.stopPropagation();
        }

        public openImage(img: string) {
            window.open(img, 'mywindow', 'width=600')

        }

        public saveFeature() {
            this.$layerService.unlockFeature(this.$scope.feature);
            this.$layerService.saveFeature(this.$scope.feature, true);

            this.$layerService.updateFeature(this.$scope.feature);
            this.displayFeature(this.$layerService.lastSelectedFeature);
        }

        public startEditFeature() {
            this.$scope.feature._gui['editMode'] = true;
            this.$layerService.updateFeature(this.$scope.feature);
        }

        public editFeature() {
            var rpt = csComp.Helpers.createRightPanelTab('featuretype', 'featuretype', this.$layerService.lastSelectedFeature, 'Edit group');
            this.$messageBusService.publish('rightpanel', 'activate', rpt);
            this.$layerService.updateFeature(this.$layerService.lastSelectedFeature);
        }

        public setFilter(item: CallOutProperty, $event: ng.IAngularEvent) {
            this.$layerService.setPropertyFilter(item);
            this.$layerService.visual.leftPanelVisible = true;
            (<any>$('#leftPanelTab a[data-target="#filters"]')).tab('show');
            $event.stopPropagation();
        }

        public toTrusted(html: string): string {
            try {
                if (html === undefined || html === null)
                    return this.$sce.trustAsHtml(html);
                return this.$sce.trustAsHtml(html.toString());
            } catch (e) {
                console.log(e + ': ' + html);
                return '';
            }
        }

        public toSemanticLink(value: string): string {
            var parts = value.split('@');
            return parts[0];
        }

        public activateSemanticLink(value: string) {
            this.$messageBusService.publish('semantic', 'activate', value);
            // var parts = value.split('@');
            // if (parts.length > 0) {
            //     alert(parts[1]);
            // }

        }

        public openLayer(property: FeatureProps.CallOutProperty) {
            if (property.feature != null && property.feature.properties.hasOwnProperty(property.propertyType.label)) {
                var link = property.feature.properties[property.propertyType.label];
                // alert(link);
            }
        }

        /**
         * Callback function
         * @see {http://stackoverflow.com/questions/12756423/is-there-an-alias-for-this-in-typescript}
         * @see {http://stackoverflow.com/questions/20627138/typescript-this-scoping-issue-when-called-in-jquery-callback}
         * @todo {notice the strange syntax using a fat arrow =>, which is to preserve the this reference in a callback!}
         */
        private sidebarMessageReceived = (title: string): void => {
            //console.log('sidebarMessageReceived');
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
            }
            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        };

        private featureMessageReceived = (title: string, feature: IFeature): void => {
            var callApply = true;
            switch (title) {
                case 'onFeatureDeselect':
                    if (this.$layerService.selectedFeatures.length === 0) {
                        this.$layerService.visual.rightPanelVisible = false;
                    } else {
                        this.updateAllStats();
                    }
                    break;
                case 'onFeatureSelect':
                    callApply = false;
                    this.displayFeature(feature);
                    this.$scope.feature = this.$layerService.lastSelectedFeature;
                    //this.$layerService.visual.rightPanelVisible = true;
                    this.updateAllStats();
                    if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                        this.$scope.$root.$apply();
                    }
                    break;
                case 'onRelationsUpdated':
                    this.setShowSimpleTimeline();
                    this.displayFeature(feature);
                    this.updateHierarchyLinks(feature);
                    this.$scope.feature = feature;
                    this.$scope.autocollapse(true);
                    break;
                case 'onFeatureUpdated':
                    this.displayFeature(this.$layerService.lastSelectedFeature);
                    this.$scope.feature = this.$layerService.lastSelectedFeature;
                    break;
                case 'onFeatureRemoved':
                    if (feature === this.$layerService.lastSelectedFeature) this.$messageBusService.publish('rightpanel', 'deactiveContainer', 'featureprops');
                    break;
            }
            if (callApply && this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$root.$apply();
            }
        };

        public setCorrelation(item: ICallOutProperty, $event: ng.IAngularEvent) {
            $event.stopPropagation();
            var values = this.$layerService.getPropertyValues(item.feature.layer, item.property);
            for (var s in this.$scope.callOut.sections) {
                var sec = this.$scope.callOut.sections[s];
                sec.properties.forEach((p: ICallOutProperty) => {
                    if (p.property !== item.property) {
                        var c = vg.util.cor(values, item.property, p.property);
                        p.cors[item.property] = {
                            property: item.property,
                            value: c
                        };
                    }
                });
            }
        }

        public addSparkline(item: ICallOutProperty) {
            var ch = $('#featurepropchart_' + item._id);
            ch.empty();
            if (this.showChart.indexOf(item.property) < 0) this.showChart.push(item.property);
            var ns = <any>this.$scope;
            ns.item = item;

            // create sparkline
            try {
                var chartElement = this.$compile('<sparkline-chart timestamps="item.timestamps" smooth="false" closed="false" sensor="item.sensor" width="320" height="100" showaxis="true"></sparkline-chart>')(ns);
                ch.append(chartElement);
            } catch (e) {
                console.log('Error adding sparkline');
            }
        }

        public createSparkLineChart(item: ICallOutProperty) {
            item.showChart = !item.showChart;

            if (item.showChart) {
                this.addSparkline(item);
            } else {
                var ch = $('#featurepropchart_' + item._id);
                ch.empty();
            }
        }

        public getPropStats(item: ICallOutProperty) {
            if (item.showMore) {
                //console.log('stats: calc stats for ' + item.property);
                if (this.showMore.indexOf(item.property) < 0) this.showMore.push(item.property);
                var values = this.$layerService.getPropertyValues(item.feature.layer, item.property);
                var d = item.property;
                var res = vg.util.summary(values, [item.property]);
                item.stats = res[0];
                item.stats.sum = item.stats.count * item.stats.mean;
            } else {
                if (this.showMore.indexOf(item.property) >= 0) this.showMore = this.showMore.filter((s) => s !== item.property);
            }
        }

        public featureType: IFeatureType;

        private displayFeature(feature: IFeature): void {
            if (!feature) return;
            this.featureType = feature.fType;
            //this.featureType.id
            // If we are dealing with a sensor, make sure that the feature's timestamps are valid so we can add it to a chart
            if (typeof feature.sensors !== 'undefined' && typeof feature.timestamps === 'undefined')
                feature.timestamps = this.$layerService.findLayer(feature.layerId).timestamps;

            this.$scope.callOut = new CallOut(this.featureType, feature, this.$layerService.propertyTypeData, this.$layerService, this.$mapService);
            if (this.showMore.length > 0 || this.showChart.length > 0) {
                for (var s in this.$scope.callOut.sections) {
                    var sec = this.$scope.callOut.sections[s];
                    sec.properties.forEach((p: ICallOutProperty) => {
                        p.showMore = this.showMore.indexOf(p.property) >= 0;
                        p.showChart = this.showChart.indexOf(p.property) >= 0;
                        if (p.showChart) this.addSparkline(p);
                        if (p.showMore) this.getPropStats(p);
                    });
                }
            }
        }

        public removeFeature() {
            this.$layerService.removeFeature(this.$scope.feature, true);
        }

        private updateHierarchyLinks(feature: IFeature): void {
            if (!feature) return;
            // Add properties defined inside of layers to the project-wide properties.
            this.$layerService.project.groups.forEach((group) => {
                group.layers.forEach((l) => {
                    if (l.type === 'hierarchy' && l.enabled) {
                        if ((<any>(l.data)) && (<any>(l.data)).features) {
                            (<any>(l.data)).features[0].fType.propertyTypeData.forEach((pt) => {
                                if (pt.type === 'hierarchy') {
                                    if (pt.targetlayer === feature.layerId) {
                                        var featureType = this.$layerService.getFeatureType(feature);
                                        var propertyTypes = csComp.Helpers.getPropertyTypes(feature.fType, this.$layerService.propertyTypeData);
                                        var found = false;
                                        propertyTypes.forEach((p) => {
                                            if (p.label === pt.label) {
                                                found = true;
                                            }
                                        });
                                        if (!found) featureType._propertyTypeData.push(pt);
                                    }
                                }
                            });
                        }
                    }
                });
            });
            //csComp.Helpers.getPropertyTypes
        }

        showSensorData(property: ICallOutProperty) {
            //console.log(property);
        }

        timestamps = new Array<{ title: string; timestamp: number }>();
        showSimpleTimeline: boolean;
        focusTime: string;

        setShowSimpleTimeline() {
            if (this.$mapService.timelineVisible
                || typeof this.$layerService.lastSelectedFeature === 'undefined'
                || this.$layerService.lastSelectedFeature == null) {
                this.showSimpleTimeline = false;
                return;
            }
            var feature = this.$layerService.lastSelectedFeature;
            this.showSimpleTimeline = (typeof feature.sensors !== 'undefined' && feature.sensors !== null);
            if (this.showSimpleTimeline) this.setTimestamps();
        }

        setTimestamps() {
            var feature = this.$layerService.lastSelectedFeature;
            var layer = this.$layerService.findLayer(feature.layerId);
            if ((typeof layer.timestamps === 'undefined' || layer.timestamps == null) &&
                (typeof feature.timestamps === 'undefined' || feature.timestamps == null)) return [];
            var time = this.timestamps = new Array<{ title: string; timestamp: number }>();
            (layer.timestamps || feature.timestamps).forEach((ts) => {
                var date = new Date(ts);
                var dateString = String.format('{0}-{1:00}-{2:00}', date.getFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
                if (date.getUTCHours() > 0 || date.getUTCMinutes() > 0)
                    dateString += String.format(' {0:00}:{1:00}', date.getUTCHours(), date.getUTCMinutes());
                time.push({ title: dateString, timestamp: ts });
            });

            // Set focus time
            var focus = this.$layerService.project.timeLine.focus;
            if (focus > time[time.length - 1].timestamp) {
                this.focusTime = time[time.length - 1].title;
                this.setTime(time[time.length - 1]);
            } else if (focus < time[0].timestamp) {
                this.focusTime = time[0].title;
                this.setTime(time[0]);
            } else {
                for (var i = 1; i < time.length; i++) {
                    if (focus > time[i].timestamp) continue;
                    this.focusTime = time[i].title;
                    this.setTime(time[i]);
                    break;
                }
            }
            return time;
        }

        public zoomToDate(date: Date) {
            var d = new Date(date.toString());
            this.$layerService.project.timeLine.isLive = false;
            this.$layerService.project.timeLine.setFocus(d);
            this.$messageBusService.publish('timeline', 'setFocus', d);
        }

        public selectFeature(feature: IFeature) {
            if (!feature) return;
            this.$layerService.selectFeature(feature);
        }

        setTime(time: { title: string; timestamp: number }) {
            this.focusTime = time.title;
            this.$layerService.project.timeLine.setFocus(new Date(time.timestamp));
            this.$messageBusService.publish('timeline', 'focusChange', time.timestamp);
        }

        getFormattedDate(fp, pt: IPropertyType): string {
            if (!fp) return;
            var format: string;
            if (pt && pt.hasOwnProperty('stringFormat')) {
                format = pt.stringFormat;
            } else {
                return moment(fp).calendar();
                //format = 'DD MMMM YYYY ';
            }
            if (moment(fp).format(format) === 'Invalid date') {
                return moment(fp, 'YYYYMMDD').format(format);
            } else {
                return moment(fp).format(format);
            }
        }

        //When a feature has multiple sections, a dropdown list is created with the title defined in the language entry 'CHOOSE_DROPDOWN' (e.g. 'Choose...' or 'Data...')
        private setDropdownTitle() {
            this.$translate('CHOOSE_DROPDOWN').then(translation => {
                if (typeof translation === 'string' && translation.length > 0) {
                    this.defaultDropdownTitle = translation;
                } else {
                    this.defaultDropdownTitle = '...';
                }
            });
        }
    }
}
