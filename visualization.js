// set the dimensions and margins of the graph
const margin = { top: 50, right: 10, bottom: 10, left: 0 },
  width = 1500 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

//select dataset
let e = document.getElementById("datasetselector");
let datavalue = e.options[e.selectedIndex].value;
let datatext = e.options[e.selectedIndex].text;
let datapath = "data/" + datavalue + ".csv";
draw(datapath);

function draw(datapath) {
  // append the svg object to the body of the page
  let svg = d3.select("#vis-svg").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

  let parallelCoordinates = svg.append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")
    .attr("id", "parallelCoordinates");

  //add title to Parallel Coordinates
  parallelCoordinates.append("text")
    .attr("id", "pc-title")
    .attr("x", (width / 5))
    .attr("y", 0 - (margin.top / 2))
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text(datatext);


  //add indication that axis are clickable 
  parallelCoordinates.append("text")
    .attr("id", "indication")
    .attr("x", 0)
    .attr("y", -27)
    .style("font-size", "10px")
    .text("*Click on the axis to render the chloropleth");

  drawparallelCoordinates(datapath)
  // Parse the Data and draw parallelCoordinates
  function drawparallelCoordinates(datapath) {
    d3.csv(datapath, function (data) {

      // Extract the list of dimensions we want to keep in the plot. 
      if (datatext == "Commute Types") {
        dimensions = d3.keys(data[0]).filter(function (d) { return d != "State" && d != "Numbers of workers" && d != "id" })//&& d != "Time (minutes)"})
      } else if (datatext == "Motor Bus Transit Route Milage") {
        dimensions = d3.keys(data[0]).filter(function (d) { return d != "State" && d != "state_code" && d != "id" })
      } else if (datatext == "Urban Transit Riderships") {
        dimensions = d3.keys(data[0]).filter(function (d) { return d != "state_code" && d != "State" && d != "id" && d != "Agencies" })
      }
      // For each dimension, I build a linear scale. I store all in a y object
      let y = {}
      for (i in dimensions) {
        name = dimensions[i]
        console.log(name);
        y[name] = d3.scaleLinear()
          .domain(d3.extent(data, function (d) { return +d[name]; }))
          .range([height, 0])
      }

      // Build the X scale -> it find the best position for each Y axis
      x = d3.scalePoint()
        .range([0, width / 2])
        .padding(1)
        .domain(dimensions);

      // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
      function path(d) {
        return d3.line()(dimensions.map(function (p) { return [x(p), y[p](d[p])]; }));
      }

      // Draw the lines
      parallelCoordinates
        .selectAll("myPath")
        .data(data)
        .enter().append("path")
          .attr("d", path)
          .style("fill", "none")
          .style("stroke", "#222222")
          .style("opacity", 0.5)
          .on('mouseover', onMouseover)
          .on('mouseout', onMouseout);

      // Draw the axis:
      parallelCoordinates.selectAll("myAxis")
        // For each dimension of the dataset I add a 'g' element:
        .data(dimensions).enter()
        .append("g")
          // I translate this element to its right position on the x axis
          .attr("transform", function (d) { return "translate(" + x(d) + ")"; })
          // And I build the axis with the call function
          .each(function (d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
          // Add axis title
          .append("text")
          .style("text-anchor", "middle")
          .attr("y", -3)
          .text(function (d) { return d; })
          .style("fill", "black")
          .on("mouseover", function () { d3.select(this).style("cursor", "pointer") })
          .on("mouseout", function () { d3.select(this).style("cursor", "default") })
          .on("click", function (d) {
            valueArray = [];
            renderChoropleth(d);
          })
    })
  }
  /*** Choropleth ******************************************************************/

  const path = d3.geoPath();

  const chloropleth = d3.map();
  let valueArray = [];
  const stateNames = d3.map();

  let choroplethSVG = svg.append("g")
    .attr("transform", "translate(500,30)")
    .attr("id", "choropleth");

  //add title to chloropleth
  let title = choroplethSVG
    .append("g")
      .attr("id", "c-title")
    .append("text")
      .attr("x", (width / 3))
      .attr("y", -10)
      .style("font-size", "20px")


  function renderChoropleth(column) {
    console.log(column)
    d3.queue()
      .defer(d3.json, "https://d3js.org/us-10m.v1.json")
      .defer(d3.csv, datapath, function (d) {
        chloropleth.set(d.id, +d[column]);
        valueArray.push(+d[column]);
        chloropleth.set("colName", column);
        stateNames.set(d.id, d.State);
      })
      .await(ready);
  }

  function ready(error, us, column) {
    if (error) throw error;

    d3.selectAll(".key > *").remove();

    let max = Math.ceil(d3.max(valueArray));
    let min = Math.floor(d3.min(valueArray));
    let fraction = (max - min) / 5;
    let domainArray = [min,
      Math.ceil(min + fraction),
      Math.ceil(min + fraction * 2),
      Math.ceil(min + fraction * 3),
      Math.ceil(min + fraction * 4),
      max
    ];

    let x = d3.scaleLinear()
      .domain(domainArray)
      .rangeRound([475, 550]);

    let color = d3.scaleThreshold()
      .domain(domainArray)
      .range(d3.schemeBlues[6]);

    // Create element for legend
    let key = choroplethSVG.append("g")
      .attr("class", "key")
      .attr("transform", "translate(0,40)")

    // Legend color scale
    key.selectAll("rect")
      .data(color.range().map(function (d) {
        d = color.invertExtent(d);
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
      }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function (d) { return x(d[0]); })
        .attr("width", function (d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function (d) { return color(d[0]); });

    key.append("text")
      .attr("class", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(chloropleth.get("colName"));

    title.text("Choropleth map on " + chloropleth.get("colName"))
      .style("font-weight", "bold");

    // Legend markings - 2%, 3%, etc.
    key.call(d3.axisBottom(x)
      .tickSize(13)
      .tickFormat(function (x, i) { return x; })
      .tickValues(color.domain()))
      .select(".domain")
      .remove();

    choroplethSVG.append("g")
        .attr("class", "counties")
        .attr("transform", "scale(0.8, 0.8) translate(250, 50)")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .enter().append("path")
        .attr("fill", function (d) {
          return color(d[column] = chloropleth.get(d.id));
        })
        .attr("stroke", "#ffffff")
        .attr("d", path)
        .on('mouseover', onMouseover)
        .on('mouseout', onMouseout)
      .append("title") // Tooltip
      .text(function (d) { return stateNames.get(d.id) + " " + d[column]; })
  }

  if (datatext == "Commute Types") {
    renderChoropleth("Drove %");
  } else if (datatext == "Motor Bus Transit Route Milage") {
    renderChoropleth("Exclusive Directional Route-Miles");
  } else if (datatext == "Urban Transit Riderships") {
    renderChoropleth("Bus %");
  }

  function onMouseover(elemData) {

    parallelCoordinates.selectAll("path")
      .select(function (d) {
        if (d != null) {
          return d.id === elemData.id ? this : null;
        }
      })
        .style('stroke', '#ff0000')
        .style('stroke-width', '5')

    choroplethSVG.selectAll("path")
      .select(function (d) {
        if (d != null) {
          return d.id === elemData.id ? this : null;
        }
      })
        .style('stroke', '#ff0000')
        .style('stroke-width', '5')
  }

  function onMouseout(elemData) {

    parallelCoordinates.selectAll("path")
      .select(function (d) {
        if (d != null) {
          return d.id === elemData.id ? this : null;
        }
      })
        .style('stroke', '#111111')
        .style('stroke-width', '1')

    choroplethSVG.selectAll("path")
      .select(function (d) {
        if (d != null) {
          return d.id === elemData.id ? this : null;
        }
      })
        .style('stroke', '#ffffff')
        .style('stroke-width', '1')
  }
}

//************************************change dataset**************************************
d3.select("#datasetselector")
  .on("change", function (d) {
    e = document.getElementById("datasetselector");
    data = e.options[e.selectedIndex].value;
    datatext = e.options[e.selectedIndex].text;
    datapath = "data/" + data + ".csv";
    update();
  })

function update() {
  d3.select("#vis-svg").html("");
  draw(datapath);
}
