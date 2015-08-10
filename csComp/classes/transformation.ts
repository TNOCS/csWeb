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

        // merge the result with the layer
        merge(layer: ProjectLayer, result: IFeature[]) {
            layer.group.filterResult = layer.group.filterResult.filter((f: IFeature) => f.layer.id !== layer.id);
            layer.group.filterResult = layer.group.filterResult.concat(result);
        }
    }

    export class CONRECContourTransformation extends BaseTransformation {
        id = "conrec";
        name = "CONREC Contour Transformation";
        apply(layer: ProjectLayer, options: Object) {
            var result = [];

            //todo: transformation

            this.merge(layer, result);
        }
    }

    export class VoronoiContourTransformation extends BaseTransformation {
        id = "voronoi";
        name = "Voronoi Contour Transformation";
        apply(layer: ProjectLayer, options: Object) {
            console.log('voronoi transformation called');
            var result = turf.tin(layer.group.filterResult).features;

            result.forEach((f: IFeature) => {
                f.properties["FeatureTypeId"] = "transform_test_polygon";
                f.properties["Name"] = "Voronoi Triangle";
                f.layerId = layer.id;
            });

            this.merge(layer, result);
        }
    }
    export class PolygonToPointTransformation extends BaseTransformation {
        id = "polygontopoint";
        name = "Polygon to point transformation";

        apply(layer: ProjectLayer, options: Object) {
            console.log('polygontopoint transformation called');
            var result = [];

            layer.group.filterResult.forEach((f: IFeature) => {
                var centroid = turf.centroid(f);

                f.geometry = centroid.geometry;

                result.push(f);
            });

            this.merge(layer, result);
        }
    }

    export class IsolinesTransformation extends BaseTransformation {
        id = "isolines";
        name = "Isolines Transformation";
        apply(layer: ProjectLayer, options: Object) {
            console.log('isolines transformation called');

            var data : Object = new Object();
            data["features"] = layer.group.filterResult;
            data["type"]= "FeatureCollection";
            var breaks = options["breaks"];
            if (breaks === undefined)
                breaks = turf.jenks(data, options["propertyName"], 15);

            var result = turf.isolines(data, options["propertyName"], options["resolution"], breaks).features;

            result.forEach((f: IFeature) => {
                f.properties["FeatureTypeId"] = "transform_test_linestring";
                f.geometry.coordinates.forEach(c => {
                    c[2] = layer.data.features[0].geometry.coordinates[2];
                });
                f.layerId = layer.id;
            });

            this.merge(layer, result);
        }
    }

    export class KrigingInterpolationTransformation extends BaseTransformation {
        id = "Kriging";
        name = "Kriging Interpolation Transformation";
        apply(layer: ProjectLayer, options: Object) {
            var result = [];

            //todo: transformation

            this.merge(layer, result);
        }
    }
}
