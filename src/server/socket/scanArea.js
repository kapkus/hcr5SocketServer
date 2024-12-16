const { robotWaitForIdle, moveLinear, streamRobotPositions, sendLidarCommand, scanSetInitState } = require('../utility/robotContext');
const fs = require('fs');
const mongoClient = require('../mongo');

const beginScan = async (context, scan) => {
    const {commandModel, connections, robotModel} = context;
    const client = await mongoClient();

    const orientation = [180, 0, -90];
    const {zLevel, data} = scan;
    let currWaypoint = 0;
    const scanFileName = `lidar_scan_${Date.now()}.bin`;
    const outputFile = fs.createWriteStream(scanFileName);

    await client.collection('scan_metadata').insertOne({
        scanFileName,
        startTime: new Date(),
        currentWaypoint: 0,
        waypoints: data,
        isComplete: false,
    });

    context.scanState.scanFileName = scanFileName;
    context.scanState.isRunning = true;

    await sendLidarCommand('START_SCAN');

    for(const item of data) {
        if(!context.scanState.isRunning) break; 

        const position = {position: [item.x, item.y, zLevel], orientation: orientation}; 

        try {
            await moveLinear(position);
            await streamRobotPositions();
            const lidarPoints = await sendLidarCommand('GET_SAMPLE');
            const transformedPoints = transformLidarPoints(lidarPoints.response.data, position)

            transformedPoints.forEach((point) => {
                const buffer = Buffer.alloc(16); // 4 floats (4 bytes each)
                buffer.writeFloatLE(point.x, 0);
                buffer.writeFloatLE(point.y, 4);
                buffer.writeFloatLE(point.z, 8);
                buffer.writeFloatLE(point.reflection, 12);
                outputFile.write(buffer);
            });

            await robotWaitForIdle();

            currWaypoint++;
            context.scanState.currentWaypoint = currWaypoint;
        } catch (error) {
            console.error('Move failed:', error);
            break;
        }

        // console.debug(`waypoint ${currWaypoint} reached`);
    }

    await sendLidarCommand('STOP');

    await client.collection('scan_metadata').updateOne(
        { scanFileName },
        { $set: { isComplete: true, endTime: new Date() } }
    );
    outputFile.end();

    scanSetInitState();
}

const transformLidarPoints = (lidarData, position) => {
    return lidarData
        .map((point) => {
            const { angle, distance, quality } = point;

            if (distance > 0) {
                const angleRadians = (angle * Math.PI) / 180;

                const xLidar = distance * Math.cos(angleRadians);
                const yLidar = distance * Math.sin(angleRadians);
                const zLidar = 0;

                const [posX, posY, posZ] = position.position;
                const [, , yaw] = position.orientation;

                const xWorld = posX + (Math.cos(yaw * (Math.PI / 180)) * xLidar - Math.sin(yaw * (Math.PI / 180)) * yLidar);
                const yWorld = posY + (Math.sin(yaw * (Math.PI / 180)) * xLidar + Math.cos(yaw * (Math.PI / 180)) * yLidar);
                const zWorld = posZ + zLidar;

                return { x: xWorld, y: yWorld, z: zWorld, reflection: quality };
            }
            return null;
        })
        .filter((p) => p !== null);
}


module.exports = beginScan;



const delay = ms => new Promise(res => setTimeout(res, ms));
