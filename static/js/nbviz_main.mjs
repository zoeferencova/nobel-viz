import nbviz from './nbviz_core.mjs'
import { initMenu } from './nbviz_menu.mjs'
import { initMap } from './nbviz_map.mjs'
import './nbviz_bar.mjs'
import './nbviz_details.mjs'
import './nbviz_time.mjs'

// Use CSV and JSON helper functions to load data and convert to JS obj/arr
// Promise.all method fires off data fetches simultaneously, waits for all 
// to be resolved, and delivers data to specified handler function (ready)
Promise.all([
    d3.json('static/data/world-110m.json'),
    d3.csv('static/data/world-country-names-nobel.csv'),
    d3.json('static/data/winning_country_data.json'),
    d3.json('static/data/nobel_winners_biopic.json'),
]).then(ready)

// Run if data is downloaded without error
function ready([worldMap, countryNames, countryData, winnersData]) {
    // Store country-data dataset
    nbviz.data.countryData = countryData
    nbviz.data.winnersData = winnersData
    // Uses loaded NP dataset to create filter for user to 
    // select subsets of data to visualize
    nbviz.makeFilterAndDimensions(winnersData)
    // Initialize menu and map
    initMenu()
    initMap(worldMap, countryNames)
    // Trigger update with full winners' dataset
    nbviz.onDataChange()
}