module Mca.Models {
    import IFeature = csComp.Services.IFeature;
    import Feature  = csComp.Services.Feature;

    export enum ScoringFunctionType {
        Manual,
        Ascending,
        Descending,
        AscendingSigmoid,
        DescendingSigmoid,
        GaussianPeak,
        GaussianValley
    }

    /**
    * Scoring function creates a PLA of the scoring algorithm.
    */
    export class ScoringFunction {
        title : string;
        type  : ScoringFunctionType;
        scores: string;

        get cssClass(): string {
            return ScoringFunctionType[this.type].toLowerCase();
        }

        //get img(): string {
        //    return '/includes/images/plot' + csComp.StringExt.Utils.toUnderscore(ScoringFunctionType[this.type]) + '.png';
        //}

        constructor(scoringFunctionType?: ScoringFunctionType) {
            if (typeof scoringFunctionType != 'undefined' && scoringFunctionType != null) this.type = scoringFunctionType;
            this.title = ScoringFunctionType[scoringFunctionType].toString();
        }


        /**
         * Create a score based on the type, in which x in [0,10] and y in [0.1].
         * Before applying it, you need to scale the x-axis based on your actual range.
         * Typically, you would map x=0 to the min(x)+0.1*range(x) and x(10)-0.1*range(x) to max(x),
         * i.e. x' = ax+b, where a=100/(8r) and b=-100(min+0.1r)/(8r) and r=max-min
         */
        static createScores(type: ScoringFunctionType): string {
            var scores: string;
            switch (type) {
                default:
                case ScoringFunctionType.Ascending:
                    scores = '[0,0 10,1]';
                    break;
                case ScoringFunctionType.Descending:
                    scores = '[0,1 10,0]';
                    break;
                case ScoringFunctionType.AscendingSigmoid:
                    // http://mathnotepad.com/: f(x) = (3.5+2*atan(x-5))/7
                    // f([0,1,2,3,4,5,6,7,8,9,10])
                    // round(100*f([0,1,2,3,4,5,6,7,8,9,10]))/100
                    // [0.11 0.12 0.14 0.18 0.28 0.5 0.72 0.82 0.86 0.88 0.89]
                    scores = '[0,0.11 1,0.12 2,0.14 3,0.18 4,0.28 5,0.5 6,0.72 7,0.82 8,0.86 9,0.88 10,0.89]';
                    break;
                case ScoringFunctionType.DescendingSigmoid:
                    // 1-f(x)
                    scores = '[0,0.89 1,0.88 2,0.86 3,0.82 4,0.72 5,0.5 6,0.28 7,0.18 8,0.14 9,0.12 10,0.11]';
                    break;
                case ScoringFunctionType.GaussianPeak:
                    // h(x)=3*exp(-((x-u)^2)/(2s^2))/(s*sqrt(2pi))
                    scores = '[0,0 2,0.04 3,0.25 4,0.7 5,1 6,0.7 7,0.25 8,0.04 9,0]';
                    break;
                case ScoringFunctionType.GaussianValley:
                    // 1-h(x)
                    scores = '[0,1 2,0.96 3,0.75 4,0.3 5,0 6,0.3 7,0.75 8,0.96 9,0]';
                    break;
            }
            return scores;
        }
    }

    export class ScoringFunctions {
        static scoringFunctions: ScoringFunctions[];
    }

    export class Criterion {
        title                                             : string;
        description                                       : string;
        /**
        * Top level label will be used to add a property to a feature, mca_LABELNAME, with the MCA value.
        * Lower level children will be used to obtain the property value.
        */
        label                                             : string;
        /** Color of the pie chart */
        color                                             : string;
        /** Specified weight by the user */
        userWeight = 1;
        /** Derived weight based on the fact that the sum of weights in a group of criteria needs to be 1. */
        weight                                            : number;
        /** Scoring function y = f(x), which translates a specified measurement x to a value y, where y in [0,1].
         * Format [x1,y1 x2,y2], and may contain special characters, such as min or max to define the minimum or maximum.
         */
        scores                                            : string;
        propValues                                        : number[] = [];
        criteria                                          : Criterion[] = [];
        /** Piece-wise linear approximation of the scoring function by a set of x and y points */
        isPlaUpdated = false;
        /** Piece-wise linear approximation must be scaled:x' = ax+b, where a=100/(8r) and b=-100(min+0.1r)/(8r) and r=max-min */
        isPlaScaled = false;
        minValue                                          : number;
        maxValue                                          : number;
        minCutoffValue                                    : number;
        maxCutoffValue                                    : number;
        x                                                 : number[] = [];
        y                                                 : number[] = [];

