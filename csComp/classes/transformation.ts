module csComp.Services {
    declare var turf;

    export interface ITransformation {
        id: string;
        name: string;
        apply(layer: ProjectLayer, options: Object);
    }

    export interface IAppliedTransformation {
        id: string;
        options: Object;
        enabled: boolean;
    }

    export class BaseTransformation implements ITransformation {
        id: string;
        name: string;
        apply(layer: ProjectLayer, options: Object) { }
    }

    export class CONRECContourTransformation extends BaseTransformation {
        id = "conrec";
        name = "CONREC Contour Transformation";
        apply(layer: ProjectLayer, options: Object) {

        }
    }

    export class VoronoiContourTransformation extends BaseTransformation {
        id = "voronoi";
        name = "Voronoi Contour Transformation";
        apply(layer: ProjectLayer, options: Object) {
            console.log('voronoi transformation called');

            var result = turf.tin(layer.data).features;

            result.forEach((f: IFeature) => {
                f.properties["FeatureTypeId"] = "transform_test_polygon";
                f.layerId = layer.id;
            });
            layer.group.filterResult = layer.group.filterResult.filter((f: IFeature) => f.layer.id !== layer.id);
            layer.group.filterResult = layer.group.filterResult.concat(result);
        }
    }

    export class IsolinesTransformation extends BaseTransformation {
        id = "isolines";
        name = "Isolines Transformation";
        apply(layer: ProjectLayer, options: Object) {
            console.log('isolines transformation called');
            var result = turf.isolines(layer.data, options["propertyName"], options["resolution"], options["breaks"]).features;

            result.forEach((f: IFeature) => {
                f.properties["FeatureTypeId"] = "transform_test_linestring";
                f.layerId = layer.id;
            });
            layer.group.filterResult = layer.group.filterResult.filter((f: IFeature) => f.layer.id !== layer.id);
            layer.group.filterResult = layer.group.filterResult.concat(result);
        }
    }

    export class KrigingInterpolationTransformation extends BaseTransformation {
        id = "Kriging";
        name = "Kriging Interpolation Transformation";
        apply(layer: ProjectLayer, options: Object) {

        }
    }
}
