const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const http = require('http');
const express = require('express');
const {setupWebSocketServer} = require('./socket/wsServer');
const config = require('./config');
const cors = require('cors');
const routes = require('./routes/router');
const authMiddleware = require('./middleware/authToken');
const errorMiddleware = require('./middleware/errorHandler');


const app = express();
const server = http.createServer(app);
const host = config.API.HOST;
const mongoURI = config.MONGO.URI;
const corsOptions = {
	origin: "*",
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	preflightContinue: false,
	optionsSuccessStatus: 200
}

const setupServer = (port, rodiAPI) => {
    console.debug('mongoURI', mongoURI)
    console.debug('mongoURI', host)

    app.use(express.json());
    app.use(cors(corsOptions));
    setupWebSocketServer(server, rodiAPI);
    app.use(authMiddleware);
    app.use(routes);
    app.use(errorMiddleware);
    

    return server.listen(port, host, () => {
        console.debug(`Server is running on ${host}:${port}`);
    });
}

module.exports = {setupServer}