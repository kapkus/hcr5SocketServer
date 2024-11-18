const WebSocket = require('ws');
const uuidv4 = require('uuid/v4');
const { authenticateSocket } = require('../utility/utils');
const currentState = require('./currentState');
// const eventEmitter = require('../utils/eventEmitter');

const connections = {};
let commandModel = null;
let coordinateModel = null;
let variableModel = null;
let robotModel = null;
let isRobotBusy = null;
let eventModel = null;

const setupWebSocketServer = (server, rodiAPI) => {
    const wsServer = new WebSocket.Server({ noServer: true });
    commandModel = rodiAPI.getCommandModel();
    coordinateModel = rodiAPI.getCoordinateModel();
    variableModel = rodiAPI.getVariableModel();
    robotModel = rodiAPI.getRobotModel();
    eventModel = rodiAPI.getEventModel();

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

            const state = currentState(robotModel, commandModel);
            connection.send(JSON.stringify(state))
        })
    })


    wsServer.on('connection', (connection, request) => {
        let uuid = uuidv4();
        connections[uuid] = connection;


        connection.on('message', (msg) =>{ 
            const parsedMessage = JSON.parse(msg);

            switch (parsedMessage.type) {
                case "startMove":
                    if(isRobotBusy) {
                        connection.send(JSON.stringify({type: "notification", code: "WS_001", msg: "Error - robot is busy"}))
                    }

                    commandModel.jog_axis({standard: "base", axis: parsedMessage.axis, direction: parsedMessage.direction, distance: -1}, (res) => {
                        if(res.message === "SUCCESS_SET") {
                            isRobotBusy = true;
                            streamRobotPositions();
                        } else {
                            // TODO: logger na errorze
                            connection.send(JSON.stringify({type: "notification", code: "WS_001", msg: "Error while moving"}))
                        }
                    })
                break;

                case "stopMove":
                    commandModel.robot_stop(() => {
                        if(res.message === "SUCCESS_SET") {
                            isRobotBusy = false;
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_002", msg: "Error - cannot stop the robot"}))
                        }
                    })
                break;

                case "heartbeat":
                    // TODO
                break;

                case "config": 
                    commandModel.config_list((res) => {
                        console.debug(res);
                    });
                break;
                case "moveHome": 
                    commandModel.move_home((res) => {
                        if(res.message === "SUCCESS_SET") {
                            isRobotBusy = true;
                            streamRobotPositions();
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_003", msg: "Error moving to home position"}))
                        }
                    });
                break;
                case "servoOn":
                    commandModel.servo_on((res) => {
                        if(res.message === "SUCCESS_SET") {
                            streamRobotState(connection, {type: "update", value: {servo: true}});
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_004", msg: "Error while turning on the servo"}))
                        }
                    });
                break;
                case "servoOff":
                    commandModel.servo_off((res) => {
                        if(res.message === "SUCCESS_SET") {
                            streamRobotState(connection, {type: "update", value: {servo: false}});
                        } else {
                            connection.send(JSON.stringify())
                        }
                    });
                break;
                case "setSpeed":
                    commandModel.robot_speed(parsedMessage.data, (res) => {
                        if(res.message === "SUCCESS_SET") {
                            // to musi tak być bo z jakiegoś powodu w callbacku robot nie ma jeszcze zaktualizowanego speed
                            streamRobotState(connection, {type: "update", value: {speed: parsedMessage.data}});
                        } else {
                            connection.send(JSON.stringify({type: "notification", code: "WS_006", msg: "Error while setting speed of robot"}))
                        }
                    })
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


const streamRobotState = (streamingConn, msg) => {

    streamingConn.send(JSON.stringify(msg));

    for( const [uuid, connection] of Object.entries(connections)) {
        if(connection !== streamingConn) {
            const state = currentState(robotModel, commandModel);
            // const flange = { type: 'update', value: {position: robotModel.getCurrentFlangePosition()}}
            connection.send(JSON.stringify(state))
        }
    }
}

const streamRobotPositions = () => {
    const interval = setInterval(() => {
        isRobotBusy = true;
        const robotState = robotModel.getRobotState();

        for( const [uuid, connection] of Object.entries(connections)) {
            const flange = { type: 'update', value: {position: robotModel.getCurrentFlangePosition()}}
            connection.send(JSON.stringify(flange))
        }

        if(robotState === 'ROBOT_STATE_STOPPED' || robotState === 'ROBOT_STATE_IDLE') {
            clearInterval(interval);
            isRobotBusy = false;
        }
    }, 100);
}

const getRobotPosition = ()  => {

}

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

module.exports = setupWebSocketServer;
