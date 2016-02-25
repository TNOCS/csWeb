module csComp.Services {

    /** Class containing references to feature & property types */
    export interface ITypesResource {
        id : string;
        url: string;
        title : string;
        featureTypes: { [id: string]: IFeatureType }
        propertyTypeData: { [id: string]: IPropertyType }
        legends : { [id : string] : Legend}
        
    }

    /** Class containing references to feature & property types */
    export class TypeResource implements ITypesResource {
        id : string;
        url: string;
        title : string;
        featureTypes: { [id: string]: IFeatureType }
        propertyTypeData: { [id: string]: IPropertyType }
        legends : { [id : string] : Legend}

        /**
         * Serialize the project to a JSON string.
         */
        public static serialize(resource: TypeResource): string {
            var data = <ITypesResource>{
                featureTypes: {},
                propertyTypeData: {},
                legends : {}
            };
            for (var rt in resource.featureTypes) { 
                data.featureTypes[rt] = Project.serializeFeatureType(resource.featureTypes[rt]);
            }
            for (var pt in resource.propertyTypeData) { 
                data.propertyTypeData[pt] = resource.propertyTypeData[pt];
            }
            
            for (var l in resource.legends) { 
                data.legends[l] = resource.legends[pt];
            }

            return JSON.stringify(data);

        }
    }
}
