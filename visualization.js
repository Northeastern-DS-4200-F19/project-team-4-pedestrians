let neu = {
    title: "Park side heading towards Huntington Ave.",
    color: "#0088FF",
    icon: "<svg width='50px' height='25px' aria-hidden=\"true\" focusable=\"false\"><use xlink:href=\"./images/icons.svg#neu\"></use></svg>"
};

let bmc = {
    title: "Park side heading towards Boston Med. Center",
    color: "#f678a7",
    icon: "<svg width='50px' height='25px' aria-hidden=\"true\" focusable=\"false\"><use xlink:href=\"./images/icons.svg#bmc\"></use></svg>"
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

let pathElements = Array.from(document.querySelectorAll('path, rect'));

// add event listeners
pathElements.forEach(function(el) {
    if (el.id && el.id.includes('map_')) {
        el.addEventListener("mouseover", function() {
            highlightPath(el.id);
        })
        el.addEventListener("mouseout", function() {
            unhighlightPath(el.id);
        })
    }
})

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
        .attr("height", 400)
        .append("xhtml:body")
        .append("table")
        .attr("id", "fo-table");
    let thead = table.append("thead");
    let tbodyForDeselected = table.append("tbody")
        .attr("id", "tbodyForDeselected");
    let tableSeparator = table.append("div").attr("id", "tbodySeparator");
    tableSeparator.append("h6").attr("id", "seperatorHeader");
    table.append("tbody").attr("id", "tbodyForSelected");
    d3.select("#seperatorHeader").html("Selected Responses");
    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .attr("style", "font-size:12px",)
        .text(function (column) {
            return column
        });

    let rows = tbodyForDeselected.selectAll('tr')
        .data(data)
        .enter()
        .append('tr')
        .on('click', tableRowOnClick);

    let cells = rows.selectAll('td')
        .data(function (row) {
            let result = [];
            if (row[columns[0]] === neu.title) {
                result.push({
                    column: columns[0],
                    value: neu.icon
                })
            } else {
                result.push({
                    column: columns[0],
                    value: bmc.icon
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

    if (selectedRow.classed('selected')) {
        // TODO: remove selectedRow (which is stored as a coppy in tbodyForSelected) from tbodyForSelected
        d3.select('#tbodyForDeselected').node().append(selectedRow.node());
       
    } else {
        d3.select('#tbodyForSelected').node().append(selectedRow.node());
        // Uncomment below to not remove from selectable list and comment out above line

        // Node must be cloned to avoid moving it on the DOM
        // Node must be cloned in separate line of retrieval
        // let selectedRowNode = selectedRow.node();
        // let selectedRowNodeClone = selectedRowNode.cloneNode(true);
        // d3.select('#tbodyForSelected').node().append(selectedRowNodeClone);
    }
    selectedRow.classed('selected', !selectedRow.classed('selected'));
    highlightSelectedRows();
}

function highlightSelectedRows() {
    let deselectedRows = [];
    let selectedRows = [];
    d3.select('#tbodyForDeselected').selectAll('tr').select(function (d) {
        deselectedRows.push(d)
    });
    d3.select('#tbodyForSelected').selectAll('tr').select(function (d) {
        selectedRows.push(d)
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
    console.log(deselectedRows);
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

function highlightPath(path) {
    let mapId = '#' + path;
    let congestion = mapData[path.charAt(path.length-1)];
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
}

function unhighlightPath(path) {
    let mapId = '#' + path;
    d3.select(mapId).attr("fill", 'white');
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

function moveBrushedToSelectedTableBody(brushed) {

}

/**
 * Create ParallelCoordinate Table using d3.parcoords
 * @param {Object} data
 * @param {Object} coordinates
 */
function createParallelCoordinates(data, coordinates) {
    let config = {
        tickValues: ['A', 'B', 'C', 'D', 'H', 'G', 'F', 'E'],
        lineWidth: 2
    };
    let pc = ParCoords(config)("#parcoords-holder");
    pc.data(data)
        .hideAxis([coordinates[0]])
        .color(d => {
            let sideOfRes = d[coordinates[0]];
            if (sideOfRes === neu.title) {
                return neu.color
            } else {
                return bmc.color
            }
        })
        .render()
        .createAxes()
        .shadows()
        .brushMode('1D-axes')
        .on('brush', function (data) {
            moveBrushedToSelectedTableBody(data)
        });

    return pc;
}