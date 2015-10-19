module FeatureRelations {
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

    export interface IFeatureRelationsScope extends ng.IScope {
        vm: FeatureRelationsCtrl;
        showMenu: boolean;
        poi: IFeature;
        title: string;
        icon: string;
    }

    export interface IHierarchySettings {
        referenceList: string[];
    }

    export class RelationGroup {
        title: string;
        id: string;
        property: csComp.Services.IPropertyType;
        relations: Relation[] = [];

    }

    export class Relation {
        title: string;
        icon: string;
        subject: csComp.Services.IFeature;
        target: csComp.Services.IFeature;
    }


    export class FeatureRelationsCtrl {
        private scope: IFeatureRelationsScope;
        relations: RelationGroup[] = [];
        showRelations: boolean;
        title: string;

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

        public selectRelation(relation: Relation) {
            this.$layerService.selectFeature(relation.target);
            this.$mapService.zoomTo(relation.target);
        }

        // Create a relation to the nearest 10 features that are within the extent
        private createNearbyRelation(f): RelationGroup {
            var rgr = new RelationGroup();
            var mapZoom = this.$layerService.activeMapRenderer.getZoom();
            if (mapZoom < 11) return rgr; //Disable when zoom level is too low

            this.$translate('NEARBY_FEATURES').then((translation) => {
                rgr.title = translation;
            });
            rgr.id = csComp.Helpers.getGuid();
            rgr.relations = [];
            var mapBounds = this.$mapService.map.getBounds();
            var tooManyFeatures = false;
            this.$layerService.project.features.every((feature: csComp.Services.IFeature) => {
                if (feature.id != f.id) {
                    if ((feature.geometry.type == 'Point' && mapBounds.contains(new L.LatLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0])))
                        || (feature.geometry.type == 'Polygon' && mapBounds.contains(new L.LatLng(feature.geometry.coordinates[0][0][1], feature.geometry.coordinates[0][0][0])))) { //TODO: Get center point of polygon, instead of its first point.
                        var rl = new Relation();
                        rl.subject = f;
                        rl.target = feature;

                        rl.title = csComp.Helpers.featureTitle(feature.fType, feature);
                        rl.icon = (feature.fType == null || feature.fType.style == null || !feature.fType.style.hasOwnProperty('iconUri') || feature.fType.style.iconUri.toLowerCase().indexOf('_media') >= 0) ? '' : csComp.Helpers.convertStringFormat(feature, feature.fType.style.iconUri);
                        rgr.relations.push(rl);
                    }
                }
                if (rgr.relations.length > 40) {
                    tooManyFeatures = true;
                    return false; // break out of the some-loop when too many features are nearby
                } else {
                    return true;
                }
            });

            if (tooManyFeatures) {
                rgr.relations.length = 0;
                return rgr;
            }

            var fLoc: L.LatLng;
            if (f.geometry.type == 'Point') {
                fLoc = new L.LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]);
            } else if (f.geometry.type == 'Polygon') {
                fLoc = new L.LatLng(f.geometry.coordinates[0][0][1], f.geometry.coordinates[0][0][0]); //TODO: Get center point of polygon, instead of its first point.
            }
            if (fLoc) {
                rgr.relations.sort((rl1: Relation, rl2: Relation) => {
                    var loc1: L.LatLng;
                    var loc2: L.LatLng;
                    if (rl1.target.geometry.type == 'Point') loc1 = new L.LatLng(rl1.target.geometry.coordinates[1], rl1.target.geometry.coordinates[0]);
                    if (rl1.target.geometry.type == 'Polygon') loc1 = new L.LatLng(rl1.target.geometry.coordinates[0][0][1], rl1.target.geometry.coordinates[0][0][0]);
                    if (rl2.target.geometry.type == 'Point') loc2 = new L.LatLng(rl2.target.geometry.coordinates[1], rl2.target.geometry.coordinates[0]);
                    if (rl2.target.geometry.type == 'Polygon') loc2 = new L.LatLng(rl2.target.geometry.coordinates[0][0][1], rl2.target.geometry.coordinates[0][0][0]);
                    if (loc1 && loc2) {
                        return (fLoc.distanceTo(loc1) - fLoc.distanceTo(loc2));
                    } else {
                        return;
                    }
                });
            }
            if (rgr.relations.length > 10) {
                rgr.relations.splice(10);
            }
            return rgr;
        }

        public initRelations() {
            this.relations = [];
            var f = this.$layerService.lastSelectedFeature;
            if (f.fType == null) return;
            this.$scope.title = csComp.Helpers.featureTitle(f.fType, f);
            if (f.fType == null || f.fType.style == null || !f.fType.style.hasOwnProperty('iconUri') || f.fType.style.iconUri.toLowerCase().indexOf('_media') >= 0) {
                this.$scope.icon = '';
            } else {
                this.$scope.icon = csComp.Helpers.convertStringFormat(f, f.fType.style.iconUri);
            }

            var propertyTypes = csComp.Helpers.getPropertyTypes(f.fType, this.$layerService.propertyTypeData);
            for (var p in propertyTypes) {
                var pt = propertyTypes[p];
                if (pt.type == "relation") {
                    var rg = new RelationGroup();
                    rg.title = pt.title;
                    rg.id = csComp.Helpers.getGuid();
                    rg.relations = [];
                    if (pt.target) {
                        this.$layerService.project.features.forEach((feature: csComp.Services.IFeature) => {
                            if (f.properties.hasOwnProperty(pt.subject) && feature.properties.hasOwnProperty(pt.target)
                                && feature.properties[pt.target] == f.properties[pt.subject] && f.id !== feature.id) {
                                var rel = new Relation();
                                rel.subject = f;
                                rel.target = feature;

                                rel.title = csComp.Helpers.featureTitle(feature.fType, feature);
                                rel.icon = (feature.fType == null || feature.fType.style == null || !feature.fType.style.hasOwnProperty('iconUri') || feature.fType.style.iconUri.toLowerCase().indexOf('_media') >= 0) ? '' : feature.fType.style.iconUri;
                                rg.relations.push(rel);
                            }
                        });
                        if (rg.relations.length > 0) {
                            pt.count = 0;
                            rg.relations.forEach((rl) => {
                                if (rl.target.fType.name === f.fType.name) pt.count += 1;
                            });
                            //if (!this.$layerService.featureTypes[f.featureTypeName].propertyTypeData[pt.label]) {
                            //    this.$layerService.featureTypes[f.featureTypeName].propertyTypeData.push(pt);
                            //}
                        }
                    }
                    if (rg.relations.length > 0) this.relations.push(rg);
                }
            }
            var nearbyRelGroup = this.createNearbyRelation(f);
            if (nearbyRelGroup.relations.length > 0) this.relations.push(nearbyRelGroup);

            this.showRelations = this.relations.length > 0;

            if (this.showRelations) { $("#linkedData").show(); } else { $("#linkedData").hide(); }

        }

        public getRelations(): RelationGroup[] {
            return this.relations;
        }


        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope: IFeatureRelationsScope,
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

            //$messageBusService.subscribe("sidebar", this.sidebarMessageReceived);
            //$messageBusService.subscribe("feature", this.featureMessageReceived);
            this.initRelations();
        }


        /**
                 * Callback function
                 * @see {http://stackoverflow.com/questions/12756423/is-there-an-alias-for-this-in-typescript}
                 * @see {http://stackoverflow.com/questions/20627138/typescript-this-scoping-issue-when-called-in-jquery-callback}
                 * @todo {notice the strange syntax using a fat arrow =>, which is to preserve the this reference in a callback!}
                 */
        private sidebarMessageReceived = (title: string): void => {
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
                    this.initRelations();
                    this.$messageBusService.publish('feature', 'onRelationsUpdated', feature);
                    break;
                default:
            }
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }


    }
}
