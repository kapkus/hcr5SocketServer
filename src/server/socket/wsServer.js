const WebSocket = require('ws');
const uuidv4 = require('uuid/v4');
const { authenticateSocket } = require('../utility/utils');
// const eventEmitter = require('../utils/eventEmitter');

const connections = {};

const setupWebSocketServer = (server) => {
    const wsServer = new WebSocket.Server({ noServer: true });

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
        })
    })


    wsServer.on('connection', (connection, request) => {
        let uuid = uuidv4();
        connections[uuid] = connection;


        connection.on('message', (msg) =>{ 
            const parsedMessage = JSON.parse(msg);
            console.debug(parsedMessage)
            if(parsedMessage.forward){
                /** forwards message to robot client */
                // forwardMessage(msg, connection);
            } else {
                // handleMessage(parsedMessage, uuid, connection);
            }
        });
        connection.on('close', () => handleClose(uuid));

        // const tcpClient = new net.Socket();
        // tcpClient.connect();

    });

    // eventEmitter.on('forwardToWs', (data) => {
    //     // console.log("u u uu u u")
    //     for( const [uuid, connection] of Object.entries(connections)) {
    //         connection.send(data)
    //     }
    //     // console.log(data)
    // })

};



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
