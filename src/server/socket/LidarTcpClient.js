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
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.client = net.createConnection({ host: this.host, port: this.port });

            this.client.on('connect', () => {
                this.status = 'connected';
                console.log('Connected to TCP server');
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
                        this.emit('message', json);
                    } catch (err) {
                        console.error('Failed to parse JSON:', err);
                        this.emit('error', err);
                    }

                    boundary = this.buffer.indexOf('\n');
                }
            });

            this.client.on('end', () => {
                this.status = 'disconnected';
                console.log('Disconnected from TCP server');
                this.emit('disconnected');
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
            this.client.write(command + '\n', (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Command "${command}" sent`);
                    resolve();
                }
            });
        });
    }
}

module.exports = TcpClient;