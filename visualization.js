// Parse survey data
d3.csv("/data/survey-data.csv").then(function (data) {
    tabulate(data, data.columns);
    createParallelCoordinates();
});

/**
 * Create D3 table and populate with survey data
 * 
 * @param {Object} data 
 * @param {Object} columns 
 */
function tabulate(data, columns) {
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
        .append('tr');

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

function createParallelCoordinates() {
    let data = [
        [0,-0,0,0,0,3 ],
        [1,-1,1,2,1,6 ],
        [2,-2,4,4,0.5,2],
        [3,-3,9,6,0.33,4],
        [4,-4,16,8,0.25,9]
    ];

    let pc = ParCoords()("#example")
        .data(data)
        .render()
        .createAxes();
}