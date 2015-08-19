module FeatureProps {
    import IFeature = csComp.Services.IFeature;
    import IFeatureType = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;
    import IPropertyTypeData = csComp.Services.IPropertyTypeData;

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
        featureType: IFeatureType;
        tabs: JQuery;
        tabScrollDelta: number;
        featureTabActivated(sectionTitle: string, section: CallOutSection);
        autocollapse(init: boolean): void;
    }

    export interface ICallOutProperty {
        key: string;
        value: string;
        property: string;
        canFilter: boolean;
        canStyle: boolean;
        feature: IFeature;
        description?: string;
        propertyType?: IPropertyType;
        isFilter: boolean;
    }

    export class CallOutProperty implements ICallOutProperty {
        constructor(
            public key: string,
            public value: string,
            public property: string,
            public canFilter: boolean,
            public canStyle: boolean,
            public feature: IFeature,
            public isFilter: boolean,
            public isSensor: boolean,
            public description?: string,
            public propertyType?: IPropertyType,
            public timestamps?: number[],
            public sensor?: number[]) { }
    }

    export interface ICallOutSection {
        propertyTypes: { [label: string]: IPropertyType }; // Probably not needed
        properties: Array<ICallOutProperty>;
        sectionIcon: string;
        addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, feature: IFeature, isFilter: boolean, description?: string, propertyType?: IPropertyType): void;
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

        addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, feature: IFeature, isFilter: boolean, description?: string, propertyType?: IPropertyType): void {
            var isSensor = feature.sensors && feature.sensors.hasOwnProperty(property);
            if (isSensor)
                this.properties.push(new CallOutProperty(key, value, property, canFilter, canStyle, feature, isFilter, isSensor, description ? description : null, propertyType, feature.timestamps, feature.sensors[property]));
            else
                this.properties.push(new CallOutProperty(key, value, property, canFilter, canStyle, feature, isFilter, isSensor, description ? description : null, propertyType));
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

        constructor(private type: IFeatureType, private feature: IFeature, private propertyTypeData: IPropertyTypeData, private layerservice: csComp.Services.LayerService, private mapservice: csComp.Services.MapService) {
            this.sections = {};
            this.sectionKeys = [];
            this.hasInfoSection = false;
            //if (type == null) this.createDefaultType();
            this.setTitle();
            this.setIcon(feature);

            var infoCallOutSection = new CallOutSection('fa-info');
            var searchCallOutSection = new CallOutSection('fa-filter');
            var hierarchyCallOutSection = new CallOutSection('fa-link');

            var displayValue: string;
            if (type != null) {
                var propertyTypes = csComp.Helpers.getPropertyTypes(type, propertyTypeData);
                if (propertyTypes.length === 0) { for (var pt in layerservice.propertyTypeData) propertyTypes.push(layerservice.propertyTypeData[pt]); };

                //
                if (type.showAllProperties || this.mapservice.isAdminExpert) {
                    var missing = csComp.Helpers.getMissingPropertyTypes(feature);
                    missing.forEach((pt: csComp.Services.IPropertyType) => {
                        if (!propertyTypes.some(((p: csComp.Services.IPropertyType) => p.label === pt.label))) {
                            propertyTypes.push(pt);
                        }
                    });
                }

                propertyTypes.forEach((mi: IPropertyType) => {
                    if (feature.properties.hasOwnProperty(mi.label) && mi.visibleInCallOut) {
                        var callOutSection = this.getOrCreateCallOutSection(mi.section) || infoCallOutSection;
                        if (callOutSection.propertyTypes.hasOwnProperty(mi.label)) return; // Prevent duplicate properties in the same  section
                        callOutSection.propertyTypes[mi.label] = mi;
                        var text = feature.properties[mi.label]; if (mi.type === "hierarchy") {
                            var count = this.calculateHierarchyValue(mi, feature, propertyTypeData, layerservice);
                            text = count + ";" + feature.properties[mi.calculation];
                        }
                        displayValue = csComp.Helpers.convertPropertyInfo(mi, text);
                        // Skip empty, non-editable values
                        if (!mi.canEdit && csComp.StringExt.isNullOrEmpty(displayValue)) return;

                        var canFilter = (mi.type === "number" || mi.type === "text" || mi.type === "options" || mi.type === "date" || mi.type === 'boolean');
                        var canStyle = (mi.type === "number" || mi.type === "options" || mi.type === "color");
                        if (mi.filterType != null) canFilter = mi.filterType.toLowerCase() != "none";
                        if (mi.visibleInCallOut) {
                            callOutSection.addProperty(mi.title, displayValue, mi.label, canFilter, canStyle, feature, false, mi.description, mi);
                        }
                        if (mi.type === "hierarchy") {
                            hierarchyCallOutSection.addProperty(mi.title, displayValue, mi.label, canFilter, canStyle, feature, false, mi.description, mi);
                        }
                        searchCallOutSection.addProperty(mi.title, displayValue, mi.label, canFilter, canStyle, feature, false, mi.description);
                    }
                });
            }
            if (infoCallOutSection.properties.length > 0) {
                this.hasInfoSection = true;
                this.sections['Aaa Info'] = infoCallOutSection; // The AAA is added as the sections are sorted alphabetically (not anymore in angular 1.4!!!)
                this.sectionKeys.push('Aaa Info');
            } else {
                this.hasInfoSection = false;
            }
            if (hierarchyCallOutSection.properties.length > 0) {this.sections['hierarchy'] = hierarchyCallOutSection; this.sectionKeys.push('hierarchy');}
            //if (searchCallOutSection.properties.length > 0) {this.sections['zzz Search'] = searchCallOutSection; this.sectionKeys.push('zzz Search');}
            this.sectionKeys = this.sectionKeys.sort();
        }

        private calculateHierarchyValue(mi: IPropertyType, feature: IFeature, propertyTypeData: IPropertyTypeData, layerservice: csComp.Services.LayerService): number {
            var countResults = [];
            var result: number = -1;
            var propertyTypes = csComp.Helpers.getPropertyTypes(feature.fType, propertyTypeData);
            for (var p in propertyTypes) {
                var pt = propertyTypes[p];
                if (pt.type === "relation" && mi.targetrelation === pt.label) {
                    countResults[pt.label] = pt.count;
                    if (mi.calculation === "count") {
                        result = pt.count;
                    }
                }
            }

            if (mi.calculation === "ratio") {
                var featureName = feature.properties[mi.subject];
                layerservice.project.features.forEach((f: csComp.Services.IFeature) => {
                    if (f.properties.hasOwnProperty(mi.target) && f.properties[mi.target] === featureName) {
                        if (f.properties.hasOwnProperty(mi.targetproperty)) {
                            result = +f.properties[mi.targetproperty] / countResults[mi.targetrelation];
                        }
                    }
                });
            }
            return result;
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
            this.title = CallOut.title(this.type, this.feature);
        }

        private setIcon(feature: csComp.Services.IFeature) {
            this.icon = (this.type == null || this.type.style == null || !this.type.style.hasOwnProperty('iconUri') || this.type.style.iconUri.toLowerCase().indexOf('_media') >= 0)
                ? ''
                : this.type.style.iconUri.indexOf('{') >= 0
                    ? csComp.Helpers.convertStringFormat(feature, this.type.style.iconUri)
                    : this.type.style.iconUri;
        }

        public static title(type: IFeatureType, feature: IFeature): string {
            var title = '';
            if (feature.hasOwnProperty('properties')) {
                if (feature.properties.hasOwnProperty('Name')) title = feature.properties['Name'];
                else if (feature.properties.hasOwnProperty('name')) title = feature.properties['name'];
                else if (feature.properties.hasOwnProperty('naam')) title = feature.properties['naam'];
            }
            else if (type != null && type.style != null && type.style.nameLabel) {
                title = feature.properties[type.style.nameLabel];
            }
            if (!csComp.StringExt.isNullOrEmpty(title) && !$.isNumeric(title))
                title = title.replace(/&amp;/g, '&');
            return title;
        }
    }

    export class FeaturePropsCtrl {
        private scope: IFeaturePropsScope;
        public lastSelectedProperty: IPropertyType;
        private defaultDropdownTitle: string;

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
            private $scope: IFeaturePropsScope,
            private $location: ng.ILocationService,
            private $sce: ng.ISCEService,
            private $mapService: csComp.Services.MapService,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService,
            private $translate: ng.translate.ITranslateService
            ) {
            this.setDropdownTitle();

            this.scope = $scope;
            $scope.vm = this;
            $scope.showMenu = false;

            $scope.featureTabActivated = function(sectionTitle: string, section: CallOutSection) {
                $messageBusService.publish('FeatureTab', 'activated', { sectionTitle: sectionTitle, section: section });
            };

            //$messageBusService.subscribe("sidebar", this.sidebarMessageReceived);
            //$messageBusService.subscribe("feature", this.featureMessageReceived);

            var widthOfList = function() {
                var itemsWidth = 0;
                $('#featureTabs>li').each(function() {
                    var itemWidth = $(this).outerWidth();

                    itemsWidth += itemWidth;
                });
                return itemsWidth;
            }

            $scope.autocollapse = function(initializeTabPosition = false) {
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
        }

        public selectProperty(prop: IPropertyType) {
            console.log(prop);
            this.lastSelectedProperty = prop;
        }

        public saveFeature() {
            this.$layerService.unlockFeature(this.$scope.feature);
            this.$layerService.saveFeature(this.$scope.feature);
        }

        public editFeature() {
            var rpt = csComp.Helpers.createRightPanelTab("featuretype", "featuretype", this.$layerService.lastSelectedFeature, "Edit group");
            this.$messageBusService.publish("rightpanel", "activate", rpt);
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

        public openLayer(property: FeatureProps.CallOutProperty) {
            if (property.feature != null && property.feature.properties.hasOwnProperty(property.propertyType.label)) {
                var link = property.feature.properties[property.propertyType.label];
                alert(link);
            }
        }

        public createScatter(property: FeatureProps.CallOutProperty) {
            var sc = new csComp.Services.GroupFilter();
            sc.property = property.property;
            sc.property2 = "opp_land";
            sc.id = csComp.Helpers.getGuid();
            sc.filterType = "scatter";
            sc.title = sc.property;
            var l = this.$layerService.findLayer(this.$scope.feature.layerId);
            this.$layerService.setFilter(sc, l.group);
            //alert('scatter ' + property.property);
        }

        /**
         * Callback function
         * @see {http://stackoverflow.com/questions/12756423/is-there-an-alias-for-this-in-typescript}
         * @see {http://stackoverflow.com/questions/20627138/typescript-this-scoping-issue-when-called-in-jquery-callback}
         * @todo {notice the strange syntax using a fat arrow =>, which is to preserve the this reference in a callback!}
         */
        private sidebarMessageReceived = (title: string): void => {
            //console.log("sidebarMessageReceived");
            switch (title) {
                case "toggle":
                    this.$scope.showMenu = !this.$scope.showMenu;
                    break;
                case "show":
                    this.$scope.showMenu = true;
                    break;
                case "hide":
                    this.$scope.showMenu = false;
                    break;
                default:
            }
            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        private featureMessageReceived = (title: string, feature: IFeature): void => {
            //console.log("FPC: featureMessageReceived");

            switch (title) {
                case "onFeatureSelect":
                    this.displayFeature(this.$layerService.lastSelectedFeature);
                    this.$scope.feature = this.$layerService.lastSelectedFeature;
                    break;
                case "onRelationsUpdated":
                    this.setShowSimpleTimeline();
                    this.displayFeature(feature);
                    this.updateHierarchyLinks(feature);
                    this.$scope.feature = feature;
                    this.$scope.autocollapse(true);
                    break;
                case "onFeatureUpdated":
                    this.displayFeature(this.$layerService.lastSelectedFeature);
                    this.$scope.feature = this.$layerService.lastSelectedFeature;
                    break;
                default:
            }
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        private displayFeature(feature: IFeature): void {
            if (!feature) return;
            var featureType = feature.fType;
            this.$scope.featureType = featureType;
            // If we are dealing with a sensor, make sure that the feature's timestamps are valid so we can add it to a chart
            if (typeof feature.sensors !== 'undefined' && typeof feature.timestamps === 'undefined')
                feature.timestamps = this.$layerService.findLayer(feature.layerId).timestamps;

            //var pt = this.$layerService.getPropertyTypes(feature);
            console.log('showing feature');

            this.$scope.callOut = new CallOut(featureType, feature, this.$layerService.propertyTypeData, this.$layerService, this.$mapService);
        }

        private updateHierarchyLinks(feature: IFeature): void {
            if (!feature) return;
            // Add properties defined inside of layers to the project-wide properties.
            this.$layerService.project.groups.forEach((group) => {
                group.layers.forEach((l) => {
                    if (l.type == "hierarchy" && l.enabled) {
                        if ((<any>(l.data)) && (<any>(l.data)).features) {
                            (<any>(l.data)).features[0].fType.propertyTypeData.forEach((pt) => {
                                if (pt.type == "hierarchy") {
                                    if (pt.targetlayer == feature.layerId) {
                                        var featureType = this.$layerService.getFeatureType(feature);
                                        var propertyTypes = csComp.Helpers.getPropertyTypes(feature.fType, this.$layerService.propertyTypeData);
                                        var found = false;
                                        propertyTypes.forEach((p) => {
                                            if (p.label === pt.label) {
                                                found = true;
                                            }
                                        });
                                        if (!found) featureType.propertyTypeData.push(pt);
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
            console.log(property);
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
                var dateString = String.format("{0}-{1:00}-{2:00}", date.getFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
                if (date.getUTCHours() > 0 || date.getUTCMinutes() > 0)
                    dateString += String.format(" {0:00}:{1:00}", date.getUTCHours(), date.getUTCMinutes());
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
            }
            else {
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
            this.$messageBusService.publish("timeline", "setFocus", d);
        }

        setTime(time: { title: string; timestamp: number }) {
            this.focusTime = time.title;
            this.$layerService.project.timeLine.setFocus(new Date(time.timestamp));
            this.$messageBusService.publish("timeline", "focusChange", time.timestamp);
        }

        getFormattedDate(fp, pt: IPropertyType): string {
            if (!fp) return;
            var format: string;
            if (pt && pt.hasOwnProperty('stringFormat')) {
                format = pt.stringFormat;
            } else {
                format = 'DD MMMM YYYY';
            }
            return moment(fp, 'YYYYMMDD').format(format);
        }

        //When a feature has multiple sections, a dropdown list is created with the title defined in the language entry "CHOOSE_DROPDOWN" (e.g. "Choose..." or "Data...")
        private setDropdownTitle() {
            this.$translate("CHOOSE_DROPDOWN").then(translation => {
                if (typeof translation === 'string' && translation.length > 0) {
                    this.defaultDropdownTitle = translation;
                } else {
                    this.defaultDropdownTitle = '...';
                }
            });
        }
    }
}