        deserialize(input: Criterion): Criterion {
            this.title          = input.title;
            this.description    = input.description;
            this.label          = input.label;
            this.color          = input.color;
            this.userWeight     = input.userWeight;
            this.weight         = input.weight;
            this.isPlaScaled    = input.isPlaScaled;
            this.scores         = input.scores;
            this.minCutoffValue = input.minCutoffValue;
            this.maxCutoffValue = input.maxCutoffValue;
            this.minValue       = input.minValue;
            this.maxValue       = input.maxValue;

            input.criteria.forEach((c) => {
                this.criteria.push(new Criterion().deserialize(c));
            });
            return this;
        }

        private requiresMinimum(): boolean {
            return this.scores && this.scores.indexOf('min') >= 0;
        }

        private requiresMaximum(): boolean {
            return this.scores && this.scores.indexOf('max') >= 0;
        }

        getTitle() {
            if (this.title) return this.title;
            return this.label;
        }

        /**
         * Update the piecewise linear approximation (PLA) of the scoring (a.k.a. user) function,
         * which translates a property value to a MCA value in the range [0,1] using all features.
         */
        updatePla(features: IFeature[]) {
            if (this.isPlaUpdated) return;
            if (this.criteria.length > 0) {
                this.criteria.forEach((c) => {
                    c.updatePla(features);
                });
                this.isPlaUpdated = true;
                return;
            }
            // Replace min and max by their values:
            if (this.scores == null) return;
            var scores = this.scores;
            this.propValues = [];
            if (this.requiresMaximum() || this.requiresMinimum() || this.isPlaScaled) {
                features.forEach((feature: Feature) => {
                    if (feature.properties.hasOwnProperty(this.label)) {
                        // The property is available. I use the '+' to convert the string value to a number.
                        var prop = feature.properties[this.label];
                        if ($.isNumeric(prop)) this.propValues.push(prop);
                    }
                });
            }
            var max = this.maxValue,
                min = this.minValue;
            if (this.isPlaScaled || this.requiresMaximum()) {
                max = max || Math.max.apply(null, this.propValues);
                scores.replace('max', max.toPrecision(3));
            }
            if (this.isPlaScaled || this.requiresMinimum()) {
                min = min || Math.min.apply(null, this.propValues);
                scores.replace('min', min.toPrecision(3));
            }
            if (this.isPlaScaled) {
                var stats = csComp.Helpers.standardDeviation(this.propValues);
                max = max || Math.min(max, stats.avg + 2 * stats.stdDev);
                min = min || Math.max(min, stats.avg - 2 * stats.stdDev);
            }
            // Regex to split the scores: [^\d\.]+ and remove empty entries
            var pla = scores.split(/[^\d\.]+/).filter(item => item.length > 0);
            // Test that we have an equal number of x and y,
            var range = max - min,
                a: number,
                b: number;
            if (this.minValue != null || this.maxValue != null) {
                a = range / 10;
                b = min;
            } else {
                a = 0.08 * range,
                b = min + 0.1 * range;
            }

            if (pla.length % 2 !== 0)
                throw Error(this.label + ' does not have an even (x,y) pair in scores.');
            for (var i = 0; i < pla.length / 2; i++) {
                var x = parseFloat(pla[2*i]);
                if (this.isPlaScaled) {
                    // Scale x, i.e. x'=ax+b with x'(0)=min+0.1r and x'(10)=max-0.1r, r=max-min
                    // min+0.1r=b
                    // max-0.1r=10a+b=10a+min+0.1r <=> max-min-0.2r=10a <=> 0.8r=10a <=> a=0.08r
                    x = a * x + b;
                }
                if (i > 0 && this.x[i - 1] > x)
                    throw Error(this.label + ': x should increment continuously.');
                this.x.push(x);
                // Test that y in [0, 1].
                var y = parseFloat(pla[2*i+1]);
                if (y < 0) y = 0;
                else if (y > 1) y = 1;
                this.y.push(y);
            }
            this.isPlaUpdated = true;
        }

