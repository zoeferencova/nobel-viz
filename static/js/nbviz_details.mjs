import nbviz from "./nbviz_core.mjs";

let updateList = function (data) {
    let tableBody, rows, cells
    // Sort the winners' data by year
    data = data.sort(function (a, b) {
        return +b.year - +a.year
    })
    // select table-body from index.html
    tableBody = d3.select('#nobel-list tbody')
    // create place-holder rows bound to winners' data
    rows = tableBody.selectAll('tr').data(data)

    rows.join(
        (enter) => {
            // create any new rows required
            return enter.append('tr').on('click', function (event, d) {
                console.log('You clicked a row ' + JSON.stringify(d))
                displayWinner(d)
            })
        },
        (update) => update,
        (exit) => {
            return exit
                .transition()
                .duration(nbviz.TRANS_DURATION)
                .style('opacity', 0)
                .remove()
        }
    )

    cells = tableBody
        .selectAll('tr')
        .selectAll('td')
        .data(function (d) {
            d.category === 'Physiology or Medicine' ? d.category = 'Physiology' : null
            return [d.year, d.category, d.name]
        })
    // Append data cells, then set their text
    cells.join('td').text(d => d)
    // Display a random winner if data is available
    if (data.length) {
        displayWinner(data[Math.floor(Math.random() * data.length)])
    }


}

let displayWinner = function (wData) {
    // store the winner's bio-box element
    let nw = d3.select('#nobel-winner')

    nw.select('#winner-title').text(wData.name)

    // Select span tags of all divs with class property, then use span's name
    // attr to retrieve correct property from winner data and set tag's text
    nw.selectAll('.property span')
        .text(function (d) {
            var property = d3.select(this).attr('name')
            return wData[property]
        })


    nw.select('.cat')
        .style('color', nbviz.COLORS[wData.category])
        .style('filter', 'brightness(80%)')
        .style('background', nbviz.COLORS[wData.category] + '25')

    nw.select('#biobox').html(wData.mini_bio)
    // Add an image if available, otherwise remove the old one
    if (wData.bio_image) {
        nw.select('#picbox img')
            .attr('src', 'static/images/winners/' + wData.bio_image)
            .style('display', 'inline')
    } else {
        nw.select('#picbox img')
            .attr('src', 'static/images/default.png')
            .style('display', 'inline')
    }

    nw.select('#readmore a').attr(
        'href',
        'http://en.wikipedia.org/wiki/' + wData.name
    )
}

nbviz.callbacks.push(() => {
    let data = nbviz.countryDim.top(Infinity);
    updateList(data);
});