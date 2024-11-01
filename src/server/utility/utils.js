const { parse } = require("url");
const jwt = require('jsonwebtoken');
const config = require('../config/config');

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
    }
}