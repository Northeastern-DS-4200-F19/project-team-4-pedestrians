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

let tooltipModel = {};

let tooltipDiv = d3.select("#map-holder").append("div")
    .attr("id", "tooltip")
    .style("display", "none");

// Init ParCoords globally
let pc;

/**
 * Add event listeners to map paths
 */
let pathElements = Array.from(document.querySelectorAll('path, rect'));
pathElements.forEach(function (el) {
    if (el.id && el.id.includes('map_')) {
        el.addEventListener("mouseover", function () {
            hoverPath(el.id);
        });
        el.addEventListener("mouseout", function () {
            unhoverPath(el.id);
        });
        el.addEventListener("mousemove", function () {
            hoverPathMousemove(event, el.id);
        });
    }
});

let selectedRows = [];

/**
 * Create parallel coordinate chart and table with CSV data
 */
d3.csv("./data/survey-data.csv").then(function (data) {
    pc = createParallelCoordinates(data, data.columns);
    createTable(data, data.columns);
});

/**
 * Read detail-on-demand data and populate model
 */
d3.csv("./data/demand-data.csv").then(function (data) {
    populateTooltipModel(data);
});

/**
 * Populate tooltip object with CSV data
 * @param {Object} data 
 */
function populateTooltipModel(data) {
    tooltipModel.map_a = data[0];
    tooltipModel.map_b = data[1];
    tooltipModel.map_c = data[2];
    tooltipModel.map_d = data[3];
    tooltipModel.map_e = data[4];
    tooltipModel.map_f = data[5];
    tooltipModel.map_g = data[6];
    tooltipModel.map_h = data[7];;
}

/**
 * Creates a table and appends to SVG
 * @param {Object} data
 * @param {Object} columns
 */
function createTable(data, columns) {
    const columnsCopy = [...columns];
    const idIndex = columnsCopy.indexOf("id");
    if (idIndex > -1) {
        columnsCopy.splice(idIndex, 1);
    }
    let svg = d3.select("#vis-svg");
    let table = svg.append("foreignObject")
        .attr("width", 700)
        .attr("height", 400)
        .append("xhtml:body")
        .append("table")
        .attr("id", "fo-table");
    let thead = table.append("thead");
    let tbodyForMasterList = table.append("tbody")
        .attr("id", "tbodyForMasterList");
    let tableSeparator = table.append("div").attr("id", "tbodySeparator");
    tableSeparator.append("h6").attr("id", "seperatorHeader");
    table.append("tbody").attr("id", "tbodyForSelected");
    d3.select("#seperatorHeader").html("Selected Responses");
    thead.append('tr')
        .selectAll('th')
        .data(columnsCopy)
        .enter()
        .append('th')
        .text(function (column) {
            return column
        });

    renderTableRows("#tbodyForMasterList", data);
    tbodyForMasterList.selectAll('tr')
        .on('click', masterListRowOnClick);
    return table;
}

function masterListRowOnClick(data) {
    let selectedRow = d3.select(this);
    if (selectedRow.classed('selected')) {

    } else {
        selectedRows.push(data);
        removeAllRowsFromTable("#tbodyForSelected");
        renderTableRows("#tbodyForSelected", selectedRows);
        d3.select("#tbodyForSelected").selectAll('tr').on('click', selectedRowOnClick);
        selectedRow.classed('selected', true);
    }
    // the selected attribute will be removed only when it is deselected from the selected region
    // selectedRow.classed('selected', !selectedRow.classed('selected'));
    highlightSelectedRows();
}

function selectedRowOnClick(data) {
    d3.select(this).remove();
    const toRemove = new Set([data.id]);
    selectedRows = selectedRows.filter(obj => !toRemove.has(obj.id));
    updateMasterListSelection();
    highlightSelectedRows()
}

function updateMasterListSelection() {
    let selectedSet = new Set(selectedRows.map(obj => obj.id));
    console.log(selectedSet);
    d3.select('#tbodyForMasterList')
        .selectAll('tr')
        .classed('selected', function (data) {
            return selectedSet.has(data.id);
        });
}

function highlightSelectedRows() {
    let deselectedRows = [];
    let selectedRows = [];
    d3.select('#tbodyForMasterList').selectAll('tr').select(function (d) {
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
        let congestionColor = getCongestionColor(congestion);
        d3.select(mapId).attr("fill", congestionColor);
    });
}

/**
 * Unhighlights the selected paths
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
 * Highlight path on hover if no responses are selected, and display
 * data on demand tooltip
 * @param {String} path
 */
