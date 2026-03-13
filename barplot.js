const cars = d3.csv("cars.csv");

cars.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.price = +d.price;
    });

    // Define the dimensions and margins for the SVG
    const width = 800, height = 400;
    const margin = {top: 30, bottom: 50, left: 80, right: 50};

    // Create the dropdown filter
    const controls = d3.select("#barplot")
        .append("div")
        .style("margin-bottom", "10px");

    controls.append("label")
        .attr("for", "driveFilter")
        .text("Drive type: ");

    const driveOptions = ["both", ...new Set(data.map(d => d["drive-wheels"]))];

    const dropdown = controls.append("select")
        .attr("id", "driveFilter");

    dropdown.selectAll("option")
        .data(driveOptions)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.toUpperCase());

    // Create the SVG container
    const svg = d3.select("#barplot")
        .append('svg')
        .attr("width", width)
        .attr("height", height)
        .style('background', '#e9f7f2');

    const x0 = d3.scaleBand()
      .domain([...new Set(data.map(d => d["body-style"]))])
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain([...new Set(data.map(d => d["drive-wheels"]))])
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.price)])
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d["drive-wheels"]))])
      .range(["#1f77b4", "#ff7f0e"]);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("text-anchor", "middle");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .style("font-size", "12px");

    // create one container for all bars so we can update them
    const barsGroup = svg.append("g");

    // function to update bars based on dropdown selection
    function updateChart(selectedDrive) {
        let filteredData;

        if (selectedDrive === "both") {
            filteredData = data;
        } else {
            filteredData = data.filter(d => d["drive-wheels"] === selectedDrive);
        }

        const bars = barsGroup.selectAll("rect")
            .data(filteredData, d => d["body-style"] + "-" + d["drive-wheels"]);

        // add new bars and update existing ones
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("x", d => x0(d["body-style"]) + x1(d["drive-wheels"]))
            .attr("y", d => y(d.price))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - margin.bottom - y(d.price))
            .attr("fill", d => color(d["drive-wheels"]));

        // remove bars that no longer match filter
        bars.exit().remove();
    }

    // initial chart shows both drive types
    updateChart("both");

    // redraw chart when dropdown value changes
    dropdown.on("change", function() {
        updateChart(this.value);
    });

    const legend = svg.append("g")
      .attr("transform", `translate(${width - 70}, ${margin.top})`);

    const types = [...new Set(data.map(d => d["drive-wheels"]))];

    types.forEach((type, i) => {
      legend.append("rect")
          .attr("x", 0)
          .attr("y", i * 20)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color(type));

      legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 12)
          .text(type)
          .style("font-size", "12px")
          .attr("alignment-baseline", "middle");
    });

    // Add x-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - margin.top + 15)
      .style("text-anchor", "middle")
      .text("Body style");

    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", 0 - (height / 2))
      .attr("y", margin.left / 3)
      .style("text-anchor", "middle")
      .text("Price");
});