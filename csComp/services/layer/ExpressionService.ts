module csComp.Services {
    export class ExpressionService {
        /**
         * A common set of operations for parsing Angular expressions, such as:
         * count, sum, average and standard deviation.
         *
         * Since Angular's $parse does not allow you to define a function or for loop, we use a hack to supply these
         * functions through an object.
         * See also http://glebbahmutov.com/blog/angularjs-parse-hacks/
         */
        private ops = {
            /** Add a reference to the standard math library */
            Math: Math,
            /** Count the number of valid entries */
            count: (features: Array<IFeature>, prop: string) => {
                var count = 0;
                for (var f of features) {
                    if (!f.properties.hasOwnProperty(prop)) continue;
                    count++;
                }
                return count;
            },
            /** Compute the minimum among all the valid entries */
            min: (features: Array<IFeature>, prop: string) => {
                var min = Number.MAX_VALUE;
                for (var f of features) {
                    if (!f.properties.hasOwnProperty(prop)) continue;
                    min = Math.min(min, f.properties[prop]);
                }
                return min;
            },
            /** Compute the maximum among all the valid entries */
            max: (features: Array<IFeature>, prop: string) => {
                var max = Number.MIN_VALUE;
                for (var f of features) {
                    if (!f.properties.hasOwnProperty(prop)) continue;
                    max = Math.max(max, f.properties[prop]);
                }
                return max;
            },
            /** Count the valid entries */
            sum: (features: Array<IFeature>, prop: string) => {
                var sum = 0;
                for (var f of features) {
                    if (!f.properties.hasOwnProperty(prop)) continue;
                    sum += f.properties[prop];
                }
                return sum;
            },
            /** Compute the average over the valid entries */
            avg: (features: Array<IFeature>, prop: string) => {
                var sum = 0,
                    count = 0;
                for (var f of features) {
                    if (!f.properties.hasOwnProperty(prop)) continue;
                    sum += f.properties[prop];
                    count++;
                }
                return sum / count;
            },
            /** Compute the standard deviation of the valid entries */
            std: (features: Array<IFeature>, prop: string) => {
                // Average function
                var average = (data: number[]) => {
                    var sum = data.reduce(function(sum, value) {
                        return sum + value;
                    }, 0);
                    return sum / data.length;
                };
                // Extract all data
                var data: number[] = [];
                for (var f of features) {
                    if (!f.properties.hasOwnProperty(prop)) continue;
                    data.push(f.properties[prop]);
                }

                var avg = average(data);

                // Compute squared differences between value and average
                var squareDiffs = data.map(function(value) {
                    return Math.pow(value - avg, 2);
                });

                var avgSquareDiff = average(squareDiffs);
                return Math.sqrt(avgSquareDiff);
            },
            /** Calculate percentage of a with respect to b, i.e. a/b * 100% */
            percentage: (features: Array<IFeature>, a: string, b: string) => {
                let sum_a = this.ops.sum(features, a);
                let sum_b = this.ops.sum(features, b);
                return sum_a / sum_b;
            }
        };

        static $inject = [
            '$parse'
        ];

        constructor(
            private $parse: ng.IParseService,
            private messageBusService: Services.MessageBusService
        ) {
        }

        /**
         * Evaluate the layer by evaluating any expressions.
         * @param  {ProjectLayer} layer
         */
        evalLayer(layer: ProjectLayer, featureTypes: { [key: string]: IFeatureType}) {
            if (!layer || !layer.data || !layer.data.features) return;
            var defaultFeatureType = layer.typeUrl + '#' + layer.defaultFeatureType;
            if (defaultFeatureType && featureTypes.hasOwnProperty(defaultFeatureType)) {
                let ft = featureTypes[defaultFeatureType];
                ft._propertyTypeData.forEach(pt => this.evalExpressions(pt, layer.data.features));
            }
            layer.data.features.forEach((f: IFeature) => {
                if (!f.properties.hasOwnProperty('featureTypeId')) return;
                let ftId = layer.url + f.properties['featureTypeId'];
                if (!featureTypes.hasOwnProperty(ftId)) return;
                let ft = featureTypes[ftId];
                this.evalExpressions(ft, layer.data.features, false);
            });
        }

        /**
         * Check whether the features contain an expressions, and if so, evaluate them.
         * @param  {ng.IParseService} $parse
         * @param  {csComp.Services.TypeResource} resource
         * @param  {IFeature[]} features
         */
        evalResourceExpressions(resource: csComp.Services.TypeResource, features: IFeature[]) {
            if (!resource || !resource.propertyTypeData) return;
            for (let k in resource.propertyTypeData) {
                let propType = resource.propertyTypeData[k];
                this.evalExpressions(propType, features);
            }
        }

        /**
         * Check whether the property type has an expression, and if so, evaluate it.
         * @param  {IPropertyType} propertyType
         * @param  {IFeature[]} features
         * @param  {boolean} isDefaultPropertyType: default true, indicating that the expression should be applied to all features that haven't explicitly specified their featureTypeId.
         */
        evalExpressions(propertyType: IPropertyType, features: IFeature[], isDefaultPropertyType = true) {
            if (!propertyType.expression) return;
            var parsedExpression = this.$parse(propertyType.expression);
            var scope = {
                features: features,
                properties: {}
            };
            for (var feature of features) {
                if (!feature.properties) continue;
                let hasFeatureType = feature.properties.hasOwnProperty('featureTypeId');
                if ((hasFeatureType && feature.properties['featureTypeId'] === propertyType.label)
                    || !hasFeatureType && isDefaultPropertyType) {
                    scope.properties = feature.properties;
                    feature.properties[propertyType.label] = parsedExpression(scope, this.ops);
                }
            }
        }

        evalExpression(expression: string, features: IFeature[], feature?: IFeature) {
            var parsedExpression = this.$parse(expression);
            var scope = {
                features: features,
                properties: feature ? feature.properties : null,
                sensors: feature ? feature.sensors : null
            };
            return parsedExpression(scope, this.ops);
        }

        evalSensorExpression(expression: string, features: IFeature[], feature?: IFeature, timeIndex? : number) {
            if (!feature.sensors || feature.sensors.length===0) return null;
            var parsedExpression = this.$parse(expression);
            var scope = {
                timeIndex : timeIndex,
                features: features,
                properties: feature ? feature.properties : null,
                sensors: feature ? feature.sensors : null
            };
            return parsedExpression(scope, this.ops);
        }

        /** Evaluate the expression in a property */
        evalPropertyType(pt: IPropertyType, features: IFeature[], feature?: IFeature) {
            if (!pt.expression || pt.isSensor) return null;
            return csComp.Helpers.convertPropertyInfo(pt, this.evalExpression(pt.expression, features, feature));
        }
    }

    /**
     * Register service
     */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    myModule.service('expressionService', csComp.Services.ExpressionService);
}
