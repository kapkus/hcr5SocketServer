const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authenticateToken = (req, res, next) => {
    try{
        if (req.path === '/login') {
            return next(); // public route
        }

        const authHeader = req.header('authorization');
        const token = authHeader && authHeader.split(' ')[1];
        
        if(!token){
            throw {code: "ERR_003"}
        }

        const decoded = jwt.verify(token, config.JWT.SECRET);
        req.currentUser = {
            userId: decoded.userId
        }

        next();
    }catch(err) {
        next({code: "ERR_004"})
        
    }
}

module.exports = authenticateToken;