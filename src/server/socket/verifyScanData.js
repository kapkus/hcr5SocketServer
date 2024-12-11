/**
 * Snake pattern
 * @param {*} data 
 */
const verifyScanData = (data) => {
    // Step 1: Group points by their y-coordinate (rows)
    const rows = {};
    data.forEach(point => {
        if (!rows[point.y]) rows[point.y] = [];
        rows[point.y].push(point);
    });

    // Step 2: Sort each row by x-coordinate
    const sortedRows = Object.values(rows).map(row => row.sort((a, b) => a.x - b.x));

    // Step 3: Snake through the rows
    const path = [];
    sortedRows.forEach((row, index) => {
        if (index % 2 === 0) {
            // Even rows: Traverse left-to-right
            path.push(...row);
        } else {
            // Odd rows: Traverse right-to-left
            path.push(...row.reverse());
        }
    });


    console.debug(path)

    return path; // Return the snaked path


}

module.exports = verifyScanData;