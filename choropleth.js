function choropleth() {

  function build() {
    var svg = d3.select("#vis-svg-2"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var path = d3.geoPath();

    var chloropleth = d3.map();

    var x = d3.scaleLinear()
        .domain([0, 20, 40, 60, 80, 100])
        .rangeRound([600, 650]);

    var color = d3.scaleThreshold()
        .domain([0, 20, 40, 60, 80, 100])
        .range(d3.schemeBlues[6]);

    // schemeBlues can't handle more than 9 for some reason
    // var x = d3.scaleLinear()
    //     .domain([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    //     .rangeRound([600, 650]);

    // var color = d3.scaleThreshold()
    //     .domain([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    //     .range(d3.schemeBlues[10]);

    // Create element for legend
    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(0,40)");

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
  }

  function ready(error, us) {

    if (error) throw error;

    svg.append("g")
        .attr("class", "counties")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .enter().append("path")
        .attr("fill", function(d) {
          return color(d.ctvda = chloropleth.get(d.id));
        })
        .attr("d", path)
      .append("title") // Tooltip
        .text(function(d) { return d.ctvda + "%"; });

    // svg.append("path")
    //     .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    //     .attr("class", "states")
    //     .attr("d", path);
  }

  return build();
}
