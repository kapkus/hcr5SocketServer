const { robotWaitForIdle, moveLinear, streamRobotPositions, sendLidarCommand, scanSetInitState, moveToScanWaypoint } = require('../utility/robotContext');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const mongoClient = require('../mongo');

const beginScan = async (context, scan) => {
    const {commandModel, connections, robotModel} = context;
    const client = await mongoClient();

    const activeTcp = context.robotModel.getActiveTcp();
    const tcpPos = activeTcp.getPosition();
    const tcpOrientation = activeTcp.getOrientation();

    const orientations = [
        [180, 0, -90], // vertical scanning
        [180, 0, 0] // horizontal scanning
    ];
    const {zLevel, data} = scan;
    let currWaypoint = 0;
    const scanFileName = `lidar_scan_${Date.now()}`;
    const outputFile = fs.createWriteStream(
        path.join(config.scansDir, `${scanFileName}.bin`)
    );

    console.debug(outputFile);

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

    for(const orientation of orientations) {
        for(const item of data) {
            if(!context.scanState.isRunning) break; 

            const tcp = context.robotModel.getActiveTcp();
            console.debug('tcpOr', tcp.getOrientation());
            console.debug('tcpPos', tcp.getPosition());
            try {
                const position = {
                    position: calculatePosition(item, tcpPos, zLevel, orientation),
                    orientation: orientation
                }; 
                
                console.debug(position)

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
    }
    

    await sendLidarCommand('STOP');

    await client.collection('scan_metadata').updateOne(
        { scanFileName },
        { $set: { isComplete: true, endTime: new Date() } }
    );
    outputFile.end();

    scanSetInitState();
}

const calculatePosition = (item, tcpPos, zLevel, orientation) => {
    switch (orientation.toString()) {
        case '180,0,-90':
            return [item.x, item.y + tcpPos.x, zLevel + tcpPos.z];
        case '180,0,0':
            return [item.x - tcpPos.x, item.y, zLevel + tcpPos.z];
        default:
            throw new Error(`Unsupported orientation: ${orientation}`);
    }
};

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
