const { parse } = require("url");
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const fs = require('fs');

module.exports = {
    authenticateSocket: (request) => {
        try {
            const {token} = parse(request.url, true).query;
            jwt.verify(token, config.JWT.SECRET);
            return true;
        } catch (err) {
            //TODO: log
            return false
        }
    },
    setupScansDir: (dirPath) => {
        try {
            if(!fs.existsSync(dirPath)){
                fs.mkdirSync(dirPath, { recursive: true });
            }
        } catch (error) {
            throw error;
        }
    }
}