module csComp.Helpers {
    export class PieData {
        id    : number;
        label : string;
        color : string;
        weight: number;
    }

    export class AstorPieData extends PieData {
        score: number;
    }

    export class Plot {
        public static pieColors = ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"];

        public static drawPie(pieRadius: number, data?: any, colorScale = 'Reds', parentId = 'mcaPieChart', svgId = 'the_SVG_ID') {
            Plot.clearSvg(svgId);

            if (!data) return;

            var width = pieRadius,
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

        ///** See http://bl.ocks.org/bbest/2de0e25d4840c68f2db1 */
        //public static drawAsterPlot(pieRadius: number, data: PieData[], parentId: string, svgId?: string) {
        //    if (!svgId) svgId = '#thePieChart';
        //    Plot.clearSvg(svgId);

        //    if (!data) return;

        //    var width       = pieRadius,
        //        height      = pieRadius,
        //        radius      = Math.min(width, height) / 2,
        //        innerRadius = 0.3 * radius;

        //    var pie = d3.layout.pie()
        //        .sort(null)
        //        .value(d => d.weight);

        //    var tip = d3.tip()
        //        .attr('class', 'd3-tip')
        //        .offset([0, 0])
        //        .html(d => '<strong>' + d.data.title + ": </strong> <span style='color:orangered'>Weight: " + Math.round(d.data.weight * 100) + "%,&nbsp; Score: " + Math.round(d.data.score) + ",&nbsp; Weight*Score: " + Math.round(d.data.weight * d.data.score) + "</span>");

        //    var arc = d3.svg.arc()
        //        .innerRadius(innerRadius)
        //        .outerRadius(d => (radius - innerRadius) * (d.data.score / 100.0) + innerRadius);

        //    var outlineArc = d3.svg.arc()
        //        .innerRadius(innerRadius)
        //        .outerRadius(radius);

        //    var svg = d3.select(parentId).append("svg")
        //        .attr("id"    , svgId)
        //        .attr("width" , width)
        //        .attr("height", height)
        //        .append("g")
        //        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        //    try {
        //        svg.call(tip);
        //    }
        //    catch (err) {
        //        console.log("Error: " + err.message);
        //    }

        //    var path = svg.selectAll(".solidArc")
        //        .data(pie(data))
        //        .enter().append("path")
        //        .attr("fill", function (d) { return d.data.color; })
        //        .attr("class", "solidArc")
        //        .attr("stroke", "gray")
        //        .attr("d", arc)
        //        .on('mouseover', (d, i) => {
        //            tip.show(d, i);
        //            //$rootScope.$broadcast('tooltipShown', { id: d.data.id });
        //        })
        //        .on('mouseout', tip.hide);

        //    var outerPath = svg.selectAll(".outlineArc")
        //        .data(pie(data))
        //        .enter().append("path")
        //        .attr("fill", "none")
        //        .attr("stroke", "gray")
        //        .attr("class", "outlineArc")
        //        .attr("d", outlineArc);


        //    // calculate the weighted mean score
        //    var totalWeight = 0;
        //    var totalScore = 0;
        //    data.forEach((p: PieData) => {
        //        totalWeight += p.weight;
        //        totalScore += p.weight * p.weight;
        //    });

        //    svg.append("svg:text")
        //        .attr("class", "aster-score")
        //        .attr("dy", ".35em")
        //        .attr("text-anchor", "middle") // text-align: right
        //        .text(Math.round(totalScore / totalWeight));
        //}

    }

}