let bmc = {
    title: "Park side heading towards Boston Med. Center",
    color: "rgb(0,151,255)"
};
let neu = {
    title: "Park side heading towards Huntington Ave.",
    color: "rgb(255,151,0)"
};

// Parse survey data
d3.csv("./data/survey-data.csv").then(function (data) {
    let pc = createParallelCoordinates(data, data.columns);
    createTable(data, data.columns, pc);
});


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
        .on("mouseover", d => {
            pc.highlight([d]);
        })
        .on("mouseout", d => {
            pc.unhighlight([d]);
        });

    let cells = rows.selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]}
            })
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