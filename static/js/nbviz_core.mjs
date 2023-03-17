let nbviz = {

}

// Setting constant variables 
nbviz.ALL_CATS = 'All Categories'
nbviz.MAX_CENTROID_RADIUS = 30
nbviz.MIN_CENTROID_RADIUS = 2
nbviz.TRANS_DURATION = 1000 // time in milliseconds

// Variable to prevent transition on first load
// Don't like initilal rotation of axis labels
nbviz.firstLoad = true

nbviz.data = {} // our main data store
nbviz.valuePerCapita = 0 // metric flag
nbviz.activeCountry = null
nbviz.activeCategory = nbviz.ALL_CATS

nbviz.CATEGORIES = [
    "Chemistry", "Economics", "Literature", "Peace",
    "Physics", "Physiology or Medicine"
];

nbviz.COLORS = {
    "Chemistry": '#00798c',
    "Economics": '#d1495b',
    "Literature": '#edae49',
    "Peace": '#66a182',
    "Physics": '#2e4057',
    "Physiology or Medicine": '#7570B5',
    "All Categories": "#9CA3AF",
    "Physiology": '#7570B5',
}

nbviz.categoryFill = function (category) {
    return nbviz.COLORS[category]
};

nbviz.nestDataByYear = function (entries) {
    let yearGroups = d3.group(entries, (d) => d.year);
    let keyValues = Array.from(yearGroups, ([key, values]) => {
        let year = key;
        let prizes = values;
        prizes = prizes.sort(
            // Sort prizes alphabetically by category
            (p1, p2) => (p1.category > p2.category ? 1 : -1));
        return { key: year, values: prizes };
    });
    return keyValues.sort(keyValues.key);
};

// Uses loaded NP data to create Crossfilter filter and some dimensions
// (e.g. prize category) based on it.
nbviz.makeFilterAndDimensions = function (winnersData) {
    // Add filter and create category dimensions
    nbviz.filter = crossfilter(winnersData);

    // NOTE: Crossfilter allows creation of dimensional filters by applying
    // a function to the data objects

    nbviz.countryDim = nbviz.filter.dimension(o => o.country);

    // Create gender dimension
    nbviz.genderDim = nbviz.filter.dimension(o => o.gender);

    // EXAMPLE: using dimension
    // nbviz.genderDim.filter('female');
    // Once filter is applied, top returns specified number of ordered objects
    // Infinity returns all filtered objects
    // var femaleWinners = nbviz.genderDim.top(Infinity);
    // femaleWinners.length // 47
    // Resetting dimension, can be done selectively with multidimensional filtering
    // nbviz.genderDim.filter();

    nbviz.categoryDim = nbviz.filter.dimension(o => o.category)

    // EXAMPLE: multidimensional filtering, returning female Physics winners
    // nbviz.genderDim.filter('female');
    // nbviz.categoryDim.filter('Physics');
    // nbviz.genderDim.top(Infinity);

    // Crossfilter can also perform grouping operations:
    // var countryGroup = nbviz.countryDim.group(); 
    // countryGroup.all(); // returns all gropus by key and value (total winners by country)
};

nbviz.filterByCountries = function (countryNames) {
    if (!countryNames.length) {
        // Clear filter if arr is empty (All Countries selected)
        nbviz.countryDim.filter();
    } else {
        // Create filter func on crossfilter country dimension, returning
        // true if country is in countryNames list
        nbviz.countryDim.filter(function (name) {
            return countryNames.indexOf(name) > -1;
        });
    }

    // Makes activeCountry selected country (for map and bar chart highlights)
    if (countryNames.length === 1) {
        nbviz.activeCountry = countryNames[0];
    } else {
        nbviz.activeCountry = null;
    }
};

nbviz.filterByCategory = function (cat) {
    nbviz.activeCategory = cat;

    if (cat === nbviz.ALL_CATS) {
        nbviz.categoryDim.filter();
    } else {
        nbviz.categoryDim.filter(cat);
    }
};

// Main dataset consumed by timeline, map, and bar chart
// Groups prize winners by country and adds national info
nbviz.getCountryData = function () {
    // countryDim is one of the Crossfilter dimensions that
    // provides group key,value counts (e.g. {key: Argentina, value: 5})
    var countryGroups = nbviz.countryDim.group().all();

    // Map through countryGroups, adding components from country dataset
    var data = countryGroups.map(function (c) {
        // Fetches country data using group key (e.g. Argentina)
        var cData = nbviz.data.countryData[c.key];
        var value = c.value;
        // If per capita value then divide by pop. size for relative prize count
        if (nbviz.valuePerCapita) {
            value = value / cData.population;
        }

        return {
            key: c.key, // e.g., Japan
            value: value, // e.g., 19 (prizes)
            code: cData.alpha3Code, // e.g., JPN
        };
    })
        .sort(function (a, b) {
            // Make array descending by value
            return b.value - a.value;
        });

    return data;
};

nbviz.callbacks = []

// Called when dataset changes (user-driven) to update Nobel-viz elements.
// Update callbacks set by component modules and stored in callbacks
// array are then called, triggering necessary visual changes.
nbviz.onDataChange = function () {
    nbviz.callbacks.forEach((cb) => cb())
}

export default nbviz 
