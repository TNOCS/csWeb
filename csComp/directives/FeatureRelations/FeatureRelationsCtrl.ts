module FeatureRelations {   
    import IFeature          = csComp.Services.IFeature;
    import IFeatureType      = csComp.Services.IFeatureType;
    import IPropertyType     = csComp.Services.IPropertyType;
    import IPropertyTypeData = csComp.Services.IPropertyTypeData;

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

    export interface IFeatureRelationsScope extends ng.IScope {
        vm                              : FeatureRelationsCtrl;
        showMenu                        : boolean;
        poi                             : IFeature;        
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

        public selectRelation(relation: Relation) {
            this.$layerService.selectFeature(relation.target);
            this.$mapService.zoomTo(relation.target);
        }


        public initRelations() {
            this.relations = [];
            var f = this.$layerService.lastSelectedFeature;
            if (f.fType == null) return;


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
                            if (f.properties.hasOwnProperty(pt.subject) && feature.properties.hasOwnProperty(pt.target) && feature.properties[pt.target] == f.properties[pt.subject]) {
                                var rel = new Relation();
                                rel.subject = f;
                                rel.target = feature;

                                rel.title = FeatureProps.CallOut.title(feature.fType, feature);
                                rel.icon = (feature.fType == null || feature.fType.style == null || !feature.fType.style.hasOwnProperty('iconUri') || feature.fType.style.iconUri.toLowerCase().indexOf('_media') >= 0) ? '' : feature.fType.style.iconUri;
                                rg.relations.push(rel);
                            }
                        });
                    }
                    if (rg.relations.length > 0) this.relations.push(rg);
                }
            }
        }


        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            private $scope             : IFeatureRelationsScope,
            private $location          : ng.ILocationService,
            private $sce               : ng.ISCEService,              
            private $mapService        : csComp.Services.MapService,
            private $layerService      : csComp.Services.LayerService,
            private $messageBusService : csComp.Services.MessageBusService
            ) {
            this.scope = $scope;
            $scope.vm = this;
            $scope.showMenu = false;
            
            $messageBusService.subscribe("feature", this.featureMessageReceived);


            var widthOfList = function () {
                var itemsWidth = 0;
                $('#featureTabs>li').each(function () {
                    var itemWidth = $(this).outerWidth();

                    itemsWidth += itemWidth;                               
                });
                return itemsWidth;
            }

            
        }

     

     

        private featureMessageReceived = (title: string, feature: IFeature): void => {
            //console.log("FPC: featureMessageReceived");
            switch (title) {
                case "onFeatureSelect":                    
                    this.initRelations();
                    break;                
               default:
            }
            if (this.$scope.$root.$$phase != '$apply' && this.$scope.$root.$$phase != '$digest') {
                this.$scope.$apply();
            }
        }

     
    }
}