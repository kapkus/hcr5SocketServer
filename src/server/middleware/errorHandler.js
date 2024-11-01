// const logger = require("../utils/logger");
const errorCodes = require('../utility/errorCodes');

const errorHandler = (err, req, res, next) => {
    // logger.error(err.stack);

    console.debug(err)

    const errObj = errorCodes(err); 

    const responseObj = {
        code: err.code || "NOT_CATCHED",
        msg: errObj.msg || "Unknown error occured",
    };


    res.status(errObj.status || 500).json(responseObj);
}

module.exports = errorHandler;