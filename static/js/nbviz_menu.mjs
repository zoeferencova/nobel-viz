import nbviz from './nbviz_core.mjs'

// Create category selector list, concatenating 'All Categories' with cat list
let catList = [nbviz.ALL_CATS].concat(nbviz.CATEGORIES)

// Use D3 to grab category select tag
let catSelect = d3.select('#cat-select select');

// Use D3 data join to turn catList into HTML option tags
catSelect.selectAll('option')
    .data(catList)
    .join('option')
    .attr('value', d => d)
    .html(d => d);

// Trigger category filtering on option selection
// Call onDataChange to update chart elements
catSelect.on('change', function (d) {
    // Update first load var to change transition style 
    nbviz.firstLoad = false
    let category = d3.select(this).property('value');
    nbviz.filterByCategory(category);
    nbviz.onDataChange();
});

d3.select('#gender-select select')
    .on('change', function (d) {
        // Update first load var to change transition style 
        nbviz.firstLoad = false
        let gender = d3.select(this).property('value');
        if (gender === 'All') {
            // Resets gender dimension 
            nbviz.genderDim.filter();
        }
        else {
            nbviz.genderDim.filter(gender);
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