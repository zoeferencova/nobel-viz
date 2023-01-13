import nbviz from "./nbviz_core.mjs";

// Map building process:
// 1. Choose map projection (representation of globe in 2D)
// 2. Use projection to create D3 path generator, turning GeoJSON features into SVG paths
// 3. Initiate map with world map data
// 4. Update map with country, binding data to paths as needed
// 5. Join items to map and customize appearance using D3 and CSS
// 6. Add indicators, tooltips or highlighting based on events

let defaultMapWidth = 960,
    defaultMapHeight = 480;

// DIMENSIONS AND SVG
let mapContainer = d3.select("#nobel-map");
let boundingRect = mapContainer.node().getBoundingClientRect();
let width = boundingRect.width,
    height = boundingRect.height;

let svg = mapContainer.append('svg');

let MANUAL_CENTROIDS = {
    France: [2, 46],
    "United States": [-98, 35, 39.5],
};


// projections specify different globe representations and can be configured
// using various methods (scale, center, precision, etc.)
let projection = d3.geoEquirectangular()
    // Slightly enlarging scale
    .scale(193 * (height / 480))
    // Centered at 15 degrees east, 15 degrees north
    .center([15, 15])
    .translate([width / 2, height / 2])
    // Used for adaptive resampling to increase accuracy of projected lines
    // and polygons while still performing efficiently
    .precision(0.1);

// Create SVG path out of map projection, setting path and projection in one go
var path = d3.geoPath()
    .projection(projection);

// Add graticule (grid lines)
var graticule = d3.geoGraticule().step([20, 20]);
svg.append("path").datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

// Retrieve stored country center coords from mapData object
let getCentroid = function (mapData) {
    let latlng = nbviz.data.countryData[mapData.name].latlng;
    // Use equirectangular projection to turn these into SVG coords
    return projection([latlng[1], latlng[0]]);
};

// Radius scale for centroid (map center) prize indicators
// scaleSqrt is used to size circles by area (rather than radius).
// This is considered best practice when using circle size to represent data
let radiusScale = d3.scaleSqrt()
    .range([nbviz.MIN_CENTROID_RADIUS, nbviz.MAX_CENTROID_RADIUS]);

// Object to map country name to GeoJSON object
let cnameToCountry = {};

// world TopoJSON object with country features with a names array, connecting 
// country names to country freature IDs (e.g. {id: 36, name: 'Australia'})
export let initMap = function (world, names) {
    // feature returns GeoJSON Feature or FeatureCollection for specified object
    let land = topojson.feature(world, world.objects.land),
        // Extract required features from TopoJSON, deliver in GeoJSON
        countries = topojson.feature(world, world.objects.countries).features,
        // mesh is used to extract shared borders
        borders = topojson.mesh(world, world.objects.countries,
            // Filter for only internal borders, shared between countries
            // If arc is only used by one country, a and b are identical
            function (a, b) { return a !== b; });

    let idToCountry = {};
    countries.forEach(function (c) {
        idToCountry[c.id] = c;
    });

    cnameToCountry = {};
    names.forEach(function (n) {
        cnameToCountry[n.name] = idToCountry[n.id];
    });

    // Main world map
    svg.insert("path", ".graticule")
        // datum assigns whole land object to path
        .datum(land)
        .attr("class", "land")
        .attr("d", path);

    // Winning countries
    svg.insert("g", ".graticule").attr("class", "countries");

    // Inserting country paths
    svg.insert("g", ".graticule")
        .attr("class", 'countries');

    // Countries value-indicators
    svg.insert("g")
        .attr("class", "centroids");

    // Insert borders SVG before (below) map's grid (graticule) overlay
    svg.insert("path", ".graticule")
        .datum(borders)
        .attr("class", "boundary")
        .attr("d", path);
}

let tooltip = d3.select("#map-tooltip");

