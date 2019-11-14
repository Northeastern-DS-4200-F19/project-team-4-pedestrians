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

let mapData = {
    a: "medium",
    b: "low",
    c: "medium",
    d: "high",
    e: "medium",
    f: "low",
    g: "low",
    h: "high"
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
        .attr("height", 300)
        .append("xhtml:body")
        .append("table")
        .attr("id", "fo-table");
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
        .on('click', tableRowOnClick);

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

function tableRowOnClick() {
    let selectedRow = d3.select(this);
    selectedRow.classed('selected', !selectedRow.classed('selected'));
    highlightSelectedRows();
}

function highlightSelectedRows() {
    let deselectedRows = [];
    let selectedRows = [];
    d3.select('tbody').selectAll('tr').select(function (d) {
        if (d3.select(this).classed('selected')) {
            selectedRows.push(d)
        } else {
            deselectedRows.push(d)
        }
    });
    if (selectedRows.length !== 0) {
        pc.highlight(selectedRows);
    } else {
        pc.unhighlight();
    }
    deselectedRows.forEach(function (d) {
        unhighlightPaths(d);
    });
    selectedRows.forEach(function (d) {
        highlightPaths(d);
    });
}

function collectPathsOnly(data) {
    let paths = [];
    for (let [key, value] of Object.entries(data)) {
        if (key !== 'Side of Residency') {
            paths.push(value)
        }
    }
    return paths;
}

/**
 * Highlights the selected paths on the map
 * @param {Object} data
 */
function highlightPaths(data) {
    let paths = collectPathsOnly(data);
    paths.forEach(function (path) {
        let pathId = path.toLowerCase();
        let mapId = '#map_' + pathId;
        let congestion = mapData[pathId];
        let congestionColor;

        switch (congestion) {
            case 'low':
                congestionColor = '#d9d9d9';
                break;
            case 'medium':
                congestionColor = '#a6a6a6';
                break;
            case 'high':
                congestionColor = '#595959';
                break;
            default:
        }
        d3.select(mapId).attr("fill", congestionColor);
    });
}

/**
 * Unhighlights the selected path
 * @param {Object} data
 */
function unhighlightPaths(data) {
    let paths = collectPathsOnly(data);
    paths.forEach(function (path) {
        let pathId = path.toLowerCase();
        let mapId = '#map_' + pathId;
        d3.select(mapId).attr("fill", 'white');
    });
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
    let pc = ParCoords(config)("#parcoords-holder");
    pc.data(data)
        .dimensions(dimensions)
        .hideAxis([coordinates[0]])
        .color(d => {
            let sideOfRes = d[coordinates[0]];
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