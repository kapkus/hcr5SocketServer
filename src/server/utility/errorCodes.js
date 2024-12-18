const { CONSTANT: { HTTP_RESPONSE_CODE } } = require('../config/config');

const transformError = (err) => {

    switch(err.code) {
        case "ERR_001":{
            return { msg: "Not existing user", status: HTTP_RESPONSE_CODE.NOT_FOUND }
        }
        case "ERR_002":{
            return { msg: "Invalid password", status: HTTP_RESPONSE_CODE.BAD_REQUEST }
        }
        case "ERR_003":{
            return { msg: "Full authentication is required to access this resource", status: HTTP_RESPONSE_CODE.BAD_REQUEST }
        }
        case "ERR_004":{
            return { msg: "Authentication error", status: HTTP_RESPONSE_CODE.BAD_REQUEST }
        }
        case "ERR_005":{
            return { msg: "Requested file not found", status: HTTP_RESPONSE_CODE.NOT_FOUND }
        }
        case "ERR_006":{
            return { msg: "Error while downloading the file", status: HTTP_RESPONSE_CODE.INTERNAL_ERROR }
        }


        default: {
            return { msg: "Unknown error", status: HTTP_RESPONSE_CODE.INTERNAL_ERROR }
        }
    }
}

module.exports = transformError;