let updateMap = function (countryData) {
    let mapData = (nbviz.mapData = countryData
        // Filters out countries with no winners, only display winning countries on map
        .filter((d) => d.value > 0)
        .map(function (d) {
            return {
                // Uses country's key (name) to retrieve its GeoJSON file
                geo: cnameToCountry[d.key],
                name: d.key,
                number: d.value,
            };
        }));

    // Get max number of winners per country for centroid circle scale
    let maxWinners = d3.max(mapData.map((d) => d.number));
    // DOMAIN OF VALUE-INDINCATOR SCALE
    radiusScale.domain([0, maxWinners]);

    // Bind country name data to countries
    let countries = svg
        .select(".countries")
        .selectAll(".country")
        .data(mapData, (d) => d.name);

    // Use a data-join to make selected countries visible
    // and fade them in over TRANS_DURATION milliseconds
    countries
        .join(
            (enter) => {
                return enter
                    // Create country map shapes using path object
                    // country class filled green in CSS, active filled darker green
                    .append("path")
                    .attr("class", "country")
                    .attr("name", (d) => d.name)
                    // Set SVG paths to class active on mouseover
                    // Use this keyword to get current country
                    .on("mouseenter", function (event) {
                        let country = d3.select(this);
                        if (!country.classed("visible")) {
                            return;
                        }

                        // Get country data object
                        let cData = country.datum();
                        // If only one prize, use singular 'prize'
                        let prize_string =
                            cData.number === 1 ? " prize in " : " prizes in ";
                        // Set header and dtext of tooltip
                        tooltip.select("h2").text(cData.name);
                        tooltip
                            .select("p")
                            .text(cData.number + prize_string + nbviz.activeCategory);
                        // Set tooltip border colour according to category selected
                        let borderColor =
                            nbviz.activeCategory === nbviz.ALL_CATS
                                ? "goldenrod"
                                : nbviz.categoryFill(nbviz.activeCategory);
                        tooltip.style("border-color", borderColor);


                        // Get the computed width and height of the tooltip box, 
                        // which has been adjusted to accommodate our country title and prize string.
                        let w = parseInt(tooltip.style("width")),
                            h = parseInt(tooltip.style("height"));

                        // D3 pointer method returns mouse coords from event object in px
                        // which we can use to position the tooltip
                        let mouseCoords = d3.pointer(event);

                        // Use mouse coords and w and h of tooltip box to position box centered
                        // horizontally and roughly above mouse cursor
                        tooltip.style("top", mouseCoords[1] - h + "px");
                        tooltip.style("left", mouseCoords[0] - w / 2 + "px");

                        d3.select(this).classed("active", true);
                    })

                    // Make tooltip disappear when mouse leaves by positioning it far left of the map
                    .on("mouseout", function (d) {
                        tooltip.style("left", "-9999px");
                        d3.select(this).classed("active", false);
                    });
            },
            (update) => update,
            (exit) => {
                return exit
                    .classed("visible", false)
                    .transition()
                    .duration(nbviz.TRANS_DURATION)
                    .style("opacity", 0);
            }
        )
        .classed("visible", true)
        .transition()
        .duration(nbviz.TRANS_DURATION)
        .style("opacity", 1)
        .attr("d", (d) => path(d.geo));

    // Bind map data with name key
    let centroids = svg
        .select(".centroids")
        .selectAll(".centroid")
        .data(mapData, (d) => d.name);

    // Join data to circle indicators
    centroids
        .join(
            (enter) => {
                return enter
                    .append("circle")
                    .attr("class", "centroid")
                    .attr("name", (d) => d.name)
                    .attr("cx", (d) => getCentroid(d)[0])
                    .attr("cy", (d) => getCentroid(d)[1]);
            },
            (update) => update,
            (exit) => exit.style("opacity", 0)
        )
        .classed("active", (d) => d.name === nbviz.activeCountry)
        .transition()
        .duration(nbviz.TRANS_DURATION)
        .style("opacity", 1)
        // Set circle radius based on radius scale
        .attr("r", (d) => radiusScale(+d.number));
};

nbviz.callbacks.push(() => {
    let data = nbviz.getCountryData();
    updateMap(data);
});