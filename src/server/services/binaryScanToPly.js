const fs = require('fs');

const voxelizePoints = (inputFile, voxelSize) => {
    const rawData = fs.readFileSync(inputFile);
    const voxelMap = new Map();

    // Read points from the binary file
    for (let i = 0; i < rawData.length; i += 16) {
        const x = rawData.readFloatLE(i);
        const y = rawData.readFloatLE(i + 4);
        const z = rawData.readFloatLE(i + 8);
        const reflection = rawData.readFloatLE(i + 12);

        // Map points to voxel grid
        const voxelX = Math.floor(x / voxelSize);
        const voxelY = Math.floor(y / voxelSize);
        const voxelZ = Math.floor(z / voxelSize);
        const voxelKey = `${voxelX},${voxelY},${voxelZ}`;

        // Aggregate reflection values (average for duplicates)
        if (!voxelMap.has(voxelKey)) {
            voxelMap.set(voxelKey, { x, y, z, reflection, count: 1 });
        } else {
            const voxel = voxelMap.get(voxelKey);
            voxel.reflection += reflection;
            voxel.count += 1;
        }
    }

    // Generate optimized points
    const optimizedPoints = [];
    for (const [key, voxel] of voxelMap.entries()) {
        optimizedPoints.push({
            x: voxel.x,
            y: voxel.y,
            z: voxel.z,
            reflection: voxel.reflection / voxel.count,
        });
    }

    console.log(`Voxelization complete. ${optimizedPoints.length} unique voxels created.`);
    return optimizedPoints;
};

// Write PLY File
const writePLYFile = (points, plyOutputFile) => {
    // PLY header
    const plyHeader = `ply
format ascii 1.0
element vertex ${points.length}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
`;

    const plyContent = points.map((point) => {
        // Map reflection to RGB intensity (0-255)
        const intensity = Math.min(255, Math.max(0, Math.floor(point.reflection * 255)));
        return `${point.x} ${point.y} ${point.z} ${intensity} ${intensity} ${intensity}`;
    }).join('\n');

    const plyData = plyHeader + plyContent;

    // Write to the output file
    fs.writeFileSync(plyOutputFile, plyData, 'utf8');

    console.log(`PLY file written to ${plyOutputFile}. You can open this in Blender.`);
};


const binaryScanToPly = (inputFile, plyOutputFile, voxelSize) => {
    // Step 1: Voxelize the points
    console.log('Starting voxelization...');
    const optimizedPoints = voxelizePoints(inputFile, voxelSize);

    // Step 2: Export to PLY for visualization
    console.log('Exporting to PLY...');
    writePLYFile(optimizedPoints, plyOutputFile);

    console.log('Processing complete.');
};


module.exports = binaryScanToPly;