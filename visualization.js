let bmc = {
    title: "Park side heading towards Boston Med. Center",
    color: "rgb(0,151,255)",
    icon: "<svg width='50px' height='25px' aria-hidden=\"true\" focusable=\"false\"><use xlink:href=\"./images/icons.svg#bmc\"></use></svg>"
};
let neu = {
    title: "Park side heading towards Huntington Ave.",
    color: "rgb(255,151,0)",
    icon: "<svg width='50px' height='25px' aria-hidden=\"true\" focusable=\"false\"><use xlink:href=\"./images/icons.svg#neu\"></use></svg>"
};


// Init ParCoords globally
let pc;

// Parse survey data
d3.csv("./data/survey-data.csv").then(function (data) {
    pc = createParallelCoordinates(data, data.columns);
    createTable(data, data.columns, pc);
});

/**
 * Creates a table and appends to SVG
 * @param {Object} data
 * @param {Object} columns
 * @param {ParCoords} pc
 */
function createTable(data, columns, pc) {
    let svg = d3.select("#vis-svg");
    let table = svg.append("foreignObject")
        .attr("width", 800)
        .attr("height", '100%')
        .append("xhtml:body");
    let thead = table.append("thead");
    let tbody = table.append("tbody");

    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .attr("style", "font-size:12px",)
        .text(function (column) {
            return column
        });

    let rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr')
        .on("mouseover", trMouseOver)
        .on("mouseout", trMouseOut);

    let cells = rows.selectAll('td')
        .data(function (row) {
            let result = [];
            if (row[columns[0]] === bmc.title) {
                result.push({
                    column: columns[0],
                    value: bmc.icon
                })
            } else {
                result.push({
                    column: columns[0],
                    value: neu.icon
                })
            }
            for (let i = 1; i < columns.length; i++) {
                result.push({column: columns[i], value: row[columns[i]]})
            }
            return result;
        })
        .enter()
        .append('td')
        .style('text-align', 'center')
        .style('font-size', '12px')
        .html(function (d) {
            return d.value;
        });

    return table;
}

/**
 * Called on TR mouseover
 * @param {Object} d - table row data
 */
function trMouseOver(d) {
    pc.highlight([d]);
    d3.select(this).style("background-color", "#d3d3d3");
}

/**
 * Called on TR mouseoff
 * @param {Object} d - table row data
 */
function trMouseOut(d) {
    pc.unhighlight([d]);
    d3.select(this).style("background-color", "transparent");
}

/**
 * Create ParallelCoordinate Table using d3.parcoords
 * @param {Object} data
 * @param {Object} coordinates
 */
function createParallelCoordinates(data, coordinates) {
    // Data cleanup
    let dimensions = {
        "Pref. Path (rush)": {},
        "Pref. Path (not rush)": {},
        "Most Pref. Path (in general)": {},
        "Least Pref. Path (in general)": {}
    };

    let config = {
        tickValues: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        lineWidth: 2
    };
    let pc = ParCoords(config)("#parcoords-vis");
    pc.data(data)
        .dimensions(dimensions)
        .hideAxis([coordinates[0]])
        .color(d => {
            let sideOfRes = d["Side of Residency"];
            if (sideOfRes === bmc.title) {
                return bmc.color
            } else {
                return neu.color
            }

        })
        .render()
        .createAxes()
        .shadows()
        .reorderable()
        .brushMode('1D-axes');

    return pc;
}