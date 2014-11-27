module FeatureProps {   
    import IFeature = csComp.Services.IFeature;
    import IFeatureType = csComp.Services.IFeatureType;
    import IPropertyType = csComp.Services.IPropertyType;

    class FeaturePropsOptions implements L.SidebarOptions {
        public position   : string;
        public closeButton: boolean;
        public autoPan    : boolean;

        constructor(position: string) {
            this.position    = position;
            this.closeButton = true;
            this.autoPan     = true;            
        }
    }

    export interface IFeaturePropsScope extends ng.IScope {
        vm                              : FeaturePropsCtrl;
        showMenu                        : boolean;
        poi                             : IFeature;
        callOut                         : CallOut;
        tabs                            : JQuery;
        tabScrollDelta                  : number;
        featureTabActivated(sectionTitle: string, section: CallOutSection);
        autocollapse(init               : boolean):void;
    }

    export interface ICallOutProperty {
        key         : string;
        value       : string;
        property    : string;
        canFilter   : boolean;
        canStyle    : boolean;
        feature     : IFeature;
        description?: string;
        meta?: IPropertyType;
        isFilter    : boolean;
    }

    export class CallOutProperty implements ICallOutProperty {
        constructor(public key: string, public value: string, public property: string, public canFilter: boolean, public canStyle: boolean, public feature: IFeature, public isFilter: boolean, public description?: string, public meta?: IPropertyType ) {}
    }

    export interface ICallOutSection {
        propertyTypes: { [label: string]: IPropertyType }; // Probably not needed
        properties     : Array<ICallOutProperty>;
        sectionIcon    : string;
        addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, feature: IFeature, isFilter: boolean, description?: string, meta?: IPropertyType) : void;
        hasProperties(): boolean;
    }

    export class CallOutSection implements ICallOutSection {
        public propertyTypes: { [label: string]: IPropertyType };
        public properties : Array<ICallOutProperty>;
        public sectionIcon: string;

        constructor(sectionIcon?: string) {
            this.propertyTypes   = {};
            this.properties  = [];
            this.sectionIcon = sectionIcon;
        }

        public showSectionIcon(): boolean { return !csComp.StringExt.isNullOrEmpty(this.sectionIcon); }

        public addProperty(key: string, value: string, property: string, canFilter: boolean, canStyle: boolean, feature: IFeature, isFilter: boolean, description?: string, meta?: IPropertyType ): void {            
            if (description)
                this.properties.push(new CallOutProperty(key, value, property, canFilter, canStyle, feature, isFilter,description,meta));
            else
                this.properties.push(new CallOutProperty(key, value, property, canFilter, canStyle, feature,isFilter,null,meta));
        }

        public hasProperties(): boolean {
            return this.properties != null && this.properties.length > 0;
        }
    }

    declare var String;

    export class CallOut {
        public title   : string;
        public icon    : string;
        public sections: { [title: string]: ICallOutSection; };

        constructor(private type: IFeatureType, private feature: IFeature, private propertyTypeData: { [key: string]: IPropertyType} ) {
            this.sections = {};
            //if (type == null) this.createDefaultType();
            this.setTitle();
            this.setIcon();

            var infoCallOutSection   = new CallOutSection('fa-info');
            var searchCallOutSection = new CallOutSection('fa-filter');
            var displayValue: string;
            if (type != null) {
                var propertyTypes: Array<IPropertyType> = [];
                if (type.propertyTypeKeys != null) {
                    var keys = type.propertyTypeKeys.split(';');
                    keys.forEach((key) => {
                        if (key in propertyTypeData) propertyTypes.push(propertyTypeData[key]);
                        else if (type.propertyTypeData != null) {
                            var result = $.grep(type.propertyTypeData, e => e.label === key);
                            if (result.length >= 1) propertyTypes.push(result);
                        }
                    });
                } else if (type.propertyTypeData != null) {
                    propertyTypes = type.propertyTypeData;
                }
                propertyTypes.forEach((mi: IPropertyType) => {
                    var callOutSection = this.getOrCreateCallOutSection(mi.section) || infoCallOutSection;
                    callOutSection.propertyTypes[mi.label] = mi;
                    var text = feature.properties[mi.label];
                    displayValue = csComp.Helpers.convertPropertyInfo(mi, text);
                    // Skip empty, non-editable values
                    if (!mi.canEdit && csComp.StringExt.isNullOrEmpty(displayValue)) return;

                    var canFilter = (mi.type == "number" || mi.type == "text");
                    var canStyle = (mi.type == "number" || mi.type=="color");
                    if (mi.filterType != null) canFilter = mi.filterType.toLowerCase() != "none";
                    if (mi.visibleInCallOut)
                        callOutSection.addProperty(mi.title, displayValue, mi.label, canFilter, canStyle, feature, false, mi.description, mi);
                    searchCallOutSection.addProperty(mi.title, displayValue, mi.label, canFilter, canStyle, feature, false, mi.description);
                });
            }
            if (infoCallOutSection  .properties.length > 0) this.sections['AAA Info']   = infoCallOutSection; // The AAA is added as the sections are sorted alphabetically
            if (searchCallOutSection.properties.length > 0) this.sections['Zzz Search'] = searchCallOutSection;
        }

        ///** 
        //* Convert a property value to a display value using the property info.
        //*/
        //public static convertPropertyInfo(mi: IMetaInfo, text: string): string {
        //    var displayValue: string;
        //    if (!csComp.StringExt.isNullOrEmpty(text) && !$.isNumeric(text))
        //        text = text.replace(/&amp;/g, '&');
        //    if (csComp.StringExt.isNullOrEmpty(text)) return '';
        //    switch (mi.type) {
        //        case "bbcode":
        //            if (!csComp.StringExt.isNullOrEmpty(mi.stringFormat))
        //                text = String.format(mi.stringFormat, text);
        //            displayValue = XBBCODE.process({ text: text }).html;
        //            break;
        //        case "number":
        //            if (!$.isNumeric(text))
        //                displayValue = text;
        //            else if (csComp.StringExt.isNullOrEmpty(mi.stringFormat))
        //                displayValue = text.toString();
        //            else
        //                displayValue = String.format(mi.stringFormat, parseFloat(text));
        //            break;
        //        case "rank":
        //            var rank = text.split(',');
        //            if (rank.length != 2) return text;
        //            if (mi.stringFormat)
        //                displayValue = String.format(mi.stringFormat, rank[0], rank[1]);
        //            else 
        //                displayValue = String.format("{0) / {1}", rank[0], rank[1]);
        //            break;
        //        default:
        //            displayValue = text;
        //            break;
        //    }
        //    return displayValue;
        //}

        ///**                                         
        // * In case we are dealing with a regular JSON file without type information, create a default type.
        // */
        //private createDefaultType(): void {
        //    this.type              = [];
        //    this.type.style        = { nameLabel: "Name", iconHeight: 30, iconWidth: 30 };
        //    this.type.propertyTypeData = [];

        //    for (var kvp in this.feature.properties) {
        //        var propertyType: IpropertyType = [];
        //        propertyType.label          = kvp.key;
        //        propertyType.title          = kvp.key.replace("_", " ");
        //        propertyType.isSearchable   = true;
        //        propertyType.type           = propertyTypeType.Text;
        //        this.type.propertyTypeData.push(propertyType);
        //    }
        //}

        public sectionCount(): number {
            return Object.keys(this.sections).length;
        }

        public firstSection(): ICallOutSection {
            return this.sections[Object.keys(this.sections)[this.sectionCount() - 2]];
        }

        public lastSection(): ICallOutSection {
            return this.sections[Object.keys(this.sections)[this.sectionCount()-1]];
        }

        private getOrCreateCallOutSection(sectionTitle: string): ICallOutSection {
            if (!sectionTitle) {
                return null;
            }
            if (sectionTitle in this.sections)
                return this.sections[sectionTitle];
            this.sections[sectionTitle] = new CallOutSection();
            return this.sections[sectionTitle];
        }

        /**
         * Set the title of the callout to the title of the feature.
         */
        private setTitle() {
            this.title = CallOut.title(this.type, this.feature);
        }

        private setIcon() {
            this.icon = (this.type == null || this.type.style == null || !this.type.style.hasOwnProperty('iconUri') || this.type.style.iconUri.toLowerCase().indexOf('_media') >= 0) 
                ? ''
                : this.type.style.iconUri;
        }

        public static title(type: IFeatureType, feature: IFeature): string {
            var title = '';
            if (type != null && type.style != null && type.style.nameLabel)
                title = feature.properties[type.style.nameLabel];
            else {
                if (feature.properties.hasOwnProperty('Name')) title = feature.properties['Name'];
                else if (feature.properties.hasOwnProperty('name')) title = feature.properties['name'];
            }
            if (!csComp.StringExt.isNullOrEmpty(title) && !$.isNumeric(title))
                title = title.replace(/&amp;/g, '&');
            return title;
        }
    }

    export class FeaturePropsCtrl {
        private scope: IFeaturePropsScope;

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
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope             : IFeaturePropsScope,
            private $location          : ng.ILocationService,
            private $sce               : ng.ISCEService,              
            private $mapService        : csComp.Services.MapService,
            private $layerService      : csComp.Services.LayerService,
            private $messageBusService : csComp.Services.MessageBusService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            $scope.showMenu = false;
            
            $scope.featureTabActivated = function (sectionTitle: string, section: CallOutSection) {
                $messageBusService.publish('FeatureTab', 'activated', { sectionTitle: sectionTitle, section: section });
            };
            
            $messageBusService.subscribe("sidebar", this.sidebarMessageReceived);
            $messageBusService.subscribe("feature", this.featureMessageReceived);


            var widthOfList = function () {
                var itemsWidth = 0;
                $('#featureTabs>li').each(function () {
                    var itemWidth = $(this).outerWidth();

                    itemsWidth += itemWidth;
                });
                return itemsWidth;
            }

            $scope.autocollapse = function (initializeTabPosition = false) {
                //                console.log('autocollapse');
                var tabs = $('#featureTabs');

                //                console.log('#ft.ow(): ' + tabs.outerWidth());
                //                console.log('wol: ' + widthOfList());
                //                console.log('ml: ' + tabs.css('margin-left'));

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

            $('#leftArr').click(function () {
                //console.log('leftArr');
                //var tabs = $('#featureTabs');
                var current = parseFloat($scope.tabs.css('margin-left'));
                var min = 20;
                var nextPos = $scope.tabScrollDelta;

                if (current + nextPos > min) {
                    nextPos = min - current;
                }

                $scope.tabs.animate({ 'margin-left': '+=' + nextPos + 'px' }, 'slow', function () {
                    //                    console.log('rightarr hide');
                    $('#rightArr').show();
                    $('#leftArr').show();
                    $scope.autocollapse(false);
                });
            });

            $('#rightArr').click(function () {
                //var tabs = $('#featureTabs');
                var max = widthOfList() - $scope.tabs.outerWidth() + 30;
                //var current = Math.abs(parseFloat($scope.tabs.css('margin-left')));
                var nextPos = $scope.tabScrollDelta;
                nextPos = Math.min(max, nextPos);

                $scope.tabs.animate({ 'margin-left': '-=' + nextPos + 'px' }, 'slow', function () {
                    $('#leftArr').show();
                    $('#rightArr').show();

                    $scope.autocollapse(false);
                });
            });
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
                    this.displayFeature(feature);
                    this.$scope.poi = feature;
                    this.$scope.autocollapse(true);
                    break;
                case "onFeatureUpdated":
                    this.displayFeature(this.$layerService.lastSelectedFeature);                    
                    this.$scope.poi = this.$layerService.lastSelectedFeature;
                break;
               default:
            }
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

        private displayFeature(feature: IFeature): void {
            if (!feature) return;
            var featureType     = this.$layerService.featureTypes[feature.featureTypeName];
            this.$scope.callOut = new CallOut(featureType, feature, this.$layerService.propertyTypeData);
            // Probably not needed
            //if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
            //    this.$scope.$apply();
            //}
        }
    }
}