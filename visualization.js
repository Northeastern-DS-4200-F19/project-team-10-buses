<!--  --!>

var selectedDataset = "CommuteTypes", //name of the selected dataset
  choroDataAttribute, //name of the selected data to display on the choropleth
  rawData, //raw data from csv
  pcoordData, //data to plot for parallel coordinates
  choroData, //data to plot for choropleth
  pcoordDimensions, //dimensions of drawingData
  choroDimensions,
  vis; //selected visualization

// function to initialize visualization
function init() {
  //select visualization holder
  vis = d3.select("vis-holder");

  d3.select("#data-selector")

  pcoords = parallelCoordinates();
  choro = choropleth();

  update();
}

// this redraws the graph based on the data in the drawingData variable
function redraw () {


}

// initialize the visualization
init ();


//------------------//
// Helper Functions //
//------------------//

// return the name of the dataset which is currently selected
function getSelectedDataset () {
// var select = document.getElementById("dataset");
// return select.options[select.selectedIndex].value;
  return "CommuteTypes";
}

// Update selectors for states from the linked map
function getStates(data) {
  //TODO
}

// Take raw data and perform aggregation based on selections
function processData(data) {
  //TODO
  return data;
}



// called every time a form field has changed
function update () {
  var dataset = getChosenDataset(), // filename of the chosen dataset csv
  processedData; // the data while will be visualised
  // if the dataset has changed from last time, load the new csv file
  if (dataset != selectedDataset) {
    d3.csv("data/2013_State" + dataset + ".csv", function (data) {
      // process new data and store it in the appropriate variables
      currentDataset = dataset;
      rawData = data;
      drawingData = processData(data);
      redraw();
    });
  } else {
    // process data based on the form fields and store it in the appropriate variables
    drawingData = processData(rawData);
    redraw();
  }
}
