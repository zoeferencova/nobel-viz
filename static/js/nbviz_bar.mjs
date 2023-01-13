import nbviz from './nbviz_core.mjs'

// Select chart holder element
let chartHolder = d3.select('#nobel-bar')
// Set chart margins
let margin = { top: 20, right: 20, bottom: 35, left: 40 }
// Element.getBoundingClientRect() method returns a DOMRect object providing 
// information about the size of an element and its position relative to the viewport.
let boundingRect = chartHolder.node().getBoundingClientRect()
// Calculate width and height, subtracting margins from dimensions of chartHolder element
let width = boundingRect.width - margin.left - margin.right,
    height = boundingRect.height - margin.top - margin.bottom
// Add left-padding for the y-axis label
var xPaddingLeft = 20

// scaleBand allows for non-numerical x-axis labels 
let xScale = d3.scaleBand()
    // Creates axis from end of x-padding to full width of outer element
    .range([xPaddingLeft, width]) // left-padding for y-label
    // Padding between bars (?)
    .padding(0.1)

// Linear scale for y-axis, height of outer element listed first due to
// downwards direction of axis values
let yScale = d3.scaleLinear().range([height, 0])

let xAxis = d3.axisBottom().scale(xScale).tickSizeOuter(0)



let yAxis = d3
    .axisLeft()
    .scale(yScale)
    .ticks(10)
    .tickFormat(function (d) {
        // Format tick labels to change with chosen metric (per capita or absolute)
        if (nbviz.valuePerCapita) {
            // Per capita produces small number, so list in exponential form
            return d.toExponential()
        }
        return d
    })

// Create svg chart group and storing to variable
var svg = chartHolder
    .append('svg')
    // SVG width and height are the sum of its child group and the surrounding margins
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    // child group is offset using transform to translate it margin.left pixels 
    //to the right and margin.top pixels down
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')



// Add x-axis group to svg selector 
svg.append("g")
    .attr("class", "x axis")
    // Translate bottom-oriented axis from chart's top by height px
    .attr("transform", "translate(0," + height + ")");

// Add y-axis group to svg selector 
svg.append("g")
    .attr("class", "y axis")
    .append("text")
    .text('Number of winners')
    .attr('id', 'y-axis-label')
    .attr("transform", "rotate(-90)")
    // y position from left
    .attr("y", 7)
    // dy is a relative coordinate (to y specified above)
    // Using em to make adjustments to text margin and baseline
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .style("fill", "black")



let updateBarChart = function (data, firstLoad) {
    // Filter out any countries with zero prizes by value
    data = data.filter(function (d) {
        return d.value > 0
    })
    // Change the scale domains to reflect the newly filtered data
    // this produces an array of country codes: ['USA', 'DEU', 'FRA' ...]
    xScale.domain(data.map(d => d.code))
    // we want to scale the highest number of prizes won, e.g., USA: 336
    yScale.domain([0, d3.max(data, d => d.value)])

    // Use the axes generators with the new scale domains
    svg.select('.x.axis')
        // Creating transition on change
        .transition().duration(firstLoad ? 0 : nbviz.TRANS_DURATION)
        // Calling d3 axis on x-axis group builds necessary axis SVG
        .call(xAxis)
        // SVG manipulations on x-axis text
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");


    svg.select('.y.axis')
        .transition().duration(firstLoad ? 0 : nbviz.TRANS_DURATION)
        .call(yAxis);

    // Use data-join to create the bars necessary for the data provided
    let bars = svg
        // Select all elements with class bar
        .selectAll('.bar')
        // Add data to elements
        .data(data, d => d.code)
        .join(
            // Customize the enter method to add a bar class to the rectangle. 
            // Note that we need to return the enter object to use after the join call.
            (enter) => {
                return enter
                    .append('rect')
                    .attr('class', 'bar')
                    .attr('x', xPaddingLeft)
            }
        )
        .classed('active', function (d) {
            return d.key === nbviz.activeCountry
        })
        .transition()
        .duration(firstLoad ? 0 : nbviz.TRANS_DURATION)
        // Setting x position of bars
        .attr('x', d => xScale(d.code))
        // Setting width of bars. bandwidth() automatically calculates width based on scale
        .attr('width', xScale.bandwidth())

        // Setting y values
        // Setting height of bars, subtracting y value from total chart height
        .attr('y', firstLoad ? d => yScale(0) : d => yScale(d.value))
        .attr('height', firstLoad ? 0 : d => height - yScale(d.value))
        .transition()
        .duration(nbviz.TRANS_DURATION)
        .attr('y', d => yScale(d.value))
        .attr('height', d => height - yScale(d.value))
}

nbviz.callbacks.push(() => {
    let data = nbviz.getCountryData();
    updateBarChart(data, nbviz.firstLoad);
});