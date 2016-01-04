module MatrixAction {

    import IFeature = csComp.Services.IFeature;
    import IActionOption = csComp.Services.IActionOption;

    export class MatrixActionModel extends csComp.Services.BasicActionService {
        public id: string = 'MatrixActionModel';


        public init(layerService: csComp.Services.LayerService) {
            super.init(layerService);

        }

        selectFeature(feature: IFeature) {

            var props = csComp.Helpers.getPropertyTypes(feature.fType, this.layerService.propertyTypeData);
            props.forEach((prop: IPropertyType) => {
                if (prop.type === 'matrix' && feature.properties.hasOwnProperty(prop.label)) {
                    var matrix = feature.properties[prop.label];
                    this.layerService.project.features.forEach(f => {
                        if (f.layer === feature.layer && f.properties.hasOwnProperty(prop.targetid) && matrix.hasOwnProperty(f.properties[prop.targetid])) {
                            var newValue = matrix[f.properties[prop.targetid]];
                            for (var val in newValue) {
                                f.properties[val] = newValue[val];
                            }
                        }
                    });
                    this.layerService.updateGroupFeatures(feature.layer.group);
                }

            });
        }



        addLayer(layer: csComp.Services.IProjectLayer) {
            layer.data.features.forEach((feature: IFeature) => {
                var props = csComp.Helpers.getPropertyTypes(feature.fType, this.layerService.propertyTypeData);
                props.forEach((prop: IPropertyType) => {
                    if (prop.type === 'matrix' && feature.properties.hasOwnProperty(prop.label)) {
                        var m = feature.properties[prop.label];
                        for (var f in m)
                        {
                            var kb = m[f];
                            if (kb.hasOwnProperty('b') && kb.b > 0  && kb.hasOwnProperty('h') && kb.h > 0)
                            {
                                var tf = this.layerService.findFeatureByPropertyValue(prop.targetid,f);
                                var lh = prop.label + "_h";
                                var lb = prop.label + "_b";
                                if (!tf.properties.hasOwnProperty(lh)) tf.properties[lh] = 0;
                                if (!tf.properties.hasOwnProperty(lb)) tf.properties[lb] = 0;
                                tf.properties[lh] += kb.h;
                                tf.properties[lb] += kb.b;
                                                                
                                console.log(tf);
                            }
                        }                      
                    }
                });

            });            
            //alert('add layer');
        }


    }
}
