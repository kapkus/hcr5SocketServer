// const { robotWaitForIdle, test} = require('./wsServer');
// const systemState = require('../utility/systemState');
const { robotWaitForIdle, moveLinear, streamRobotPositions, performLidarScan } = require('../utility/robotContext');

const beginScan = async (context, scan) => {
    const {commandModel, connections, robotModel} = context;
    // test();

    // const streamRobotPositions = () => {
    //     return new Promise((resolve) => {
    //         const interval = setInterval(() => {
    //             // systemState.setRobotBusy(true);
    //             const robotState = robotModel.getRobotState();

    //             // for (const [uuid, connection] of Object.entries(connections)) {
    //                 const flange = { type: 'update', value: { position: robotModel.getCurrentFlangePosition() } };
    //                 connection.send(JSON.stringify(flange));
    //             // }

    //             if (robotState === 'ROBOT_STATE_STOPPED' || robotState === 'ROBOT_STATE_IDLE') {
    //                 clearInterval(interval);
    //                 // systemState.setRobotBusy(false);
    //                 resolve();
    //             }
    //         }, 50);
    //     });
    // };

    // const robotWaitForIdle = async () => {
    //     return new Promise((resolve) => {
    //         const interval = setInterval(() => {
    //             const robotState = robotModel.getRobotState();
    
    //             if (robotState === 'ROBOT_STATE_STOPPED' || robotState === 'ROBOT_STATE_IDLE') {
    //                 clearInterval(interval);
    //                 resolve();
    //             }
    //         }, 100);
    //     })
    
    // }
    

    const orientation = [180, 0, -90];
    const {zLevel, data} = scan;
    let currWaypoint = 0;

    for(const item of data) {
        const position = {position: [item.x, item.y, zLevel], orientation: orientation}; 

        try {
            await moveLinear(position);
            await streamRobotPositions();
            const lidarPoints = await performLidarScan();
            console.debug(lidarPoints);
            await robotWaitForIdle();
        } catch (error) {
            console.error('Move failed:', error);
            break;
        }


        // commandModel.move_linear(position, async (a) => {
        //     console.debug('in cb', robotModel.getRobotState())

        // })

        // await streamRobotPositions();


        // streamRobotPositions();
        // await delay(2000);
        currWaypoint++;
        console.debug(`Waypoint ${currWaypoint} reached.`);
    }

      
    

}
//SUCCESS_SET
module.exports = beginScan;

const delay = ms => new Promise(res => setTimeout(res, ms));
