import nbviz from './nbviz_core.mjs'

let catSelect = d3.select("#cat-select")
const circleRadius = 7;

let makeCatFilter = function (cats) {
    let catFilter = catSelect.append('svg')
        .attr('id', 'cat-filter')
        .selectAll().data(Object.keys(cats).slice(0, -1))
        .join('g')
        .classed('cat-filter-item', true)
        // Creates group for every category, spaced vertically 10px apart
        .attr('transform', function (d, i) {
            return `translate(${circleRadius}, ${i * 24 + circleRadius})`;
        })

    catFilter.append('circle')
        .attr('fill', (nbviz.categoryFill))
        .attr('r', circleRadius)
        .attr('opacity', 0.7)

    catFilter.append('text')
        .text(d => d)
        .attr('dy', '0.4em')
        .attr('x', 18)

    if (window.innerWidth < 900) {
        catFilter.style('font-size', '12px')
    } else {
        catFilter.style('font-size', '14px')
    }

    catFilter.on('click', function (d) {
        // Update first load var to change transition style 
        nbviz.firstLoad = false
        let category = d3.select(this).property('__data__')
        if (category === 'All Categories') {
            d3.selectAll('.cat-filter-item').attr('opacity', 1)
        } else {
            d3.selectAll('.cat-filter-item').attr('opacity', 0.3)
            d3.select(this).attr('opacity', 1)
        }
        nbviz.filterByCategory(category);
        nbviz.onDataChange();
    });
}

makeCatFilter(nbviz.COLORS)


d3.select('#gender-select form')
    .on('change', function (d) {
        var boxes = d3.selectAll("#gender-select input");
        const checked = []
        boxes.each(function () {
            if (this.checked) checked.push({ item: this, value: this.value })
        })

        if (checked.length > 1) {
            nbviz.genderDim.filter();
            d3.select('#nobel-winner').style('opacity', '1')
            // checked.forEach(el => el.item.disabled = false)
        } else if (checked.length === 1) {
            nbviz.genderDim.filter(checked[0].value);
            d3.select('#nobel-winner').style('opacity', '1')
            // checked[0].item.disabled = true
        } else {
            nbviz.genderDim.filter('none')
            d3.select('#nobel-winner').style('opacity', '0')
        }

        nbviz.onDataChange();
    });


d3.selectAll('#metric-radio input').on('change', function () {
    // Update first load var to change transition style 
    nbviz.firstLoad = false
    var val = d3.select(this).property('value');
    nbviz.valuePerCapita = parseInt(val);
    nbviz.onDataChange();
});


export let initMenu = function () {
    let ALL_WINNERS = 'All Winners';
    let SINGLE_WINNERS = 'Single Winning Countries';
    let DOUBLE_WINNERS = 'Double Winning Countries';

    let nats = nbviz.countrySelectGroups = nbviz.countryDim
        // Sorted group array with countries and wins key-value pairs
        .group().all()
        .sort(function (a, b) {
            return b.value - a.value; // descending
        });

    // Object with lists to store single and double winners
    let fewWinners = { 1: [], 2: [] };
    let selectData = [ALL_WINNERS];

    // Push countries to select option arr or fewWinners depending on win #
    nats.forEach(function (o) {
        if (o.value > 2) {
            selectData.push(o.key);
        }
        else {
            fewWinners[o.value].push(o.key);
        }
    });

    // Push single winners and double winners to select option arr
    selectData.push(
        DOUBLE_WINNERS,
        SINGLE_WINNERS
    );

    let countrySelect = d3.select('#country-select select');

    // Join selectData arr to country selector
    countrySelect
        .selectAll("option")
        .data(selectData)
        .join("option")
        .attr("value", (d) => d)
        .html((d) => d);

    countrySelect.on('change', function (d) {
        // Update first load var to change transition style 
        nbviz.firstLoad = false
        let countries;
        let country = d3.select(this).property('value');

        // Set countries value based on selection
        if (country === ALL_WINNERS) {
            countries = [];
        } else if (country === DOUBLE_WINNERS) {
            countries = fewWinners[2];
        } else if (country === SINGLE_WINNERS) {
            countries = fewWinners[1];
        } else {
            countries = [country];
        }

        // Trigger filter callback 
        nbviz.filterByCountries(countries);
        // Update other elements accordingly
        nbviz.onDataChange();
    });
}