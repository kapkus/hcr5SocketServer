const { resolve } = require("mongodb/lib/core/topologies/read_preference");
const { streamRobotPositions } = require("../socket/wsServer");

const initScanState = {
	isRunning: false,
    isPaused: false,
    currentWaypoint: 0,
    scanFileName: '',
}

let isLidarBusy = null;
let robotContext = {};

module.exports = {
	getLidarBusy: () => {
		return isLidarBusy;
	},
	setLidarBusy: (isBusy) => {
		isLidarBusy = isBusy;
	},
	robotWaitForIdle: async () => {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				const robotState = robotContext.robotModel.getRobotState();
	
				if (robotState === 'ROBOT_STATE_STOPPED' || robotState === 'ROBOT_STATE_IDLE') {
					clearInterval(interval);
					resolve();
				}
			}, 50);
		})
	},
	getRobotContext: () => {
		return robotContext;
	},
	/**
	 * Creates robot context
	 * include models here
	 * @param {*} rodiAPI 
	 * @param {*} tcpClient 
	 * @param {*} connections 
	 * @returns 
	 */
	createRobotContext: (rodiAPI, tcpClient, connections) => {
		robotContext = {
			commandModel: rodiAPI.getCommandModel(),
			coordinateModel: rodiAPI.getCoordinateModel(),
			variableModel: rodiAPI.getVariableModel(),
			robotModel: rodiAPI.getRobotModel(),
			eventModel: rodiAPI.getEventModel(),
			softwareVersion: rodiAPI.getSoftwareVersion(),
			programModel: rodiAPI.getProgramModel(),
			tcpModel: rodiAPI.getTcpModel(),
			controllerModel: rodiAPI.getControllerModel(),
			tcpClient: tcpClient,
			connections: connections,
			scanState: initScanState	
		}

		/** DEBUG */
		
		console.debug('commandModel', robotContext.commandModel)
		console.debug('coordinateModel', robotContext.coordinateModel)
		console.debug('variableModel', robotContext.variableModel)
		console.debug('robotModel', robotContext.robotModel)
		console.debug('eventModel', robotContext.eventModel)
		console.debug('programModel', robotContext.programModel)
		console.debug('tcpModel', robotContext.tcpModel)
		console.debug('controlermodel', robotContext.controllerModel)
		

		
		return robotContext;
	},
	getCurrentState: () => {
		const state = { type: 'update', value: {} };

		// state.value.position = robotContext.robotModel.getCurrentFlangePosition();
		state.value.position = robotContext.robotModel.getCurrentTcpPosition();
		state.value.servo = robotContext.robotModel.isServoOn();
		state.value.speed = robotContext.robotModel.getSpeedFactor();

    	return state;
	},
	isRobotBusy: () => {
		const robotState = robotContext.robotModel.getRobotState();
		if (robotState === 'ROBOT_STATE_STOPPED' || robotState === 'ROBOT_STATE_IDLE') {
			return false;
		} else {
			return true;
		}
	},
	moveLinear: async (position) => {
		return new Promise((resolve, reject) => {
            robotContext.commandModel.move_linear(position, (result) => {
                if (result.message === 'SUCCESS_SET') {
                    resolve(result);
                } else {
                    reject(new Error('Move failed.'));
                }
            });
        });
	},
	/**
	 * Streams current position to clients in interval as long as robot stops moving
	 * @returns 
	 */
	streamRobotPositions: async () => {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				const robotState = robotContext.robotModel.getRobotState();
	
				for (const [uuid, connection] of Object.entries(robotContext.connections)) {
					// const flange = { type: 'update', value: { position: robotContext.robotModel.getCurrentFlangePosition() }};
					const tcp = { type: 'update', value: { position: robotContext.robotModel.getCurrentTcpPosition() }};
					connection.send(JSON.stringify(tcp));
				}
	
				if (robotState === 'ROBOT_STATE_STOPPED' || robotState === 'ROBOT_STATE_IDLE') {
					clearInterval(interval);
					resolve();
				}
			}, 100);
		});
	},
	/**
	 * Streams current state of robot to clients
	 * @param {*} streamingConn 
	 * @param {*} msg 
	 */
	streamRobotState: () => {
		// streamingConn.send(JSON.stringify(msg));

		// console.debug(robotContext.connections);
		const state = module.exports.getCurrentState();
		// console.debug(state)


		for( const [uuid, connection] of Object.entries(robotContext.connections)) {
			// if(connection !== streamingConn) {
				// const flange = { type: 'update', value: {position: robotModel.getCurrentFlangePosition()}}
				connection.send(JSON.stringify(state))
			// }
		}
	},
	// TODO nieużywane
	sendCommand: async (command) => {
		return new Promise((resolve, reject) => {
			robotContext.tcpClient.write(command, (err) => {
				if (err) {
					reject(`Failed to send command "${command}": ${err.message}`);
				} else {
					// console.log(`Command "${command}" sent`);
					resolve();
				}
			});
		});
	},
	sendLidarCommand: async (msg) => {
		try {
			// console.debug('Sending LIDAR command:', msg);
			const response = await robotContext.tcpClient.send(msg);
			// console.debug('LIDAR response received:', response);
			return response;
		} catch (err) {
			console.error('Error in sendLidarCommand:', err);
			throw err;
		}
	},
	scanSetInitState: () => {
		robotContext.scanState = initScanState;
	}
	

	
};
