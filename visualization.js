// set the dimensions and margins of the graph
var margin = {top: 30, right: 10, bottom: 10, left: 0},
  width = 1500 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#vis-svg").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)

var parallelCoordinates = svg.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("data/2013_StateCommuteTypes.csv", function(data) {

  // Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
  dimensions = d3.keys(data[0]).filter(function(d) { return d != "State" })

  // For each dimension, I build a linear scale. I store all in a y object
  var y = {}
  for (i in dimensions) {
    name = dimensions[i]
    y[name] = d3.scaleLinear()
      .domain( d3.extent(data, function(d) { return +d[name]; }) )
      .range([height, 0])
  }

  // Build the X scale -> it find the best position for each Y axis
  x = d3.scalePoint()
    .range([0, width/2])
    .padding(1)
    .domain(dimensions);

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function path(d) {
      return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  // Draw the lines
  parallelCoordinates
    .selectAll("myPath")
    .data(data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

  // Draw the axis:
  parallelCoordinates.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
    // Add axis title
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d; })
      .style("fill", "black")

})

/*** Choropleth ******************************************************************/

var path = d3.geoPath();

var chloropleth = d3.map();

var x = d3.scaleLinear()
    .domain([0, 20, 40, 60, 80, 100])
    .rangeRound([600, 650]);

var color = d3.scaleThreshold()
    .domain([0, 20, 40, 60, 80, 100])
    .range(d3.schemeBlues[6]);

console.log("whats up")

var choroplethSVG = svg.append("g").attr("transform", "translate(500,30)");

// Create element for legend
var g = choroplethSVG.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)")

// Legend color scale
g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Car, Truck, or Van - Drove Alone");

// Legend markings - 2%, 3%, etc.
g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickFormat(function(x, i) { return i ? x : x + "%"; })
    .tickValues(color.domain()))
  .select(".domain")
    .remove();

d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.csv, "data/2013_StateCommuteTypes.csv", function(d) { chloropleth.set(d.id, +d.ctvda) })
    .await(ready);

function ready(error, us) {

  if (error) throw error;

  choroplethSVG.append("g")
      .attr("class", "counties")
      .attr("transform", "scale(0.8, 0.8) translate(250, 50)")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
      .attr("fill", function(d) {
        return color(d.ctvda = chloropleth.get(d.id));
      })
      .attr("d", path)
    .append("title") // Tooltip
      .text(function(d) { return d.ctvda + "%";});
}