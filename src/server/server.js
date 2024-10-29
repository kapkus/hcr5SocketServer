const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const http = require('http');
const { MongoClient } = require('mongodb');
const express = require('express');
const config = require('./config');
const cors = require('cors');
const routes = require('./routes/router');

const app = express();
const server = http.createServer(app);
const host = config.API.HOST;
const corsOptions = {
	origin: "*",
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	preflightContinue: false,
	optionsSuccessStatus: 200
}
const mongoURI = config.MONGO.URI;

const setupServer = (port) => {
    console.debug('mongoURI', mongoURI)
    console.debug('mongoURI', host)

    http.createServer(app);
    app.use(express.json());
    app.use(cors(corsOptions));
    app.use(routes);
    
    // const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

    // client.connect().then(() => {
    //     return server.listen(port, host, () => {
    //         console.debug(`Server is running on ${host}:${port}`);
    //     });
    // }).catch(err => {
    //     console.error('Failed to connect to MongoDB', err);
    //     process.exit(1);
    // });

    return server.listen(port, host, () => {
        console.debug(`Server is running on ${host}:${port}`);
    });
}

module.exports = {setupServer}