        getScore(feature: IFeature): number {
            if (!this.isPlaUpdated)
                throw ('Error: PLA must be updated for criterion ' + this.title + '!');
            if (this.criteria.length === 0) {
                // End point: compute the score for each feature
                if (feature.properties.hasOwnProperty(this.label)) {
                    // The property is available
                    var x = feature.properties[this.label];
                    if (this.maxCutoffValue <= x || x <= this.minCutoffValue) return 0;
                    if (x < this.x[0]) return this.y[0];
                    var last = this.x.length-1;
                    if (x > this.x[last]) return this.y[last];
                    //for (var k in this.x) {
                    for (var k=0; k<this.x.length; k++) {
                        if (x < this.x[k]) {
                            // Found relative position of x in this.x
                            var x0 = this.x[k - 1];
                            var x1 = this.x[k];
                            var y0 = this.y[k - 1];
                            var y1 = this.y[k];
                            // Use linear interpolation
                            return (y1 - y0) * (x - x0) / (x1 - x0);
                        }
                    }
                } else {
                    return 0;
                }
            } else {
                // Sum all the sub-criteria.
                var finalScore = 0;
                this.criteria.forEach((crit) => {
                    finalScore += crit.weight > 0
                        ? crit.weight * crit.getScore(feature)
                        : Math.abs(crit.weight) * (1 - crit.getScore(feature));
                });
                return this.weight > 0
                    ? this.weight * finalScore
                    : Math.abs(this.weight) * (1 - finalScore);
            }
            return 0;
        }
    }

    // NOTE: When extending a base class, make sure that the base class has been defined already.
    export class Mca extends Criterion implements csComp.Services.ISerializable<Mca> {
        /** Section of the callout */
        section        : string;
        stringFormat   : string;
        /** Optionally, export the result also as a rank */
        rankTitle      : string;
        rankDescription: string;
        /** Optionally, stringFormat for the ranked result */
        rankFormat     : string;
        /** Maximum number of star ratings to use to set the weight */
        userWeightMax = 5;
        /** Applicable feature ids as a string[]. */
        featureIds     : string[] = [];
        scaleMaxValue  : number;
        scaleMinValue  : number;

        get rankLabel() {
            return this.label + '#';
        }

        constructor() {
            super();
            this.weight = 1;
            this.isPlaUpdated = false;
        }

        deserialize(input: Mca): Mca {
            this.section         = input.section;
            this.stringFormat    = input.stringFormat;
            this.rankTitle       = input.rankTitle;
            this.rankDescription = input.rankDescription;
            this.rankFormat      = input.rankFormat;
            this.userWeightMax   = input.userWeightMax;
            this.featureIds      = input.featureIds;
            this.minCutoffValue  = input.minCutoffValue;
            this.maxCutoffValue  = input.maxCutoffValue;
            this.minValue        = input.minValue;
            this.maxValue        = input.maxValue;
            this.scaleMinValue   = input.scaleMinValue;
            this.scaleMaxValue   = input.scaleMaxValue;
            super.deserialize(input);
            return this;
        }

        /**
        * Update the MCA by calculating the weights and setting the colors.
        */
        update() {
            this.calculateWeights();
            this.setColors();
        }

        private calculateWeights(criteria?: Criterion[]): void {
            if (!criteria) criteria = this.criteria;
            var totalWeight = 0;
            for (var k in criteria) {
                if (!criteria.hasOwnProperty(k)) continue;
                var crit = criteria[k];
                if (crit.criteria.length > 0)
                    this.calculateWeights(crit.criteria);
                totalWeight += Math.abs(crit.userWeight);
            }
            if (totalWeight > 0) {
                for (var j in criteria) {
                    if (!criteria.hasOwnProperty(j)) continue;
                    var critj = criteria[j];
                    critj.weight = critj.userWeight / totalWeight;
                }
            }
        }

        /** Set the colors of all criteria and sub-criteria */
        private setColors(): void {
            var redColors = chroma.scale('RdYlBu').domain([0, this.criteria.length - 1], this.criteria.length);
            var totalSubcrit = 0;
            var i = 0;
            this.criteria.forEach((c) => {
                totalSubcrit += c.criteria.length;
                if (!c.color)
                    c.color = redColors(i++).hex();
            });
            var blueColors = chroma.scale('PRGn').domain([0, totalSubcrit - 1], totalSubcrit);
            i = 0;
            this.criteria.forEach((c) => {
                c.criteria.forEach((crit) => {
                    if (!crit.color)
                        crit.color = blueColors(i++).hex();
                });
            });
        }

    }
}
