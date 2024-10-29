const { MongoClient } = require('mongodb');
const config = require('./config');

let dbInstance = null;

const mongoClient = async () => {
    if (dbInstance) return dbInstance;

    try {
        const client = await MongoClient.connect(config.MONGO.URI, { useNewUrlParser: true, useUnifiedTopology: true });
        dbInstance = client.db(); 
        console.debug('connected to mongo');
        
        return dbInstance;
    } catch (err) {
        console.debug('failed to connect to mongo:', err);
        throw err;
    }
};

module.exports = mongoClient;
