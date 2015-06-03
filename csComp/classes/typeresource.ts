module csComp.Services {

  /** Class containing references to feature & property types */
  export interface ITypesResource {
    url: string;
    featureTypes: { [id: string]: IFeatureType }
    propertyTypeData: { [id: string]: IPropertyType }
  }

  /** Class containing references to feature & property types */
  export class TypeResource implements ITypesResource {
    url: string;
    featureTypes: { [id: string]: IFeatureType }
    propertyTypeData: { [id: string]: IPropertyType }
  }
}
