module csComp.Services {

    /** Class containing references to feature & property types */
    export interface ITypesResource {
        id : string;
        url: string;
        title : string;
        featureTypes: { [id: string]: IFeatureType }
        propertyTypeData: { [id: string]: IPropertyType }
    }

    /** Class containing references to feature & property types */
    export class TypeResource implements ITypesResource {
        id : string;
        url: string;
        title : string;
        featureTypes: { [id: string]: IFeatureType }
        propertyTypeData: { [id: string]: IPropertyType }

        /**
         * Serialize the project to a JSON string.
         */
        public static serialize(resource: TypeResource): string {
            var data = <ITypesResource>{
                featureTypes: {},
                propertyTypeData: {}
            };
            for (var rt in resource.featureTypes) { 
                data.featureTypes[rt] = Project.serializeFeatureType(resource.featureTypes[rt]);
            }
            for (var pt in resource.propertyTypeData) { 
                data.propertyTypeData[pt] = resource.propertyTypeData[pt];
            }

            return JSON.stringify(data);

        }
    }
}
