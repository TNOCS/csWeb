interface IGeoJsonFeature {
    type: string;
    geometry: csComp.Services.IGeoJsonGeometry;
    properties: csComp.Services.IProperty    
}
export = IGeoJsonFeature;
