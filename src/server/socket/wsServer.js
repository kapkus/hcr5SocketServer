const WebSocket = require('ws');
const uuidv4 = require('uuid/v4');
const { authenticateSocket } = require('../utility/utils');
const currentState = require('./currentState');
const LidarTcpClient = require('./lidarTcpClient');
const config = require('../config/config');
const beginScan = require('./scanArea');
const { isRobotBusy, createRobotContext, getCurrentState, streamRobotPositions, streamRobotState } = require('../utility/robotContext');
// const eventEmitter = require('../utils/eventEmitter');

const connections = {};
let commandModel = null;
let robotModel = null;

let context = null;
let tcpClient = null; 

const setupTcpEvents = async (wsServer) => {
    if (tcpClient) {
        console.error('Instance of lidar TCP connection already exists');
        return;
    }

    try {
        tcpClient = new LidarTcpClient(config.TCP_LIDAR_SERVER.HOST, config.TCP_LIDAR_SERVER.PORT);
        tcpClient.connect();
    } catch (err) {
        console.debug('Error while connecting to LIDAR:', err);
        await reconnectTcpClient(wsServer);
        return;
    }

    tcpClient.on('connected', () => {
        console.debug('TCP client connected');
        console.debug(tcpClient.status)
        const status = { type: 'lidarSocket', value: {status: tcpClient.status} };
        streamMessage(status);
    });

    tcpClient.on('message', (data) => {
        console.debug('Received from TCP:', data);
        wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    tcpClient.on('error', async (err) => {
        console.debug('TCP client error:', err.message);
        const status = { type: 'lidarSocket', value: {status: tcpClient.status} };
        streamMessage(status);
        await reconnectTcpClient(wsServer);
    });

    tcpClient.on('disconnected', async () => {
        console.debug('TCP client disconnected');
        const status = { type: 'lidarSocket', value: {status: tcpClient.status} };
        streamMessage(status);
        await reconnectTcpClient(wsServer);
    });

    return tcpClient;
};

const reconnectTcpClient = async (wsServer) => {
    while (true) {
        try {
            console.debug('Attempting to reconnect to TCP server...');

            const status = { type: 'lidarSocket', value: {status: 'onhold'} };
            streamMessage(status);

            if (tcpClient) {
                tcpClient.disconnect();
            }

            tcpClient = new LidarTcpClient(config.TCP_LIDAR_SERVER.HOST, config.TCP_LIDAR_SERVER.PORT);
            await tcpClient.connect();

            const statusSuccess = { type: 'lidarSocket', value: {status: tcpClient.status} };
            streamMessage(statusSuccess);

            console.debug('Reconnected to TCP server');
            setupTcpEvents(wsServer);

            break;
        } catch (err) {
            const status = { type: 'lidarSocket', value: {status: tcpClient.status} };
            streamMessage(status);
            console.error('Reconnection attempt failed:', err.message);
            console.debug('Retrying in 5 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
};


const setupWebSocketServer = async (server, rodiAPI) => {
    const wsServer = new WebSocket.Server({ noServer: true });
    const tcpClient = await setupTcpEvents(wsServer);

    context = createRobotContext(rodiAPI, tcpClient, connections);
    

    /** JSON webtoken authentication by socket */
    server.on('upgrade', (request, socket, head) => {
        // const isAuthenticated = authenticateSocket(request);
        // if(!isAuthenticated){
        //     socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        //     socket.destroy();
        //     return;
        // }

        wsServer.handleUpgrade(request, socket, head, connection => {
            wsServer.emit('connection', connection, request);

            const state = getCurrentState();
            const lidarStatus = { type: 'lidarSocket', value: {status: tcpClient.status} };

            connection.send(JSON.stringify(state));
            connection.send(JSON.stringify(lidarStatus));
        })
    })


    wsServer.on('connection', (connection, request) => {
        let uuid = uuidv4();
        connections[uuid] = connection;


        connection.on('message', (msg) =>{ 
            let parsedMessage = {};
            try {
                parsedMessage = JSON.parse(msg);
            } catch (err) {
                console.debug(err)
                connection.send(JSON.stringify({type: "notification", code: "WS_000", msg: "Error parsing the message"}))
            }

            switch (parsedMessage.type) {
                case "startMove":
                    if(isRobotBusy()) {
                        connection.send(JSON.stringify({type: "notification", code: "WS_001", msg: "Error - robot is busy"}))
                    }

                    context.commandModel.jog_axis({standard: "base", axis: parsedMessage.axis, direction: parsedMessage.direction, distance: -1}, (res) => {
                        if(res.message === "SUCCESS_SET") {
                            streamRobotPositions();
                        } else {
                            // TODO: logger na errorze
                            connection.send(JSON.stringify({type: "notification", code: "WS_001", msg: "Error while moving"}))
                        }
                    })
                break;

                case "stopMove":
                    context.commandModel.robot_stop(() => {
                        if(res.message === "SUCCESS_SET") {
                            // systemState.setRobotBusy(false);
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_002", msg: "Error - cannot stop the robot"}))
                        }
                    })
                break;

                case "heartbeat":
                    // TODO
                break;

                case "config": 
                    context.commandModel.config_list((res) => {
                        console.debug(res);
                    });
                break;
                case "moveHome": 
                    context.commandModel.move_home((res) => {
                        if(res.message === "SUCCESS_SET") {
                            // systemState.setRobotBusy(true);
                            streamRobotPositions();
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_003", msg: "Error moving to home position"}))
                        }
                    });
                break;
                case "servoOn":
                    context.commandModel.servo_on((res) => {
                        if(res.message === "SUCCESS_SET") {
                            // streamRobotState(connection, {type: "update", value: {servo: true}});
                            streamRobotState();
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_004", msg: "Error while turning on the servo"}))
                        }
                    });
                break;
                case "servoOff":
                    context.commandModel.servo_off((res) => {
                        if(res.message === "SUCCESS_SET") {
                            streamRobotState();
                        } else {
                            connection.send(JSON.stringify())
                        }
                    });
                break;
                case "setSpeed":
                    context.commandModel.robot_speed(parsedMessage.data, (res) => {
                        if(res.message === "SUCCESS_SET") {
                            // to musi tak być bo z jakiegoś powodu w callbacku robot nie ma jeszcze zaktualizowanego speed
                            setTimeout(() => {
                                streamRobotState();
                            }, 50)
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_006", msg: "Error while setting speed of robot"}))
                        }
                    })
                break;
                case "beginScan":
                    beginScan(context, parsedMessage);
                    // connection.send(JSON.stringify({type: "path", value: optimized}));
                break;
            }

            // console.debug("getCurrentJoint", robotModel.getCurrentJoint())
            // console.debug("getCurrentJointCurrent", robotModel.getCurrentJointCurrent())

            // commandModel.robot_limit((res) => {
            //     console.debug(res);
            //     console.debug(res.detail.PositionLimit);
            // })

            // const baseCoordinates = CoordinateModel.getBaseCoordinate();
            // const cords = getPositionVariables();
          

            // standard["base"|"tcp"], axis["x"|"y"|"z"], direction["positive"|"negative"]
            

            // const flange = robotModel.getCurrentFlangePosition()
            // console.debug(flange);
            
            // const cords = baseCoordinates.getCoordinate()

            // flange.x += 10;


            // console.debug(parsedMessage)
            // if(parsedMessage.forward){
            //     /** forwards message to robot client */
            //     // forwardMessage(msg, connection);
            // } else {
            //     // handleMessage(parsedMessage, uuid, connection);
            // }
        });
        connection.on('close', () => handleClose(uuid));


    });

    // eventEmitter.on('forwardToWs', (data) => {
    //     // console.log("u u uu u u")
    //     for( const [uuid, connection] of Object.entries(connections)) {
    //         connection.send(data)
    //     }
    //     // console.log(data)
    // })

};

/**
 * Streams custom message to clients
 * @param {*} msg 
 */
const streamMessage = (msg) => {
    for( const [uuid, connection] of Object.entries(connections)) {
        connection.send(JSON.stringify(msg))
    }
}

const waitForRobotState = (expectedState, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const interval = setInterval(() => {
            const robotState = robotModel.getRobotState();
            console.debug('Current robot state:', robotState);

            if (robotState === expectedState) {
                clearInterval(interval);
                resolve();
            }

            if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error(`Timeout waiting for state: ${expectedState}`));
            }
        }, 50);
    });
};


const findMaximumRunnableMotion = (axis) => {
    const flange = robotModel.getCurrentFlangePosition();
    const {x, y, z, rx, ry, rz} = flange;
    const step = 1; 

    let maxAxis = flange[axis];

    while(true) {

    }

    console.debug(flange);
}

//ROBOT_STATE_IDLE
// ROBOT_STATE_MOVING
// ROBOT_STATE_STOPPING
//ROBOT_STATE_STOPPED

// const handleMessage = (msg, uuid, connection) => {
//     try {

//         console.log("test")
//         const response = {
//             type: 'response',
//             message: `test: ${msg.content || ''}`
//         };

//         connection.send(JSON.stringify(response));

//     } catch (err) {
//         console.error(`error: ${err}`);
//     }
// };

// const forwardMessage = (msg, connection) => {
//     console.log(msg)
//     eventEmitter.emit('forwardToTCP', msg);

//     //TODO: forward na client robota
// }

const handleClose = (uuid) => {
    delete connections[uuid];
    console.debug(`Connection ${uuid} closed`);
};

const test = () => {
    console.debug('ouououououou')
}

module.exports = {
    setupWebSocketServer,
    waitForRobotState,
    test
};
