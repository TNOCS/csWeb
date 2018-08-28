module RelationAction {

    import IFeature = csComp.Services.IFeature;
    import IPropertyType = csComp.Services.IPropertyType;
    import IActionOption = csComp.Services.IActionOption;

    export interface IRelation {
        [propertyKey: string]: IFeature[];
    }

    /**
     * When a feature is selected, its propertyTypes will be searched for 'relation' propertyTypes. 
     * If present, related features of these propTypes will be looked up and stored in
     * the _gui.relations property of the feature as an IRelation-dictionary.
     */
    export class RelationActionModel extends csComp.Services.BasicActionService {
        public id: string = 'RelationActionModel';

        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);
        }

        selectFeature(feature: IFeature) {
            var props = csComp.Helpers.getPropertyTypes(feature.fType, this.layerService.propertyTypeData);
            if (!feature._gui) feature._gui = <csComp.Services.IGuiObject>{};
            feature._gui['relations'] = <IRelation>{};
            if (!props || !_.isArray(props)) return;
            var results: IFeature[] = [];
            props.forEach((prop: IPropertyType) => {
                if (prop.type !== 'relation') return;
                var useTargetID = (!prop.target) ? true : false;
                var useSubjectID = (!prop.subject) ? true : false;
                // Search for the property when it is defined as subject, otherwise search for id.
                var searchValue = (useSubjectID) ? feature.id : feature.properties[prop.subject];
                if (!_.isArray(searchValue)) {
                    searchValue = [searchValue];
                }
                var searchFeatures = [];
                if (!prop.targetlayers) {
                    searchFeatures = feature.layer.data.features || [];
                } else if (prop.targetlayers.length > 0 && prop.targetlayers[0] === '*') {
                    searchFeatures = this.layerService.project.features;
                } else {
                    prop.targetlayers.forEach((layerID) => {
                        let l = this.layerService.findLayer(layerID);
                        if (l && l.data && l.data.features) {
                            searchFeatures = searchFeatures.concat(l.data.features);
                        }
                    });
                }
                results = searchFeatures.filter((f) => {
                    if (useTargetID) {
                        if (searchValue.indexOf(f.id) >= 0 && f.id !== feature.id) {
                            return true;
                        }
                    } else {
                        if (f.properties && f.properties.hasOwnProperty(prop.target) && searchValue.indexOf(f.properties[prop.target]) >= 0) {
                            if (f.id !== feature.id) { // Do not return self
                                return true;
                            }
                        }
                    }
                    return false;
                });
                feature._gui['relations'][prop.label] = results;
            });
        }

        addLayer(layer: csComp.Services.IProjectLayer) { }
    }
}
