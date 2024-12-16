const EventEmitter = require('events');
const net = require('net');

class TcpClient extends EventEmitter {
    constructor(host, port) {
        super();
        this.host = host;
        this.port = port;
        this.client = null;
        this.buffer = '';
        this.status = 'disconnected';
        this.isConnected = false;

        this.activeRequest = null; 
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.client = net.createConnection({ host: this.host, port: this.port });

            this.client.on('connect', () => {
                this.status = 'connected';
                console.debug('Connected to TCP server');
                this.emit('connected');
                resolve();
            });

            this.client.on('error', (err) => {
                this.status = 'disconnected';
                console.error('TCP connection error:', err.message);
                this.emit('error', err);
                reject(err);
            });

            this.client.on('data', (data) => {
                this.buffer += data.toString();
            
                let boundary = this.buffer.indexOf('\n');
                while (boundary !== -1) {
                    const message = this.buffer.slice(0, boundary);
                    this.buffer = this.buffer.slice(boundary + 1);
            
                    try {
                        const json = JSON.parse(message);
                        console.debug('Parsed JSON:', json);
                        this.emit('message', json);
            
                        if (this.activeRequest) {
                            const { resolve, reject } = this.activeRequest;
                            console.debug('Resolving active request with:', json);
                            resolve(json);
                            this.activeRequest = null;
                            console.debug('Active request cleared after resolution.');
                        } else {
                            console. debug('No active request to resolve.');
                        }
                    } catch (err) {
                        console.error('Failed to parse JSON:', err, 'Message:', message);
                        this.emit('error', err);
                    }
            
                    boundary = this.buffer.indexOf('\n');
                }
            });
            
            
            

            this.client.on('end', () => {
                this.status = 'disconnected';
                console.debug('Disconnected from TCP server');
                this.emit('disconnected');
            
                if (this.activeRequest) {
                    this.activeRequest.reject(new Error('Disconnected from server during active request.'));
                    this.activeRequest = null;
                }
            });
        });
    }

    disconnect = () => {
        this.cleanup();
    }

    cleanup = () => {
        if (this.client) {
            this.client.removeAllListeners();
            this.client.destroy();
            this.client = null;
            this.status = 'disconnected';
        }
    }

    send = (command) => {
        return new Promise((resolve, reject) => {
            if (this.activeRequest) {
                console.error('A request is already pending. Rejecting new command:', command);
                reject(new Error('A request is already pending. Await the response before sending a new command.'));
                return;
            }
    
            this.activeRequest = { resolve, reject };
    
            console.debug('Sending command to server:', command);
            this.client.write(command + '\n', (err) => {
                if (err) {
                    console.error('Error sending command:', err);
                    this.activeRequest = null;
                    reject(err);
                } else {
                    console.debug('Command sent successfully:', command);
                }
            });
        });
    };
    
    
}

module.exports = TcpClient;
