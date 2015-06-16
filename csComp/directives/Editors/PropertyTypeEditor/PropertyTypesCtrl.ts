module PropertyTypes {

    export interface IPropertyTypesScope extends ng.IScope {
        vm: PropertyTypesCtrl;
        showMenu: boolean;
        showMenuEdit: boolean;
        filterProperty;
        propertyTypes;
        getSections;
        addSection;
        sections;
    }

    export class PropertyTypesCtrl {
        private scope: IPropertyTypesScope;
        public selectedResourceUrl: string;
        public selectedResource: csComp.Services.ITypesResource

        // $inject annotation.
        // It provides $injector with information about dependencies to be in  jected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        public static $inject = [
            '$scope',
            'layerService',
            'messageBusService'
        ];

        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IPropertyTypesScope,
            private $layerService: csComp.Services.LayerService,
            private $messageBusService: csComp.Services.MessageBusService
            ) {
            console.log('prop editor');
            this.$scope.vm = this;
            this.$scope.showMenu = false;
            this.$scope.showMenuEdit = false;


            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }

            this.$messageBusService.subscribe("editmode", this.editModeMessageReceived);
            this.$messageBusService.subscribe("sidebar", this.sidebarMessageReceived);

            /**
             * Get all sections from the available PropertyTypes
             */
            $scope.getSections = () => {
                var propertyTypeData = this.selectedResource.propertyTypeData;
                var newSections = new Array();

                for (var indexData in propertyTypeData) {
                    var add = true;

                    if (propertyTypeData[indexData].section != undefined) {
                        if (newSections.length == 0) {
                            newSections.push(propertyTypeData[indexData].section);
                        }

                        for (var indexNew in newSections) {
                            if (propertyTypeData[indexData].section == newSections[indexNew]) {
                                add = false;
                            }
                        }

                        if (add) {
                            newSections.push(propertyTypeData[indexData].section);
                        }
                    }
                }

                $scope.sections = newSections;
            }

            /**
             * Add a new section to sections array
             */
            $scope.addSection = (name: String) => {
                var sections = $scope.sections;
                var add = true;

                for (var index in sections) {
                    if (name == sections[index]) {
                        add = false;
                    }
                }

                if (add) {
                    $scope.sections.push(name);
                }
            }

            /**
             * Create an array with all the PropertyTypes for a features (or all features if no feature is selected)
             */
            $scope.filterProperty = (selectedData) => {
                var allPropertyTypes = this.selectedResource.propertyTypeData;
                var propertyTypes = new Array();

                if (selectedData == undefined) {
                    // All property types are selected
                    for (var index in allPropertyTypes) {
                        propertyTypes.push(allPropertyTypes[index]);
                    }

                    $scope.propertyTypes = propertyTypes;
                } else {
                    // Property types of a feature is selected
                    var selectedPropertyTypes;

                    if (selectedData.propertyTypeKeys !== undefined) {
                        selectedPropertyTypes = selectedData.propertyTypeKeys.split(';');
                    }

                    for (var indexSelected in selectedPropertyTypes) {
                        for (var indexAll in allPropertyTypes) {
                            if (allPropertyTypes.hasOwnProperty(indexAll)) {
                                if (selectedPropertyTypes[indexSelected] == allPropertyTypes[indexAll].label) {
                                    propertyTypes.push(allPropertyTypes[indexAll]);
                                }
                            }
                        }
                    }

                    $scope.propertyTypes = propertyTypes;
                }
            }

        }

        //** select a typesResource collection from the dropdown */
        public selectResource() {
            if (this.$layerService.typesResources.hasOwnProperty(this.selectedResourceUrl)) {
                this.selectedResource = this.$layerService.typesResources[this.selectedResourceUrl];
            }
        }

        private editModeMessageReceived = (title: string): void => {
            switch (title) {
                case "enable":
                    this.$messageBusService.publish("sidebar", "showEdit");
                    this.$scope.vm = this;
                    this.$scope.propertyTypes = this.$layerService.project.propertyTypeData;
                    break;
                case "disable":
                    this.$messageBusService.publish("sidebar", "hideEdit");
                    break;
                default:
            }
            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
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
                case "showEdit":
                    this.$scope.showMenuEdit = true;
                    break;
                case "hide":
                    this.$scope.showMenu = false;
                    break;
                case "hideEdit":
                    this.$scope.showMenuEdit = false;
                    break;
                default:
            }
            // NOTE EV: You need to call apply only when an event is received outside the angular scope.
            // However, make sure you are not calling this inside an angular apply cycle, as it will generate an error.
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }
    }
}
