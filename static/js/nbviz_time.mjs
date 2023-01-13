import nbviz from './nbviz_core.mjs'

let chartHolder = d3.select('#nobel-time');

let margin = { top: 20, right: 20, bottom: 30, left: 0 };
let boundingRect = chartHolder.node()
    .getBoundingClientRect();
let width = boundingRect.width - margin.left
    - margin.right,
    height = boundingRect.height - margin.top - margin.bottom;

let svg = chartHolder.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top
        + margin.bottom)
    .append('g')
    .attr("transform",
        "translate(" + margin.left + ","
        + margin.top + ")");

let xScale = d3.scaleBand()
    .range([0, width])
    .padding(0.25)
    .domain(d3.range(1901, 2023))

let yScale = d3.scaleBand()
    // 15 is historical maximum of prizes in a year
    .range([height, 0]).domain(d3.range(15))

let xAxis = d3.axisBottom()
    .scale(xScale)
    .tickValues(
        // Override tick values to put tick every 10 years
        xScale.domain().filter(function (d, i) {
            return !(d % 10)
        })
    )
    .tickSizeOuter(0)

svg.append("g") // group to hold the axis
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "middle")

// Created function for adding two sets of category labels
// side by side
let makeCatLabels = function (cats, xPosition) {
    let catLabels = chartHolder.select('svg').append('g')
        .attr('transform', "translate(5, 15)")
        .attr('class', 'labels')
        .selectAll('label').data(cats)
        .join('g')
        // Creates group for every category, spaced vertically 10px apart
        .attr('transform', function (d, i) {
            return `translate(${xPosition}, ${i * 10})`;
        });

    catLabels.append('circle')
        .attr('fill', (nbviz.categoryFill))
        .attr('r', xScale.bandwidth() / 2)

    catLabels.append('text')
        .text(d => d)
        .attr('dy', '0.4em')
        .attr('x', 10)
        .style('font-size', 9)
}

makeCatLabels(nbviz.CATEGORIES.slice(0, 3), 0)
makeCatLabels(nbviz.CATEGORIES.slice(3, nbviz.CATEGORIES.length), 80)


var updateTimeChart = function (data) {
    // Join year data into respective column by year key
    // instead of default arr index (to account for year gaps)
    let years = svg.selectAll('.year').data(data, d => d.key)

    years
        .join("g")
        .classed("year", true)
        .attr("name", (d) => d.key)
        .attr("transform", function (year) {
            return "translate(" + xScale(+year.key) + ",0)";
        });

    let winners = svg
        .selectAll('.year')
        .selectAll('circle')
        .data(
            d => d.values,
            d => d.name
        );

    winners
        .join((enter) => {
            return enter.append('circle')
                .attr('cy', height)
        })
        .attr('fill', function (d) {
            return nbviz.categoryFill(d.category)
        })
        .attr('cx', xScale.bandwidth() / 2)
        .attr('r', xScale.bandwidth() / 2)
        .transition()
        .duration(nbviz.TRANS_DURATION)
        .attr("cy", (d, i) => yScale(i));
}

nbviz.callbacks.push(() => {
    let data = nbviz.nestDataByYear(nbviz.countryDim.top(Infinity));
    updateTimeChart(data);
});