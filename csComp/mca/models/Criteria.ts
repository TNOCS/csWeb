module csComp.Mca.Models {
    export class Criterion {
        public title      : string;
        public description: string;
        /** 
        * Top level label will be used to add a property to a feature, mca_LABELNAME, with the MCA value. 
        * Lower level children will be used to obtain the property value. 
        */
        public label      : string;
        /** Color of the pie chart */
        public color      : string;
        /** Specified weight by the user */
        public userWeight : number = 1;
        /** Derived weight based on the fact that the sum of weights in a group of criteria needs to be 1. */
        public weight     : number;
        /** Scoring function y = f(x), which translates a specified measurement x to a value y, where y in [0,1].
         * Format [x1,y1 x2,y2], and may contain special characters, such as min or max to define the minimum or maximum.
         */
        public scores     : string;

        public criteria: Criterion[] = [];
        /** Piece-wise linear approximation of the scoring function by a set of x and y points */
        public isPlaUpdated: boolean = false;
        private x: number[] = [];
        private y: number[] = [];


        private requiresMinimum(): boolean {
            return this.scores && this.scores.indexOf('min') >= 0;
        }

        private requiresMaximum(): boolean {
            return this.scores && this.scores.indexOf('max') >= 0;
        }

        public getTitle() {
            if (this.title) return this.title;
            return this.label;
        }

        /** 
         * Update the piecewise linear approximation (PLA) of the scoring (a.k.a. user) function, 
         * which translates a property value to a MCA value in the range [0,1] using all features.
         */
        public updatePla(features: GeoJson.Feature[]) {
            if (this.isPlaUpdated) return;
            // Replace min and max by their values:
            var scores = this.scores;
            if (!scores) {
                if (this.criteria.length > 0) {
                    this.criteria.forEach((criterion) => {
                         criterion.updatePla(features);
                    });
                }
                return;
            }
            var propValues: Array<Number> = [];
            if (this.requiresMaximum() || this.requiresMinimum()) {
                features.forEach((feature: GeoJson.Feature) => {
                    if (this.label in feature.properties) {
                        // The property is available
                        propValues.push(feature.properties[this.label]);
                    }
                });
            }
            if (this.requiresMaximum()) {
                scores.replace('max', Math.max.apply(null, propValues));
            }
            if (this.requiresMinimum()) {
                scores.replace('min', Math.min.apply(null, propValues));
            }
            // Regex to split the scores: [^\d\.]+ and remove empty entries
            var pla = scores.split(/[^\d\.]+/).filter(item => item.length > 0);
            // Test that we have an equal number of x and y, 
            if (pla.length % 2 != 0)
                throw Error(this.label + ' does not have an even (x,y) pair in scores.');
            // and that y in [0, 1].
            for (var i = 0; i < pla.length / 2; i++) {
                var x = parseFloat(pla[2*i]);
                if (i > 0 && this.x[i - 1] > x)
                    throw Error(this.label + ': x should increment continuously.');
                this.x.push(x);

                var y = parseFloat(pla[2*i+1]);
                if (y < 0) y = 0;
                else if (y > 1) y = 1;
                this.y.push(y);
            }
            this.isPlaUpdated = true;
        }

        public getScore(feature: GeoJson.Feature, criterion?: Criterion): number {
            if (!this.isPlaUpdated)
                throw ('Error: PLA must be updated!');
            if (!criterion) criterion = this;
            if (criterion.criteria.length == 0) {
                // End point: compute the score for each feature
                var y = 0;
                if (criterion.label in feature.properties) {
                    // The property is available
                    var x = feature.properties[criterion.label];
                    if (x < criterion.x[0]) return criterion.y[0];
                    var last = criterion.x.length-1;
                    if (x > criterion.x[last]) return criterion.y[last];
                    for (var k in criterion.x) {
                        if (x < criterion.x[k]) {
                            // Found relative position of x in criterion.x
                            // TODO Use linear interpolation
                            var x0 = criterion.x[k - 1];
                            var x1 = criterion.x[k];
                            var y0 = criterion.y[k - 1];
                            var y1 = criterion.y[k];
                            //var x0 = criterion.x[Math.max(0, k - 1)];
                            //var x1 = criterion.x[Math.min(last, k)];
                            //var y0 = criterion.y[Math.max(0, k - 1)];
                            //var y1 = criterion.y[Math.min(last, k)];
                            return (y1 - y0) * (x - x0) / (x1 - x0);
                        }
                    }
                } else {
                    return 0;
                }
            } else {
                // Sum all the sub-criteria.
                var finalScore: number = 0;
                this.criteria.forEach((crit) => {
                    finalScore += crit.weight * this.getScore(feature, crit);
                });
                return this.weight * finalScore;
            }
            return 0;
        }

        //public getScores(features: GeoJson.Feature[], criterion?: Criterion): number[] {
        //    if (!criterion) criterion = this;
        //    var resultingScores: number[] = Array<number>(features.length);
        //    if (criterion.criteria.length == 0) {
        //        this.updatePla(features);
        //        // End point: compute the score for each feature
        //        features.forEach((feature: GeoJson.Feature) => {
        //            var y = 0;
        //            if (this.label in feature.properties) {
        //                // The property is available
        //                var x = feature.properties[this.label];
        //                for (var k in this.x) {
        //                    if (x < this.x[k]) {
        //                        // Found relative position of x in this.x
        //                        y = this.y[Math.max(0, k - 1)];
        //                        break;
        //                    }
        //                    y = this.y[this.y.length - 1];
        //                }
        //            } else {
        //                y = 0; 
        //            }
        //            resultingScores.push(this.weight * y);
        //        });
        //        return resultingScores;
        //    } else {
        //        // Sum all the sub-criteria.
        //        var finalScores: number[] = Array<number>(features.length);
        //        this.criteria.forEach((crit) => {
        //            var weightedScores = this.getScore(features, crit);
        //            for (var k in weightedScores) {
        //                finalScores[k] += this.weight + weightedScores[k];
        //            }
        //        });
        //        return finalScores;
        //    }
        //}
    }

    // NOTE: When extending a base class, make sure that the base class has been defined already.
    export class Mca extends Criterion {
        /** Section of the callout */
        public section        : string;
        public description    : string;
        public stringFormat   : string;
        /** Optionally, export the result also as a rank */
        public rankTitle      : string;
        /** Optionally, stringFormat for the ranked result */
        public rankFormat     : string;
        /** Maximum number of star ratings to use to set the weight */
        public userWeightMax  : number = 5;
        /** Applicable feature ids as a string[]. */
        public featureIds     : string[] = [];

        constructor() {
            super();
            this.weight = 1;
            this.isPlaUpdated = true;
        }

        public updatePla(features: GeoJson.Feature[]) {
            this.criteria.forEach((criterion) => {
                criterion.updatePla(features);
            });
        }

        //public calculateWeights(criteria?: Criterion[]): void {
        //    if (!criteria) criteria = this.criteria;
        //    if (criteria.length === 0) return;
        //    var totalWeight = 0;
        //    criteria.forEach((c) => {
        //        totalWeight += c.userWeight;
        //    });
        //    if (totalWeight == 0) return;
        //    criteria.forEach((c) => {
        //        c.weight = c.userWeight / totalWeight;
        //    });
        //}
        public update() {
            this.calculateWeights();
            this.setColors();
        }

        private calculateWeights(criteria?: Criterion[]): void {
            if (!criteria) criteria = this.criteria;
            var totalWeight = 0;
            for (var k in criteria) {
                var crit = criteria[k];
                if (crit.criteria.length > 0)
                    this.calculateWeights(crit.criteria);
                 totalWeight += crit.userWeight;
            }
            if (totalWeight > 0) {
                for (var j in criteria) {
                    var critj = criteria[j];
                    critj.weight = critj.userWeight / totalWeight;
                }
            }
        }

        /** Set the colors of all criteria and sub-criteria */
        private setColors(): void {
            var redColors = chroma.scale('Reds').domain([0, this.criteria.length - 1], this.criteria.length);
            var totalSubcrit = 0;
            var i = 0;
            this.criteria.forEach((c) => {
                totalSubcrit += c.criteria.length;
                c.color = redColors(i++).hex();
            });
            var blueColors = chroma.scale('Blues').domain([0, totalSubcrit - 1], totalSubcrit);
            i = 0;
            this.criteria.forEach((c) => {
                c.criteria.forEach((crit) => {
                    crit.color = blueColors(i++).hex();
                });
            });
        }

    }
} 