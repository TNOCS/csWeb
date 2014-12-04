module csComp.Helpers {
    export class PieData {
        id    : number;
        label : string;
        color : string;
        weight: number;
    }

    export class AsterPieData extends PieData {
        score: number;
    }

    export interface IHistogramOptions {
        id?          : string;
        numberOfBins?: number;
        width?       : number;
        height?      : number;
        xLabel?      : string;
        //yLabel?      : string;
    }

    export class Plot {

        public static drawHistogram(values: number[], options?: IHistogramOptions) {
            var id           = (options != null && options.hasOwnProperty('id'))           ? options.id           : 'myHistogram';
            var numberOfBins = (options != null && options.hasOwnProperty('numberOfBins')) ? options.numberOfBins : 10;
            var width        = (options != null && options.hasOwnProperty('width'))        ? options.width        : 200;
            var height       = (options != null && options.hasOwnProperty('height'))       ? options.height       : 150;
            var xLabel       = (options != null && options.hasOwnProperty('xLabel'))       ? options.xLabel       : 'data';
            //var yLabel       = (options != null && options.hasOwnProperty('yLabel'))       ? options.yLabel       : '#';

            var margin = { top: 0, right: 6, bottom: 24, left: 6 };
            width     -= margin.left + margin.right,
            height    -= margin.top + margin.bottom;

            var svgId = id + "_histogram";

            Plot.clearSvg(svgId);

            // A formatter for counts.
            var formatCount = d3.format(",.0f");

            var max = Math.max.apply(null, values);
            var min = Math.min.apply(null, values);

            // Scale the x-range, so we don't have such long numbers
            var range = max - min;
            var scale = d3.round(range, 0).toString().length - 2;
            if (scale >= 2)
                xLabel += " (x10^" + scale + ")";
            var tickFormatter = (value: number) => {
                return scale < 2
                    ? value.toString()
                    : (d3.round(value/Math.pow(10,scale), 0).toString());
            }

            var tempScale = d3.scale.linear().domain([0, numberOfBins]).range([min, max]);
            var tickArray = d3.range(numberOfBins + 1).map(tempScale);
            var x = d3.scale.linear()
                .domain([min, max])
                .range([0, width]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .tickValues(tickArray)
                .tickFormat(tickFormatter)
                .orient("bottom");

            // Generate a histogram using numberOfBins uniformly-spaced bins.
            var data = d3.layout.histogram().bins(numberOfBins)(values);

            var y = d3.scale.linear()
                .domain([0, d3.max(data, d => d.y)])
                .range([height, 0]);

            var svg = d3.select("#" + id)
                .append("svg")
                .attr("id", svgId)
                .attr("width" , width  + margin.left + margin.right)
                .attr("height", height + margin.top  + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", d => "translate(" + x(d.x) + "," + y(d.y) + ")");

            bar.append("rect")
                .attr("x", 1)
                .attr("width", x(min + data[0].dx) - 1)
                .attr("height", d => height - y(d.y));

            var conditionalFormatCounter = (value: number) => {
                return (height - y(value) > 6) 
                    ? formatCount(value)
                    : '';
            };

            // Text (count) inside the bins
            bar.append("text")
                .attr("dy", ".75em")
                .attr("y", 6)
                .attr("x", x(min + data[0].dx) / 2)
                .attr("text-anchor", "middle")
                .text(d => conditionalFormatCounter(d.y));

            // x-label
            svg.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", width)
                .attr("y", height - 6)
                .text(xLabel);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);
        }


        public static pieColors = ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"];

        /**
        * Draw a Pie chart.
        */
        public static drawPie(pieRadius: number, data?: PieData[], parentId = 'mcaPieChart', colorScale = 'Reds', svgId = 'the_SVG_ID') {
            Plot.clearSvg(svgId);

            if (!data) return;

            var width  = pieRadius,
                height = pieRadius,
                radius = Math.min(width, height) / 2,
                innerRadius = 0;

            var pie = d3.layout.pie()
                .sort(null)
                .value(d => d.weight);

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([0, 0])
                .html(d => '<strong>' + d.data.label + ": </strong><span style='color:orangered'>" + Math.round(d.data.weight * 100) + "%</span>");

            var arc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(radius);

            var outlineArc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(radius);

            var svg = d3.select('#' + parentId)
                .append("svg")
                .attr("id", svgId)
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            svg.call(tip);

            var colors = chroma.scale(colorScale).domain([0, data.length - 1], data.length);
            var path = svg.selectAll(".solidArc")
                .data(pie(data))
                .enter().append("path")
                .attr("fill", (d, i) => d.data.color || colors(i).hex())
                .attr("class", "solidArc")
                .attr("stroke", "gray")
                .attr("d", arc)
                .on('mouseover', (d, i) => {
                    tip.show(d, i);
                })
                .on('mouseout', tip.hide);

            var outerPath = svg.selectAll(".outlineArc")
                .data(pie(data))
                .enter().append("path")
                .attr("fill", "none")
                .attr("stroke", "gray")
                .attr("class", "outlineArc")
                .attr("d", outlineArc);
        }

        /**
        * Draw an Aster Pie chart, i.e. a pie chart with varying radius depending on the score, where the maximum score of 100 equals the pie radius.
        * See http://bl.ocks.org/bbest/2de0e25d4840c68f2db1
        */
        public static drawAsterPlot(pieRadius: number, data?: AsterPieData[], parentId = 'mcaPieChart', colorScale = 'Reds', svgId = 'the_SVG_ID') {
            Plot.clearSvg(svgId);

            if (!data) return;

            var width  = pieRadius,
                height = pieRadius,
                radius = Math.min(width, height) / 2,
                innerRadius = 0.3 * radius;

            var pie = d3.layout.pie()
                .sort(null)
                .value(d => d.weight);

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([0, 0])
                .html(d => '<strong>' + d.data.label + ": </strong> <span style='color:orangered'>" + Math.round(d.data.weight * 100) + "% x " + Math.round(d.data.score) + "&nbsp; = " + Math.round(d.data.weight * d.data.score) + "</span>");

            var arc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(d => (radius - innerRadius) * (d.data.score / 100.0) + innerRadius);

            var outlineArc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(radius);

            var svg = d3.select('#' + parentId)
                .append("svg")
                .attr("id", svgId)
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            try {
                svg.call(tip);
            }
            catch (err) {
                console.log("Error: " + err.message);
            }

            var colors = chroma.scale(colorScale).domain([0, data.length - 1], data.length);
            var path = svg.selectAll(".solidArc")
                .data(pie(data))
                .enter().append("path")
                .attr("fill", (d, i) => d.data.color || colors(i).hex())
                .attr("class", "solidArc")
                .attr("stroke", "gray")
                .attr("d", arc)
                .on('mouseover', (d, i) => {
                    tip.show(d, i);
                    //$rootScope.$broadcast('tooltipShown', { id: d.data.id });
                })
                .on('mouseout', tip.hide);

            var outerPath = svg.selectAll(".outlineArc")
                .data(pie(data))
                .enter().append("path")
                .attr("fill", "none")
                .attr("stroke", "gray")
                .attr("class", "outlineArc")
                .attr("d", outlineArc);


            // calculate the weighted mean score
            var totalWeight = 0;
            var totalScore = 0;
            data.forEach((p: AsterPieData) => {
                totalWeight += p.weight;
                totalScore += p.weight * p.score;
            });

            svg.append("svg:text")
                .attr("class", "aster-score")
                .attr("dy", ".35em")
                .attr("text-anchor", "middle") // text-align: right
                .text(Math.round(totalScore / totalWeight));
        }

        public static clearSvg(svgId: string) {
            var svgElement = d3.select('#' + svgId);
            if (svgElement) svgElement.remove();
        }

        ///**
        // * Draw a Pie chart.
        // */
        //public static drawPie(pieRadius: number, data: PieData[], colorScale = 'Reds', parentId = '#thePie', svgId = "thePieChart") {
        //    Plot.clearSvg(svgId);

        //    if (!data) return;

        //    var width       = pieRadius,
        //        height      = pieRadius,
        //        radius      = Math.min(width, height) / 2,
        //        innerRadius = 0.3 * radius;

        //    var pie = d3.layout.pie()
        //        .value(d => d.weight);

        //    var tip = d3.tip()
        //        .attr('class', 'd3-tip')
        //        .offset([0, 0])
        //        .html(d => '<strong>' + d.data.title + ":</strong> <span style='color:orangered'>" + Math.round(d.data.weight * 100) + "%</span>");

        //    var arc = d3.svg.arc()
        //        .innerRadius(innerRadius)
        //        .outerRadius(d => radius);

        //    var outlineArc = d3.svg.arc()
        //        .innerRadius(innerRadius)
        //        .outerRadius(radius);

        //    var svg = d3.select(parentId)
        //        .append("svg")
        //        .attr("id"    , svgId)
        //        .attr("width" , width)
        //        .attr("height", height)
        //        .append("g")
        //        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        //    var colors = chroma.scale(colorScale).domain([0, data.length - 1], data.length);
        //    var path = svg.selectAll(".solidArc")
        //        .data(pie(data))
        //        .enter().append("path")
        //        .attr("fill", (d, i) => d.data.color || colors(i).hex())
        //        .attr("class", "solidArc")
        //        .attr("stroke", "gray")
        //        .attr("d", arc)
        //        .on('mouseover', tip.show)
        //        .on('mouseout', tip.hide);

        //    svg.selectAll(".outlineArc")
        //        .data(pie(data))
        //        .enter().append("path")
        //        .attr("fill", "none")
        //        .attr("stroke", "gray")
        //        .attr("class", "outlineArc")
        //        .attr("d", outlineArc);

        //    svg.call(tip);
        //}

        //public static clearSvg(id: string) {
        //    var svgElement = d3.select(id);
        //    if (svgElement) svgElement.remove();
        //}


    }

}