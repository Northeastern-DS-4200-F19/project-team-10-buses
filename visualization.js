// set the dimensions and margins of the graph
var margin = {top: 30, right: 10, bottom: 10, left: 0},
  width = 1500 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom,
  selectedDataset = "CommuteTypes", //name of the selected dataset
  rawData, //raw data from csv
  drawingData, //data to plot
  dimensions, //dimensions of drawingData
  vis; //selected visualization

// function to initialize visualization
function init() {
  vis = d3.select("#vis-svg")

  // append the svg object to the body of the page
  vis.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  update();
}

// this redraws the graph based on the data in the drawingData variable
function redraw () {
  // Extract the non-id dimensions
  dimensions = d3.keys(drawingData[0]).filter(function(d) { return d != "State" })

  // For each dimension, build a linear scale. Store all in a y object
  var y = {}
  for (i in dimensions) {
    name = dimensions[i]
    y[name] = d3.scaleLinear()
      .domain( d3.extent(drawingData, function(d) { return +d[name]; }) )
      .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  var x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);

  // Take a row of the csv as input
  // Return x and y coordinates of the line to draw for this row
  function path(d) {
    return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  // Draw the lines
  vis.selectAll("myPath")
  .data(drawingData)
  .enter().append("path")
  .attr("d",  path)
  .style("fill", "none")
  .style("stroke", "#69b3a2")
  .style("opacity", 0.5)

  // Draw the axis:
  vis.selectAll("myAxis")
  // For each dimension of the dataset add a 'g' element:
  .data(dimensions).enter()
  .append("g")
  // Translate this element to its right position on the x axis
  .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
  // Build the axis with the call function
  .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
  // Add axis title
  .append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(function(d) { return d; })
    .style("fill", "black")

}

// initialize the visualization
init ();


//------------------//
// Helper Functions //
//------------------//

// return the name of the dataset which is currently selected
function getChosenDataset () {
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