function hoverPath(path) {

    tooltipDiv.style("display", "inline");

    // if something highlighted in table, disable map highlight
    let selectedPaths = d3.select('#tbodyForSelected').node();
    if (selectedPaths.childElementCount > 0) return;
    let mapId = '#' + path;
    let congestion = mapData[path.charAt(path.length - 1)];
    let congestionColor = getCongestionColor(congestion);
    d3.select(mapId).attr("fill", congestionColor);
}

/**
 * Un-Highlight path on hover if no responses are selected, and hide
 * data on demand tooltip
 * @param {String} path
 */
function unhoverPath(path) {
    tooltipDiv.style("display", "none");

    // If something highlighted in table, disable map highlight
    let selectedPaths = d3.select('#tbodyForSelected').node();
    if (selectedPaths.childElementCount > 0) return;

    let mapId = '#' + path;
    d3.select(mapId).attr("fill", 'white');
}

/**
 * On moving mouse on path, move tooltip, display details
 * @param {MouseEvent} event
 */
function hoverPathMousemove(event, id) {
    if (tooltipModel[id]) {

        let pathData = tooltipModel[id];
        tooltipDiv
            .text('Path ' + pathData['Path'])
            .style("left", event.clientX + 15 + "px")
            .style("top", event.clientY + 750 + "px");

        let tooltipData1 = tooltipDiv.append("p")
            .attr("id", "tooltip-data-1")
            .text('Level of Congestion: ' + pathData['Level of Congestion']);

        let tooltipData2 = tooltipData1.append("p")
            .attr("id", "tooltip-tooltipData1-2")
            .text('Total Pedestrians: ' + pathData['Total Number of Pedestrians']);

        let tooltipData3 = tooltipData2.append("p")
            .attr("id", "tooltip-data-3")
            .text('Average (People/Hour): ' + pathData['Average (People/Hour)']);


        let tooltipData4 = tooltipData3.append("p")
            .attr("id", "tooltip-data-4")
            .text('Most Preferable: ' + pathData['Most Preferable']);


        let tooltipData5 = tooltipData4.append("p")
            .attr("id", "tooltip-data-5")
            .text('Least Preferable: ' + pathData['Least Preferable']);
    }
}

/**
 * Returns appropriate color representing congestion
 * @param {String} congestion
 */
function getCongestionColor(congestion) {
    let congestionColor = 'white';
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
    return congestionColor;
}

/**
 * Format a single resident response object to a list of objects.
 * Each object of the list has column and value properties.
 * The "Side of Residency" entry is handled explicitly because we
 * want to replace text with an svg icon.
 * @param response is a resident response object
 * @returns [] a list of objects where each object has column and value properties
 */
function residentResponseDataProcessing(response) {
    let sideOfRes = "Side of Residency";
    let id = "id";
    let excludeColumns = new Set([sideOfRes, id]);
    let result = [];
    if (response[sideOfRes] === neu.title) {
        result.push({
            column: response[sideOfRes],
            value: neu.icon
        })
    } else {
        result.push({
            column: response[sideOfRes],
            value: bmc.icon
        })
    }
    for (let [key, value] of Object.entries(response)) {
        if (!(excludeColumns.has(key))) {
            result.push({ column: key, value: response[key] })
        }
    }
    return result;
}

/**
 * Append data to the end of the table. The table can be identified through its id.
 * The data is default to be formatted using the residentResponseDataProcessing function.
 * @param tableId is the target table's id
 * @param data is a list of objects
 * @param rowDataFormatter
 */
function renderTableRows(tableId, data, rowDataFormatter = residentResponseDataProcessing) {
    d3.select(tableId).selectAll('tr')
        .data(data)
        .enter()
        .append('tr')
        .selectAll('td')
        .data(response => rowDataFormatter(response))
        .enter()
        .append('td')
        .html(function (d) {
            return d.value;
        });
}

/**
 * Remove all rows from the target table. The table can be identified through its id.
 * @param tableId the id of the table in html
 */
function removeAllRowsFromTable(tableId) {
    d3.select(tableId).selectAll('tr').remove();
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
        .hideAxis([coordinates[0], coordinates[5]]) // hide the side of residency and id columns
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
        .brushMode('1D-axes')
        .on('brushend', function (brushed) {
            if (brushed.length !== data.length) {
                removeAllRowsFromTable('#tbodyForSelected');
                renderTableRows('#tbodyForSelected', brushed)
            } else {
                removeAllRowsFromTable('#tbodyForSelected');
            }
        });

    return pc;
}

