export interface IEvent {
    id: string;
    title: string;
    color: string;
    start: number;
}
export declare class Event implements IEvent {
    id: string;
    title: string;
    color: string;
    start: number;
    startDate: () => Date;
}
export interface IFeature {
    id?: string;
    layerId: string;
    type?: string;
    geometry: IGeoJsonGeometry;
    properties?: IStringToAny;
    isSelected?: boolean;
    htmlStyle?: string;
    featureTypeName?: string;
    fType?: IFeatureType;
    isInitialized?: boolean;
    sensors?: {
        [id: string]: any[];
    };
    timestamps: number[];
    coordinates?: IGeoJsonGeometry[];
    languages?: {
        [key: string]: ILocalisedData;
    };
}
export declare class Feature implements IFeature {
    id: string;
    layerId: string;
    type: string;
    geometry: IGeoJsonGeometry;
    properties: IStringToAny;
    isSelected: boolean;
    htmlStyle: string;
    featureTypeName: string;
    fType: IFeatureType;
    isInitialized: boolean;
    sensors: {
        [id: string]: any[];
    };
    timestamps: number[];
    coordinates: IGeoJsonGeometry[];
}
export interface IStringToAny {
    [key: string]: any;
}
export interface IGeoJsonGeometry {
    type: string;
    coordinates: any;
}
export declare enum DrawingModeType {
    None = 0,
    Image = 1,
    Point = 2,
    Square = 3,
    Rectangle = 4,
    Line = 5,
    Circle = 6,
    Freehand = 7,
    Polyline = 8,
    Polygon = 9,
    MultiPolygon = 10,
}
export declare enum featureFilterType {
    none = 0,
    bar = 1,
    text = 2,
}
export interface ILocalisedData {
    name?: string;
    title?: string;
    description?: string;
    section?: string;
    options?: string[];
}
export interface ILanguageData {
    [key: string]: ILocalisedData;
}
export interface IPropertyType {
    label?: string;
    title?: string;
    description?: string;
    type?: string;
    section?: string;
    stringFormat?: string;
    visibleInCallOut?: boolean;
    canEdit?: boolean;
    filterType?: string;
    isSearchable?: boolean;
    minValue?: number;
    maxValue?: number;
    defaultValue?: number;
    subject?: string;
    target?: string;
    options?: string[];
    languages?: ILanguageData;
}
export interface IPropertyTypeData {
    [key: string]: IPropertyType;
}
export interface IFeatureTypeStyle {
    nameLabel?: string;
    fillColor?: string;
    strokeColor?: string;
    drawingMode?: string;
    strokeWidth?: number;
    iconWidth?: number;
    iconHeight?: number;
    iconUri?: string;
    maxTitleResolution?: string;
    analysispropertyType?: any;
}
export interface IFeatureType {
    name?: string;
    style?: IFeatureTypeStyle;
    propertyTypeData?: IPropertyType[];
    propertyTypeKeys?: string;
    languages?: ILanguageData;
}
export interface IGeoJsonFile {
    featureTypes?: {
        [key: string]: IFeatureType;
    };
    type: string;
    features: Array<IFeature>;
}
export declare class PropertyInfo {
    max: number;
    min: number;
    count: number;
    mean: number;
    varience: number;
    sd: number;
    sdMax: number;
    sdMin: number;
}
export interface IFeatureTypeResourceFile {
    featureTypes?: {
        [featureTypeId: string]: IFeatureType;
    };
    propertyTypeData?: IPropertyTypeData;
}
